import type { NotificationType } from '@warp-drive/core';
import { Store } from '@warp-drive/core';
import type { CacheCapabilitiesManager } from '@warp-drive/core/types';
import type { ResourceKey } from '@warp-drive/core/types/identifier';
import { module, test } from '@warp-drive/diagnostic';
import { JSONAPICache as Cache } from '@warp-drive/json-api';

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

// subscriber callbacks are typed as `key?: string`, but a keyless/wildcard
// dispatch passes `null` through at runtime (see `_flushNotification`), so
// the tuple type here must allow for it.
type Call = [type: NotificationType, key: string | null | undefined];

interface TestableNotifications {
  _scheduleNotify: () => boolean;
  _flush: () => void;
}

/**
 * `NotificationManager#notify` only buffers multiple calls together (instead
 * of each individually flushing on its own) when a consumer (e.g. an app
 * using `@warp-drive/ember`/`@warp-drive/react`) has configured signal hooks
 * and is inside an active async-flush window. Rather than depending on that
 * unrelated, environment-specific machinery to test the buffer's merge and
 * dispatch logic in isolation, we stub out `_scheduleNotify` (the method
 * responsible for deciding *when* to flush) to always defer, so every
 * `notify()` call in a test merges into the pending buffer without
 * triggering a flush. Calling the real, private `_flush()` afterwards then
 * lets us assert on exactly what was buffered and in what order it is
 * dispatched.
 */
function deferFlushes(store: Store): () => void {
  const notifications = store.notifications as unknown as TestableNotifications;
  const original = notifications._scheduleNotify;
  notifications._scheduleNotify = () => false;
  return () => {
    notifications._scheduleNotify = original;
  };
}

function flush(store: Store): void {
  (store.notifications as unknown as TestableNotifications)._flush();
}

module('Integration | NotificationManager buffer coalescing', function () {
  test('two notify() calls for the same identifier+namespace+key before one flush deliver exactly one notification', function (assert) {
    const store = new TestStore();
    const identifier = store.cacheKeyManager.getOrCreateRecordIdentifier({ type: 'user', id: '1' });

    const calls: Call[] = [];
    const token = store.notifications.subscribe(
      identifier,
      (_key: ResourceKey, type: NotificationType, key?: string | null) => {
        calls.push([type, key]);
      }
    );

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

    store.notifications.unsubscribe(token);
  });

  test('a keyless call after keyed calls upgrades the namespace to a wildcard delivery', function (assert) {
    const store = new TestStore();
    const identifier = store.cacheKeyManager.getOrCreateRecordIdentifier({ type: 'user', id: '1' });

    const calls: Call[] = [];
    const token = store.notifications.subscribe(
      identifier,
      (_key: ResourceKey, type: NotificationType, key?: string | null) => {
        calls.push([type, key]);
      }
    );

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

    store.notifications.unsubscribe(token);
  });

  test('a keyed call after a keyless call for the same namespace is a no-op (stays a wildcard)', function (assert) {
    const store = new TestStore();
    const identifier = store.cacheKeyManager.getOrCreateRecordIdentifier({ type: 'user', id: '1' });

    const calls: Call[] = [];
    const token = store.notifications.subscribe(
      identifier,
      (_key: ResourceKey, type: NotificationType, key?: string | null) => {
        calls.push([type, key]);
      }
    );

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

    store.notifications.unsubscribe(token);
  });

  test('cross-namespace relative ordering within one flush is preserved by first-touch position', function (assert) {
    const store = new TestStore();
    const identifier = store.cacheKeyManager.getOrCreateRecordIdentifier({ type: 'user', id: '1' });

    const calls: Call[] = [];
    const token = store.notifications.subscribe(
      identifier,
      (_key: ResourceKey, type: NotificationType, key?: string | null) => {
        calls.push([type, key]);
      }
    );

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

    store.notifications.unsubscribe(token);
  });

  test('cross-namespace relative ordering reflects whichever namespace was touched first', function (assert) {
    const store = new TestStore();
    const identifier = store.cacheKeyManager.getOrCreateRecordIdentifier({ type: 'user', id: '1' });

    const calls: Call[] = [];
    const token = store.notifications.subscribe(
      identifier,
      (_key: ResourceKey, type: NotificationType, key?: string | null) => {
        calls.push([type, key]);
      }
    );

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

    store.notifications.unsubscribe(token);
  });

  test("a later-arriving key for an already-touched namespace joins that namespace's existing slot rather than appending a second, out-of-order delivery for it", function (assert) {
    const store = new TestStore();
    const identifier = store.cacheKeyManager.getOrCreateRecordIdentifier({ type: 'user', id: '1' });

    const calls: Call[] = [];
    const token = store.notifications.subscribe(
      identifier,
      (_key: ResourceKey, type: NotificationType, key?: string | null) => {
        calls.push([type, key]);
      }
    );

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

    store.notifications.unsubscribe(token);
  });

  test('a Set batch and individual scalar calls for the same namespace merge into one Set before one flush', function (assert) {
    const store = new TestStore();
    const identifier = store.cacheKeyManager.getOrCreateRecordIdentifier({ type: 'user', id: '1' });

    const calls: Call[] = [];
    const token = store.notifications.subscribe(
      identifier,
      (_key: ResourceKey, type: NotificationType, key?: string | null) => {
        calls.push([type, key]);
      }
    );

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

    store.notifications.unsubscribe(token);
  });
});
