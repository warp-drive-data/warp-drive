import { Store } from '@warp-drive/core';
import { registerDerivations, SchemaService, withDefaults } from '@warp-drive/core/reactive';
import type { CacheCapabilitiesManager, ResourceKey } from '@warp-drive/core/types';
import type { ResourceObject } from '@warp-drive/core/types/spec/json-api-raw';
import { module, test } from '@warp-drive/diagnostic';
import { JSONAPICache as Cache } from '@warp-drive/json-api';
import { serializeResources } from '@warp-drive/utilities/json-api';

/**
 * Uses the real `SchemaService` rather than the test app's `TestSchema`
 * because only the real one implements `cacheFields`. The filter consults
 * whatever `getCacheFields` returns, and that falls back to the much broader
 * `fields()` map for a schema service without `cacheFields` — a field set no
 * application actually sees.
 */
class TestStore extends Store {
  createSchemaService() {
    const schema = new SchemaService();
    registerDerivations(schema);
    schema.registerResource(
      withDefaults({
        type: 'user',
        fields: [
          { name: 'name', kind: 'field' },
          {
            name: 'bestFriend',
            kind: 'belongsTo',
            type: 'user',
            options: { inverse: null, async: false, linksMode: true },
          },
        ],
      })
    );
    return schema;
  }

  override createCache(wrapper: CacheCapabilitiesManager) {
    return new Cache(wrapper);
  }
}

/**
 * {json:api} requires a resource's fields to share one namespace, so this
 * payload — carrying `bestFriend` in `attributes` *and* `relationships` — is
 * invalid. It is the realistic shape of the mistake: a serializer emitting
 * linkage into the wrong bucket alongside the right one.
 *
 * https://jsonapi.org/format/#document-resource-object-fields
 */
function malformedPayload(): ResourceObject {
  return {
    type: 'user',
    id: '1',
    attributes: { name: 'Chris', bestFriend: { type: 'user', id: '2' } },
    relationships: { bestFriend: { data: { type: 'user', id: '2' } } },
  };
}

module('Integration | JSONAPICache | relationship data never enters `remoteAttrs`', function () {
  test('`upsert` does not merge a relationship name from `attributes` into the cached attributes', function (assert) {
    const store = new TestStore();
    const key: ResourceKey = store.cacheKeyManager.getOrCreateRecordIdentifier({ type: 'user', id: '1' });

    store.cache.upsert(key, malformedPayload(), false);

    const peeked = store.cache.peek(key) as ResourceObject;
    assert.deepEqual(peeked.attributes, { name: 'Chris' }, 'only the genuine attribute is in `attributes`');
    assert.deepEqual(
      peeked.relationships,
      { bestFriend: { data: { type: 'user', id: '2', lid: '@lid:user-2' } } },
      'the relationship is still established from the `relationships` member'
    );
  });

  // This is the consequence that reaches the network. `serializeResources`
  // builds its body from `cache.peek`, and post-processes only the
  // `relationships` member — so anything left in `attributes` is sent as-is.
  // Before this change the request body carried `bestFriend` in both buckets,
  // making the *outgoing* document invalid too.
  test('a subsequent save does not echo the phantom attribute back to the API', function (assert) {
    const store = new TestStore();
    const key: ResourceKey = store.cacheKeyManager.getOrCreateRecordIdentifier({ type: 'user', id: '1' });

    store.cache.upsert(key, malformedPayload(), false);

    const body = serializeResources(store.cache, key);
    assert.deepEqual(
      body.data,
      {
        type: 'user',
        id: '1',
        attributes: { name: 'Chris' },
        relationships: { bestFriend: { data: { id: '2', type: 'user' } } },
      },
      'the serialized document carries `bestFriend` only under `relationships`'
    );
  });

  test('`didCommit` does not merge a relationship name from the save response into the cached attributes', function (assert) {
    const store = new TestStore();
    const key: ResourceKey = store.cacheKeyManager.getOrCreateRecordIdentifier({ type: 'user', id: '1' });

    store.cache.upsert(key, { type: 'user', id: '1', attributes: { name: 'Chris' } }, false);
    store.cache.willCommit(key, null);
    store.cache.didCommit(key, {
      request: {},
      response: new Response(),
      content: { data: malformedPayload() },
    } as unknown as Parameters<typeof store.cache.didCommit>[1]);

    const peeked = store.cache.peek(key) as ResourceObject;
    assert.deepEqual(peeked.attributes, { name: 'Chris' }, 'the save response did not add a phantom attribute');
  });

  // Control: the filter must not touch anything that legitimately belongs in
  // `attributes`, including a field the schema does not declare — those are
  // already tolerated by the cache and this change does not alter that.
  test('genuine attributes are unaffected', function (assert) {
    const store = new TestStore();
    const key: ResourceKey = store.cacheKeyManager.getOrCreateRecordIdentifier({ type: 'user', id: '1' });

    store.cache.upsert(key, { type: 'user', id: '1', attributes: { name: 'Chris', notInSchema: 'kept' } }, false);

    const peeked = store.cache.peek(key) as ResourceObject;
    assert.deepEqual(
      peeked.attributes,
      { name: 'Chris', notInSchema: 'kept' },
      'declared and undeclared attributes both survive'
    );
  });
});
