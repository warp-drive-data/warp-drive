import type { NotificationType } from '@warp-drive/core';
import { Store } from '@warp-drive/core';
import { registerDerivations, SchemaService, withDefaults } from '@warp-drive/core/reactive';
import type { CacheCapabilitiesManager } from '@warp-drive/core/types';
import type { ResourceKey } from '@warp-drive/core/types/identifier';
import { module, test } from '@warp-drive/diagnostic';
import { JSONAPICache as Cache } from '@warp-drive/json-api';

/**
 * Uses the real `SchemaService` rather than the test app's `TestSchema`
 * because only the real one implements `cacheFields`. `calculateChangedKeys`
 * receives whatever `getCacheFields` returns, and `getCacheFields` falls back
 * to the much broader `fields()` map for any schema service that does not
 * implement `cacheFields` — so a `TestSchema`-based store would exercise a
 * field set that no application actually sees.
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
            options: { inverse: 'bestFriend', async: false, linksMode: true },
          },
          {
            name: 'friends',
            kind: 'hasMany',
            type: 'user',
            options: { inverse: 'friends', async: false, linksMode: true },
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

// subscriber callbacks are typed as `key?: string`, but a keyless/wildcard
// dispatch passes `null` through at runtime (see `_flushNotification`), so
// the tuple type here must allow for it.
type Call = [type: NotificationType, key: string | null | undefined];

module('Integration | JSONAPICache | changed keys are filtered by field kind', function () {
  test('a relationship carrying data in both `attributes` and `relationships` is not announced as an attributes change', function (assert) {
    const store = new TestStore();
    const cache = store.cache;
    const identifier = store.cacheKeyManager.getOrCreateRecordIdentifier({ type: 'user', id: '1' });

    // seed the cache so the second upsert is an update (`existed === true`),
    // which is the only case in which changed keys are calculated at all.
    cache.upsert(
      identifier,
      {
        type: 'user',
        id: '1',
        attributes: { name: 'Chris' },
        relationships: {
          bestFriend: { data: { type: 'user', id: '2' } },
          friends: { data: [{ type: 'user', id: '2' }] },
        },
      },
      false
    );

    const calls: Call[] = [];
    const token = store.notifications.subscribe(
      identifier,
      (_key: ResourceKey, type: NotificationType, key?: string | null) => {
        calls.push([type, key]);
      }
    );

    // {json:api} requires a resource's fields to share one namespace, so a
    // name cannot appear as both an attribute and a relationship:
    // https://jsonapi.org/format/#document-resource-object-fields
    //
    // This payload violates that — `bestFriend` and `friends` carry data in
    // `attributes` *and* in `relationships`. It is the realistic shape of the
    // mistake (a serializer emitting linkage into the wrong bucket), and it is
    // the only way to reach the branch under test.
    cache.upsert(
      identifier,
      {
        type: 'user',
        id: '1',
        attributes: {
          // positive control: a genuine attribute change, so that a silent
          // no-op cannot masquerade as this test passing.
          name: 'Chris Thoburn',
          // duplicated out of `relationships` below. Both names are fields on
          // `user`, so they pass the cache-field membership check — but they
          // are relationships, their data lives in the graph rather than in
          // `remoteAttrs`, and nothing reads them through the attribute path.
          bestFriend: { type: 'user', id: '3' },
          friends: [{ type: 'user', id: '3' }],
        },
        relationships: {
          bestFriend: { data: { type: 'user', id: '3' } },
          friends: { data: [{ type: 'user', id: '3' }] },
        },
      },
      true
    );

    store.notifications.unsubscribe(token);

    // Assert on the notifications rather than on a property read: outside a
    // tracking frame a getter re-reads the cache every time, and `bestFriend`
    // resolves through the graph regardless, so a value assertion passes with
    // or without the defect.
    //
    // `deepEqual` on the whole delivered sequence rather than a `notOk` on the
    // bad keys, so that an over-broad fix silencing the genuine `name` change
    // fails here too.
    assert.deepEqual(
      calls,
      [['attributes', 'name']],
      'only the genuine attribute change was announced under `attributes`; the relationship names duplicated into `attributes` were not'
    );
  });

  test('a relationship carrying data ONLY in `attributes` is not announced, and its data is discarded', function (assert) {
    const store = new TestStore();
    const cache = store.cache;
    const identifier = store.cacheKeyManager.getOrCreateRecordIdentifier({ type: 'user', id: '1' });

    cache.upsert(
      identifier,
      {
        type: 'user',
        id: '1',
        attributes: { name: 'Chris' },
        relationships: { bestFriend: { data: { type: 'user', id: '2' } } },
      },
      false
    );

    const calls: Call[] = [];
    const token = store.notifications.subscribe(
      identifier,
      (_key: ResourceKey, type: NotificationType, key?: string | null) => {
        calls.push([type, key]);
      }
    );

    // the same namespace violation, but with no `relationships` member at all,
    // so `setupRelationships` never runs and the graph never sees this data.
    cache.upsert(
      identifier,
      {
        type: 'user',
        id: '1',
        attributes: {
          name: 'Chris Thoburn',
          bestFriend: { type: 'user', id: '3' },
        },
      },
      true
    );

    store.notifications.unsubscribe(token);

    assert.deepEqual(
      calls,
      [['attributes', 'name']],
      'only the genuine attribute change was announced; `bestFriend` in `attributes` was not'
    );

    // The relationship is unmoved: the payload's `bestFriend` never reached the
    // graph, because only `data.relationships` feeds it. Pre-fix, the announced
    // `attributes`/`bestFriend` change invalidated this field's signal anyway,
    // so a reader re-read it and got back the value it already had.
    assert.deepEqual(
      cache.getRelationship(identifier, 'bestFriend').data,
      store.cacheKeyManager.getOrCreateRecordIdentifier({ type: 'user', id: '2' }),
      'the relationship still points at the originally-linked resource, unaffected by the data in `attributes`'
    );
  });
});
