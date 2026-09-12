import { setOwner } from '@ember/owner';

import { withDefaults } from '@warp-drive/core/reactive';
import type { ResourceKey } from '@warp-drive/core/types';
import type { Type } from '@warp-drive/core/types/symbols';
import { module, setupTest, test } from '@warp-drive/diagnostic/ember';
import { JSONAPICache } from '@warp-drive/json-api';
import { useLegacyStore } from '@warp-drive/legacy';
import { withRestoredDeprecatedModelRequestBehaviors as withLegacy } from '@warp-drive/legacy/model/migration-support';

type User = {
  id: string | null;
  $type: 'user';
  name: string;
  [Type]: 'user';
};

const Store = useLegacyStore({
  linksMode: false,
  cache: JSONAPICache,
});

interface TestStore {
  findRecord: (type: string, id: string, options: object) => Promise<unknown>;
}

/**
 * `preloadData` runs synchronously inside `findRecord`, before the request is
 * issued, so the request never has to resolve for the preload to be observable.
 * No adapter or handler is registered here; the rejection is expected and
 * swallowed.
 */
function preloadViaFindRecord(store: unknown, id: string, preload: Record<string, unknown>): void {
  void (store as TestStore).findRecord('user', id, { preload }).catch(() => undefined);
}

function setupStore(context: { owner: object }): InstanceType<typeof Store> {
  const store = new Store();
  setOwner(store, context.owner as Parameters<typeof setOwner>[1]);
  return store;
}

module('Integration | preload | relationship data is routed to `relationships`', function (hooks) {
  setupTest(hooks);

  // A resource can be in PolarisMode while the store it lives in still offers
  // the legacy `preload` option — that is the incremental-migration path. The
  // routing in `preloadData` originally recognized only LegacyMode's
  // `belongsTo`/`hasMany`, so PolarisMode's `resource`/`collection` fell
  // through to the `attributes` branch: the raw preload value was written into
  // the cache as an attribute and the relationship was never established.
  test('a PolarisMode `resource` preloaded by id becomes a relationship, not an attribute', function (assert) {
    const store = setupStore(this);
    store.schema.registerResource(
      withDefaults({
        type: 'user',
        fields: [
          { name: 'name', kind: 'field' },
          { name: 'bestFriend', kind: 'resource', type: 'user', options: { inverse: null, async: false } },
        ],
      })
    );
    const key: ResourceKey = store.cacheKeyManager.getOrCreateRecordIdentifier({ type: 'user', id: '1' });

    preloadViaFindRecord(store, '1', { bestFriend: '2' });

    const peeked = store.cache.peek(key);
    assert.deepEqual(peeked?.attributes, {}, 'the relationship id was not written into `attributes`');
    assert.deepEqual(
      peeked?.relationships,
      { bestFriend: { data: { type: 'user', id: '2', lid: '@lid:user-2' } } },
      'the relationship was established in the graph'
    );
  });

  test('a PolarisMode `collection` preloaded by ids becomes a relationship, not an attribute', function (assert) {
    const store = setupStore(this);
    store.schema.registerResource(
      withDefaults({
        type: 'user',
        fields: [
          { name: 'name', kind: 'field' },
          { name: 'friends', kind: 'collection', type: 'user', options: { inverse: null, async: false } },
        ],
      })
    );
    const key: ResourceKey = store.cacheKeyManager.getOrCreateRecordIdentifier({ type: 'user', id: '1' });

    preloadViaFindRecord(store, '1', { friends: ['2', '3'] });

    const peeked = store.cache.peek(key);
    assert.deepEqual(peeked?.attributes, {}, 'the relationship ids were not written into `attributes`');
    assert.deepEqual(
      peeked?.relationships,
      {
        friends: {
          data: [
            { type: 'user', id: '2', lid: '@lid:user-2' },
            { type: 'user', id: '3', lid: '@lid:user-3' },
          ],
        },
      },
      'the collection was established in the graph, in order'
    );
  });

  test('a PolarisMode `resource` preloaded by record instance becomes a relationship', function (assert) {
    const store = setupStore(this);
    store.schema.registerResource(
      withDefaults({
        type: 'user',
        fields: [
          { name: 'name', kind: 'field' },
          { name: 'bestFriend', kind: 'resource', type: 'user', options: { inverse: null, async: false } },
        ],
      })
    );
    const friend = store.push<User>({ data: { type: 'user', id: '2', attributes: { name: 'Wes' } } });
    const key: ResourceKey = store.cacheKeyManager.getOrCreateRecordIdentifier({ type: 'user', id: '1' });

    preloadViaFindRecord(store, '1', { bestFriend: friend });

    const peeked = store.cache.peek(key);
    assert.deepEqual(peeked?.attributes, {}, 'the record was not written into `attributes`');
    assert.deepEqual(
      peeked?.relationships,
      { bestFriend: { data: { type: 'user', id: '2', lid: '@lid:user-2' } } },
      'the identifier was extracted from the record instance'
    );
  });

  // Controls. These pass before and after the fix, and exist so that a change
  // which over-corrects — routing attributes into `relationships`, or breaking
  // the LegacyMode kinds that already worked — fails here.
  test('LegacyMode `belongsTo` and `hasMany` still route to `relationships`', function (assert) {
    const store = setupStore(this);
    store.schema.registerResource(
      withLegacy({
        type: 'user',
        fields: [
          { name: 'name', kind: 'attribute', type: null },
          { name: 'bestFriend', kind: 'belongsTo', type: 'user', options: { inverse: null, async: false } },
          { name: 'friends', kind: 'hasMany', type: 'user', options: { inverse: null, async: false } },
        ],
      })
    );
    const key: ResourceKey = store.cacheKeyManager.getOrCreateRecordIdentifier({ type: 'user', id: '1' });

    preloadViaFindRecord(store, '1', { bestFriend: '2', friends: ['3'] });

    const peeked = store.cache.peek(key);
    assert.deepEqual(peeked?.attributes, {}, 'no relationship data leaked into `attributes`');
    assert.deepEqual(
      peeked?.relationships,
      {
        bestFriend: { data: { type: 'user', id: '2', lid: '@lid:user-2' } },
        friends: { data: [{ type: 'user', id: '3', lid: '@lid:user-3' }] },
      },
      'both legacy relationship kinds were established in the graph'
    );
  });

  test('a genuine attribute is still preloaded into `attributes`', function (assert) {
    const store = setupStore(this);
    store.schema.registerResource(
      withDefaults({
        type: 'user',
        fields: [
          { name: 'name', kind: 'field' },
          { name: 'bestFriend', kind: 'resource', type: 'user', options: { inverse: null, async: false } },
        ],
      })
    );
    const key: ResourceKey = store.cacheKeyManager.getOrCreateRecordIdentifier({ type: 'user', id: '1' });

    preloadViaFindRecord(store, '1', { name: 'Chris' });

    const peeked = store.cache.peek(key);
    assert.deepEqual(peeked?.attributes, { name: 'Chris' }, 'the attribute was preloaded as an attribute');
    assert.deepEqual(peeked?.relationships, {}, 'no relationship was invented for it');
  });
});
