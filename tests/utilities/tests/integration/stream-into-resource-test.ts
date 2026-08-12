import type { TestContext } from '@ember/test-helpers';

import JSONAPICache from '@ember-data/json-api';
import Model, { attr, buildSchema, instantiateRecord, modelFor, teardownRecord } from '@ember-data/model';
import RequestManager from '@ember-data/request';
import { streamIntoResource, streamJsonLines } from '@ember-data/request-utils/streaming';
import DataStore, { CacheHandler } from '@ember-data/store';
import type { CacheCapabilitiesManager, ModelSchema } from '@ember-data/store/types';
import type { Cache } from '@warp-drive/core-types/cache';
import type { ResourceKey } from '@warp-drive/core-types/identifier';
import type { Value } from '@warp-drive/core-types/json/raw';
import type { ExistingResourceObject } from '@warp-drive/core-types/spec/json-api-raw';
import { module, test } from '@warp-drive/diagnostic';
import { setupTest } from '@warp-drive/diagnostic/ember';

class TestStore extends DataStore {
  constructor(args: unknown) {
    super(args);

    const manager = (this.requestManager = new RequestManager());
    manager.useCache(CacheHandler);
  }

  createSchemaService(): ReturnType<typeof buildSchema> {
    return buildSchema(this);
  }

  override createCache(capabilities: CacheCapabilitiesManager): Cache {
    return new JSONAPICache(capabilities);
  }

  override instantiateRecord(key: ResourceKey, createRecordArgs: { [key: string]: unknown }): unknown {
    return instantiateRecord.call(this, key, createRecordArgs);
  }

  override teardownRecord(record: Model): void {
    return teardownRecord.call(this, record);
  }

  override modelFor(type: string): ModelSchema {
    return modelFor.call(this, type) as ModelSchema;
  }
}

interface Message {
  chunk: string;
  [key: string]: Value;
}

class Conversation extends Model {
  @attr declare messages: Message[];
  @attr declare isStreaming: boolean;
}

interface ConversationResource extends ExistingResourceObject<'conversation'> {
  attributes: {
    messages: Message[];
    isStreaming: boolean;
  };
}

function streamOf(chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk));
      }
      controller.close();
    },
  });
}

module('Integration | streaming | streamIntoResource', function (hooks) {
  setupTest(hooks);

  test('pushes each decoded chunk into the store as it arrives', async function (this: TestContext, assert) {
    const { owner } = this;
    owner.register('service:store', TestStore);
    owner.register('model:conversation', Conversation);
    const store = owner.lookup('service:store') as TestStore;

    const initial: ConversationResource = {
      type: 'conversation',
      id: '1',
      attributes: { messages: [], isStreaming: true },
    };

    const key = store.cacheKeyManager.getOrCreateRecordIdentifier({ type: 'conversation', id: '1' });
    const source = streamJsonLines<Message>(streamOf(['{"chunk":"hello"}\n{"chunk":"world"}\n']));
    const cacheLengthsBeforeEachChunk: number[] = [];

    const result = await streamIntoResource<ConversationResource, Message>({
      store,
      resource: initial,
      source,
      reduce: (resource, chunk) => {
        // peeking here proves each prior chunk was already pushed to the
        // cache before the next chunk is processed, not just at the end.
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion -- peekRecord's declared return is `unknown`; without this, `.messages` access below does not typecheck
        const cached = store.peekRecord(key) as Conversation | null;
        cacheLengthsBeforeEachChunk.push(cached?.messages.length ?? 0);
        return {
          ...resource,
          attributes: { ...resource.attributes, messages: [...resource.attributes.messages, chunk] },
        };
      },
      onSettled: (resource) => ({
        ...resource,
        attributes: { ...resource.attributes, isStreaming: false },
      }),
    });

    assert.deepEqual(
      result.attributes.messages,
      [{ chunk: 'hello' }, { chunk: 'world' }],
      'the returned resource reflects every folded chunk'
    );
    assert.false(result.attributes.isStreaming, 'onSettled was applied to the final resource');
    assert.deepEqual(
      cacheLengthsBeforeEachChunk,
      [0, 1],
      'the cache reflected each prior chunk before the next one was folded in'
    );

    const conversation = store.peekRecord(key) as Conversation;
    assert.deepEqual(conversation.messages, [{ chunk: 'hello' }, { chunk: 'world' }], 'the cache reflects the stream');
    assert.false(conversation.isStreaming, 'the cache reflects the settled flag');
  });

  test('still pushes the settled resource when the source throws mid-stream', async function (this: TestContext, assert) {
    const { owner } = this;
    owner.register('service:store', TestStore);
    owner.register('model:conversation', Conversation);
    const store = owner.lookup('service:store') as TestStore;

    const initial: ConversationResource = {
      type: 'conversation',
      id: '2',
      attributes: { messages: [], isStreaming: true },
    };

    async function* failingSource(): AsyncGenerator<Message> {
      await Promise.resolve();
      yield { chunk: 'hello' };
      throw new Error('boom');
    }

    await assert.throws(
      () =>
        streamIntoResource<ConversationResource, Message>({
          store,
          resource: initial,
          source: failingSource(),
          reduce: (resource, chunk) => ({
            ...resource,
            attributes: { ...resource.attributes, messages: [...resource.attributes.messages, chunk] },
          }),
          onSettled: (resource) => ({
            ...resource,
            attributes: { ...resource.attributes, isStreaming: false },
          }),
        }),
      /boom/
    );

    const key = store.cacheKeyManager.getOrCreateRecordIdentifier({ type: 'conversation', id: '2' });
    const conversation = store.peekRecord(key) as Conversation;
    assert.deepEqual(conversation.messages, [{ chunk: 'hello' }], 'the chunk received before the error was pushed');
    assert.false(conversation.isStreaming, 'onSettled still ran and was pushed despite the error');
  });
});
