import type { TestContext } from '@ember/test-helpers';

import { parse } from 'graphql';

import JSONAPICache from '@ember-data/json-api';
import Model, { attr, buildSchema, instantiateRecord, modelFor, teardownRecord } from '@ember-data/model';
import type { Future, Handler, RequestContext, StructuredDataDocument } from '@ember-data/request';
import RequestManager from '@ember-data/request';
import { deleteRecord } from '@ember-data/request-utils/graphql';
import DataStore, { CacheHandler, recordIdentifierFor } from '@ember-data/store';
import type { CacheCapabilitiesManager, ModelSchema } from '@ember-data/store/types';
import type { Cache } from '@warp-drive/core-types/cache';
import type { ResourceKey } from '@warp-drive/core-types/identifier';
import type { CollectionResourceDataDocument, SingleResourceDataDocument } from '@warp-drive/core-types/spec/document';
import type { ApiError } from '@warp-drive/core-types/spec/error';
import { module, test } from '@warp-drive/diagnostic';
import type { Diagnostic } from '@warp-drive/diagnostic/-types';
import { setupTest } from '@warp-drive/diagnostic/ember';
import { GraphQLToJSONAPIHandler } from '@warp-drive/utilities/handlers';

const DELETE_USER = parse(`
  mutation DeleteUser($id: ID!) {
    deleteUser(id: $id)
  }
`);

class User extends Model {
  @attr declare name: string;
}

module('Integration - graphql deleteRecord', function (hooks) {
  setupTest(hooks);

  function setup(owner: TestContext['owner'], assert: Diagnostic, graphqlResponse: () => unknown) {
    class TestCache extends JSONAPICache {
      override willCommit(key: ResourceKey): void {
        assert.step(`willCommit ${key.lid}`);
        return super.willCommit(key, null);
      }
      didCommit(
        cacheKey: ResourceKey,
        result: StructuredDataDocument<SingleResourceDataDocument> | null
      ): SingleResourceDataDocument;
      didCommit(
        cacheKey: ResourceKey[],
        result: StructuredDataDocument<SingleResourceDataDocument> | null
      ): SingleResourceDataDocument;
      didCommit(
        cacheKey: ResourceKey[],
        result: StructuredDataDocument<CollectionResourceDataDocument> | null
      ): CollectionResourceDataDocument;
      didCommit(
        cacheKey: ResourceKey | ResourceKey[],
        result: StructuredDataDocument<SingleResourceDataDocument | CollectionResourceDataDocument> | null
      ): CollectionResourceDataDocument | SingleResourceDataDocument {
        assert.step(`didCommit ${Array.isArray(cacheKey) ? cacheKey.map((k) => k.lid).join(',') : cacheKey.lid}`);
        // @ts-expect-error TS doesn't handle overload forwarding
        return super.didCommit(cacheKey, result);
      }
      commitWasRejected(cacheKey: ResourceKey | ResourceKey[], errors?: ApiError[]): void {
        assert.step(
          `commitWasRejected ${Array.isArray(cacheKey) ? cacheKey.map((k) => k.lid).join(',') : cacheKey.lid}`
        );
        return super.commitWasRejected(cacheKey, errors);
      }
    }

    // stands in for the network: answers the way a GraphQL server does, with the body of a 200 response
    const Network: Handler = {
      request<T>(context: RequestContext): Promise<T | StructuredDataDocument<T>> | Future<T> {
        assert.step(`handle ${context.request.op} request`);
        return Promise.resolve(graphqlResponse() as T);
      },
    };

    class Store extends DataStore {
      constructor(args: unknown) {
        super(args);
        const manager = (this.requestManager = new RequestManager());
        manager.use([new GraphQLToJSONAPIHandler(), Network]);
        manager.useCache(CacheHandler);
      }
      createSchemaService(): ReturnType<typeof buildSchema> {
        return buildSchema(this);
      }
      override createCache(capabilities: CacheCapabilitiesManager): Cache {
        return new TestCache(capabilities);
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

    owner.register('service:store', Store);
    owner.register('model:user', User);
    const store = owner.lookup('service:store') as Store;
    const user = store.push({ data: { type: 'user', id: '1', attributes: { name: 'Chris' } } }) as User;

    return { store, user, key: recordIdentifierFor(user) };
  }

  test('a delete whose mutation returns a Boolean is committed', async function (this: TestContext, assert) {
    const { store, user, key } = setup(this.owner, assert, () => ({ data: { deleteUser: true } }));

    store.deleteRecord(user);
    assert.equal(user.currentState.stateName, 'root.deleted.uncommitted', 'the user is deleted locally');

    await store.request(deleteRecord(user, DELETE_USER, { id: '1' }, { namespace: 'graphql' }));

    assert.equal(user.currentState.stateName, 'root.deleted.saved', 'the deletion is saved');
    assert.false(user.hasDirtyAttributes, 'the user is not dirty');
    assert.verifySteps([`willCommit ${key.lid}`, 'handle deleteRecord request', `didCommit ${key.lid}`]);
  });

  test('a delete whose mutation returns an id is committed', async function (this: TestContext, assert) {
    const { store, user, key } = setup(this.owner, assert, () => ({
      data: { deleteUser: { __typename: 'DeleteUserPayload', id: '1' } },
    }));

    store.deleteRecord(user);
    await store.request(deleteRecord(user, DELETE_USER, { id: '1' }, { namespace: 'graphql' }));

    assert.equal(user.currentState.stateName, 'root.deleted.saved', 'the deletion is saved');
    assert.equal(store.peekAll('delete-user-payload').length, 0, 'the payload did not become a resource');
    assert.verifySteps([`willCommit ${key.lid}`, 'handle deleteRecord request', `didCommit ${key.lid}`]);
  });

  test('a delete whose payload only has a message is committed, not rejected as an error', async function (this: TestContext, assert) {
    const { store, user, key } = setup(this.owner, assert, () => ({
      data: { deleteUser: { __typename: 'DeleteUserPayload', message: 'Deleted' } },
    }));

    store.deleteRecord(user);
    await store.request(deleteRecord(user, DELETE_USER, { id: '1' }, { namespace: 'graphql' }));

    assert.equal(user.currentState.stateName, 'root.deleted.saved', 'the deletion is saved');
    assert.verifySteps([`willCommit ${key.lid}`, 'handle deleteRecord request', `didCommit ${key.lid}`]);
  });

  test('a delete whose mutation has errors is rejected, even with a 200 response', async function (this: TestContext, assert) {
    const { store, user, key } = setup(this.owner, assert, () => ({
      errors: [{ message: 'Not allowed', path: ['deleteUser'] }],
    }));

    store.deleteRecord(user);

    try {
      await store.request(deleteRecord(user, DELETE_USER, { id: '1' }, { namespace: 'graphql' }));
      assert.ok(false, 'the request should reject');
    } catch (e: unknown) {
      assert.true(e instanceof Error, 'the request rejects with an error');
    }

    assert.equal(user.currentState.stateName, 'root.deleted.uncommitted', 'the deletion was not committed');
    assert.true(user.hasDirtyAttributes, 'the user is still dirty');
    assert.verifySteps([`willCommit ${key.lid}`, 'handle deleteRecord request', `commitWasRejected ${key.lid}`]);
  });
});
