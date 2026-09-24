import { Store } from '@warp-drive/core';
import type { CacheCapabilitiesManager } from '@warp-drive/core/types';
import { module, test } from '@warp-drive/diagnostic';
import { JSONAPICache as Cache } from '@warp-drive/json-api';

import { deferFlushes, flush, recordDeliveries } from '../../utils/notifications';
import { TestSchema } from '../../utils/schema';

class TestStore extends Store {
  createSchemaService() {
    const schema = new TestSchema();
    schema.registerResource({
      type: 'user',
      identity: { kind: '@id', name: 'id' },
      fields: [
        { name: 'name', kind: 'field' },
        { name: 'username', kind: 'field' },
        { name: 'age', kind: 'field' },
      ],
    });
    return schema;
  }

  override createCache(wrapper: CacheCapabilitiesManager) {
    return new Cache(wrapper);
  }
}

module('Integration | NotificationManager buffer coalescing', function () {
  test('two notify() calls for the same identifier+namespace+key before one flush deliver exactly one notification', function (assert) {
    const store = new TestStore();
    const identifier = store.cacheKeyManager.getOrCreateRecordIdentifier({ type: 'user', id: '1' });

    const calls = recordDeliveries(store, identifier);

    const restore = deferFlushes(store);
    store.notifications.notify(identifier, 'attributes', 'name');
    store.notifications.notify(identifier, 'attributes', 'name');
    restore();
    flush(store);

    assert.deepEqual(
      calls,
      [['attributes', 'name']],
      'the redundant second notify() call for the same key was coalesced into the first, delivering exactly one notification'
    );
  });

  test('two notify() calls with the same single string key for `relationships` (not a Set/batch) before one flush deliver exactly one notification', function (assert) {
    // `relationships` historically only ever reached `notify()` pre-batched
    // as a single `Set` (built by `CacheCapabilitiesManager`'s own
    // accumulation), so the buffer's merge logic never had to dedupe two
    // *separate* single-string-key calls to the `relationships` namespace
    // specifically. This proves that path directly, in isolation from
    // `CacheCapabilitiesManager`/the store/cache stack entirely: the merge
    // logic for `'relationships'` is the exact same code path as
    // `'attributes'` (see `mergeIntoBuffer` in notification-manager.ts), so
    // this is the `relationships`-specific counterpart to the identical test
    // above for `attributes`.
    const store = new TestStore();
    const identifier = store.cacheKeyManager.getOrCreateRecordIdentifier({ type: 'user', id: '1' });

    const calls = recordDeliveries(store, identifier);

    const restore = deferFlushes(store);
    store.notifications.notify(identifier, 'relationships', 'key');
    store.notifications.notify(identifier, 'relationships', 'key');
    restore();
    flush(store);

    assert.deepEqual(
      calls,
      [['relationships', 'key']],
      'the redundant second notify() call for the same relationships key was coalesced into the first, delivering exactly one notification'
    );
  });

  test('a keyless call after keyed calls upgrades the namespace to a wildcard delivery', function (assert) {
    const store = new TestStore();
    const identifier = store.cacheKeyManager.getOrCreateRecordIdentifier({ type: 'user', id: '1' });

    const calls = recordDeliveries(store, identifier);

    const restore = deferFlushes(store);
    store.notifications.notify(identifier, 'attributes', 'name');
    store.notifications.notify(identifier, 'attributes', 'username');
    // a keyless call is a strict superset of any specific keys already collected
    store.notifications.notify(identifier, 'attributes', null);
    restore();
    flush(store);

    assert.deepEqual(
      calls,
      [['attributes', null]],
      'the specific keys collected so far were discarded in favor of a single wildcard (keyless) delivery'
    );
  });

  test('a keyed call after a keyless call for the same namespace is a no-op (stays a wildcard)', function (assert) {
    const store = new TestStore();
    const identifier = store.cacheKeyManager.getOrCreateRecordIdentifier({ type: 'user', id: '1' });

    const calls = recordDeliveries(store, identifier);

    const restore = deferFlushes(store);
    store.notifications.notify(identifier, 'attributes', null);
    // once the namespace is a wildcard, specific keys can never downgrade it back to a Set
    store.notifications.notify(identifier, 'attributes', 'name');
    store.notifications.notify(identifier, 'attributes', new Set(['username', 'age']));
    restore();
    flush(store);

    assert.deepEqual(
      calls,
      [['attributes', null]],
      'the wildcard delivery was preserved; the later keyed calls did not reintroduce specific keys'
    );
  });

  test('cross-namespace relative ordering within one flush is preserved by first-touch position', function (assert) {
    const store = new TestStore();
    const identifier = store.cacheKeyManager.getOrCreateRecordIdentifier({ type: 'user', id: '1' });

    const calls = recordDeliveries(store, identifier);

    const restore = deferFlushes(store);
    store.notifications.notify(identifier, 'state', null);
    store.notifications.notify(identifier, 'errors', null);
    // touching 'state' again later must not move it after 'errors' in dispatch order
    store.notifications.notify(identifier, 'state', null);
    restore();
    flush(store);

    assert.deepEqual(
      calls,
      [
        ['state', null],
        ['errors', null],
      ],
      '`state` fired first and kept its position even though it was touched again after `errors`'
    );
  });

  test('cross-namespace relative ordering reflects whichever namespace was touched first', function (assert) {
    const store = new TestStore();
    const identifier = store.cacheKeyManager.getOrCreateRecordIdentifier({ type: 'user', id: '1' });

    const calls = recordDeliveries(store, identifier);

    const restore = deferFlushes(store);
    // reversed order relative to the previous test: errors touched first this time
    store.notifications.notify(identifier, 'errors', null);
    store.notifications.notify(identifier, 'state', null);
    restore();
    flush(store);

    assert.deepEqual(
      calls,
      [
        ['errors', null],
        ['state', null],
      ],
      'dispatch order reflects first-touch order, not a fixed namespace priority'
    );
  });

  test("a later-arriving key for an already-touched namespace joins that namespace's existing slot rather than appending a second, out-of-order delivery for it", function (assert) {
    const store = new TestStore();
    const identifier = store.cacheKeyManager.getOrCreateRecordIdentifier({ type: 'user', id: '1' });

    const calls = recordDeliveries(store, identifier);

    const restore = deferFlushes(store);
    store.notifications.notify(identifier, 'attributes', 'name');
    store.notifications.notify(identifier, 'relationships', 'friends');
    // even though this arrives after `relationships` was touched, it joins
    // `attributes`'s slot at its original (first-touch) position - this is
    // the intentional tradeoff: fine-grained interleaving between different
    // namespaces' individual keys is not preserved, only the relative order
    // in which each namespace was first touched.
    store.notifications.notify(identifier, 'attributes', 'username');
    restore();
    flush(store);

    assert.deepEqual(
      calls,
      [
        ['attributes', 'name'],
        ['attributes', 'username'],
        ['relationships', 'friends'],
      ],
      'both `attributes` keys were delivered together at the position `attributes` first fired, before `relationships`, ' +
        'even though `username` was not actually notified until after `friends`'
    );
  });

  test('a Set batch and individual scalar calls for the same namespace merge into one Set before one flush', function (assert) {
    const store = new TestStore();
    const identifier = store.cacheKeyManager.getOrCreateRecordIdentifier({ type: 'user', id: '1' });

    const calls = recordDeliveries(store, identifier);

    const restore = deferFlushes(store);
    store.notifications.notify(identifier, 'attributes', new Set(['name', 'username']));
    store.notifications.notify(identifier, 'attributes', 'age');
    store.notifications.notify(identifier, 'attributes', 'name'); // duplicate, already present
    restore();
    flush(store);

    assert.deepEqual(
      calls,
      [
        ['attributes', 'name'],
        ['attributes', 'username'],
        ['attributes', 'age'],
      ],
      'the Set batch and the individual keys were merged into a single Set (in first-added order), delivering each key exactly once'
    );
  });
});
