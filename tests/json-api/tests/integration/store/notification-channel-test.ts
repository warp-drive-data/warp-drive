import { Store } from '@warp-drive/core';
import type { CacheCapabilitiesManager } from '@warp-drive/core/types';
import { module, test } from '@warp-drive/diagnostic';
import { JSONAPICache as Cache } from '@warp-drive/json-api';

import { TestSchema } from '../../utils/schema';

class TestStore extends Store {
  declare _capabilities: CacheCapabilitiesManager;
  createSchemaService() {
    const schema = new TestSchema();
    schema.registerResource({
      type: 'user',
      identity: { kind: '@id', name: 'id' },
      fields: [{ name: 'name', kind: 'field' }],
    });
    return schema;
  }
  override createCache(wrapper: CacheCapabilitiesManager) {
    this._capabilities = wrapper;
    return new Cache(wrapper);
  }
}

interface TestableNotifications {
  _scheduleNotify: () => boolean;
  _flush: () => void;
}

/**
 * See the identical helper in `notification-coalescing-test.ts` for the full
 * rationale: this stubs out `_scheduleNotify` so every `notify()` call merges
 * into the pending buffer without triggering a flush, letting a test control
 * exactly which touches land in the same flush window before calling the
 * real, private `_flush()` to dispatch them.
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

module('Integration | NotificationManager channels', function () {
  test('a subscriber that omits channel behaves as "local": it receives every notification', function (assert) {
    const store = new TestStore();
    void store.cache; // trigger lazy createCache so _capabilities is populated
    const identifier = store.cacheKeyManager.getOrCreateRecordIdentifier({ type: 'user', id: '1' });
    let calls = 0;
    store.notifications.subscribe(identifier, () => {
      calls++;
    });

    // an unscoped notify() call always reaches every subscriber, regardless
    // of what channel (if any) they subscribed with.
    store._capabilities.notifyChange(identifier, 'attributes', 'name');
    assert.equal(calls, 1, 'received the unscoped notify');

    store._capabilities.notifyChange(identifier, 'attributes', 'name', 'local');
    assert.equal(calls, 2, 'received the local-channel notify');

    // a local view is derived from remote state, so a remote change is always
    // relevant to it: local (and defaulted) subscribers hear everything.
    store._capabilities.notifyChange(identifier, 'attributes', 'name', 'remote');
    assert.equal(calls, 3, 'received the remote-channel notify (local subscribers hear everything)');
  });

  test('a subscriber scoped to "local" receives every notification, same as omitting the channel', function (assert) {
    const store = new TestStore();
    void store.cache; // trigger lazy createCache so _capabilities is populated
    const identifier = store.cacheKeyManager.getOrCreateRecordIdentifier({ type: 'user', id: '1' });
    let calls = 0;
    store.notifications.subscribe(
      identifier,
      () => {
        calls++;
      },
      'local'
    );

    store._capabilities.notifyChange(identifier, 'attributes', 'name', 'remote');
    assert.equal(calls, 1, 'received the remote-channel notify (a remote change also affects the local view)');

    store._capabilities.notifyChange(identifier, 'attributes', 'name', 'local');
    assert.equal(calls, 2, 'received the local-channel notify');

    store._capabilities.notifyChange(identifier, 'attributes', 'name');
    assert.equal(calls, 3, 'received the unscoped notify (unscoped reaches every subscriber)');
  });

  test('a subscriber scoped to "remote" hears unscoped and remote notifies, but not local', function (assert) {
    const store = new TestStore();
    void store.cache; // trigger lazy createCache so _capabilities is populated
    const identifier = store.cacheKeyManager.getOrCreateRecordIdentifier({ type: 'user', id: '1' });
    let calls = 0;
    store.notifications.subscribe(
      identifier,
      () => {
        calls++;
      },
      'remote'
    );

    store._capabilities.notifyChange(identifier, 'attributes', 'name', 'local');
    assert.equal(calls, 0, 'did not receive the local-channel notify');

    store._capabilities.notifyChange(identifier, 'attributes', 'name');
    assert.equal(calls, 1, 'received the unscoped notify (unscoped reaches every subscriber)');

    store._capabilities.notifyChange(identifier, 'attributes', 'name', 'remote');
    assert.equal(calls, 2, 'received the remote-channel notify');
  });

  test('the only skipped delivery is an explicit "local" notify to an explicit "remote" subscriber', function (assert) {
    const store = new TestStore();
    void store.cache;
    const identifier = store.cacheKeyManager.getOrCreateRecordIdentifier({ type: 'user', id: '1' });
    let localCalls = 0;
    let remoteCalls = 0;
    store.notifications.subscribe(
      identifier,
      () => {
        localCalls++;
      },
      'local'
    );
    store.notifications.subscribe(
      identifier,
      () => {
        remoteCalls++;
      },
      'remote'
    );

    // an unscoped notify (e.g. a cache implementation that doesn't know about
    // channels) reaches everyone, exactly as it did before channels existed.
    store._capabilities.notifyChange(identifier, 'attributes', 'name');
    assert.equal(localCalls, 1, 'local subscriber received the unscoped notify');
    assert.equal(remoteCalls, 1, 'remote subscriber received the unscoped notify');

    store._capabilities.notifyChange(identifier, 'attributes', 'name', 'local');
    assert.equal(localCalls, 2, 'local subscriber received the local-channel notify');
    assert.equal(remoteCalls, 1, 'remote subscriber did not receive the local-channel notify');

    store._capabilities.notifyChange(identifier, 'attributes', 'name', 'remote');
    assert.equal(
      localCalls,
      3,
      'local subscriber received the remote-channel notify (a remote change also affects the local view)'
    );
    assert.equal(remoteCalls, 2, 'remote subscriber received the remote-channel notify');
  });

  test('non-field notification types always reach a subscriber regardless of its channel', function (assert) {
    const store = new TestStore();
    void store.cache; // trigger lazy createCache so _capabilities is populated
    const identifier = store.cacheKeyManager.getOrCreateRecordIdentifier({ type: 'user', id: '1' });
    let calls = 0;
    store.notifications.subscribe(
      identifier,
      () => {
        calls++;
      },
      'remote'
    );

    store._capabilities.notifyChange(identifier, 'errors', null);
    store._capabilities.notifyChange(identifier, 'identity', null);
    store._capabilities.notifyChange(identifier, 'state', null);
    assert.equal(calls, 3, 'a remote-scoped subscriber still hears errors/identity/state notifications');
  });

  test('a key touched once on "local" and once unscoped within one flush still delivers exactly once to both a "local"-scoped and a "remote"-scoped subscriber', function (assert) {
    const store = new TestStore();
    void store.cache; // trigger lazy createCache so _capabilities is populated
    const identifier = store.cacheKeyManager.getOrCreateRecordIdentifier({ type: 'user', id: '1' });

    let localCalls = 0;
    let remoteCalls = 0;
    let defaultChannelCalls = 0;
    store.notifications.subscribe(
      identifier,
      () => {
        localCalls++;
      },
      'local'
    );
    store.notifications.subscribe(
      identifier,
      () => {
        remoteCalls++;
      },
      'remote'
    );
    // omits channel, so it defaults to 'local' -- included here to confirm it
    // behaves identically to the explicit 'local' subscriber above, even in
    // this mixed-channel-dedup scenario.
    store.notifications.subscribe(identifier, () => {
      defaultChannelCalls++;
    });

    const restore = deferFlushes(store);
    // the same key, touched twice before a single flush: once tagged 'local',
    // once left unscoped. An unscoped touch always reaches every subscriber
    // (regardless of what channel, if any, they subscribed with), so both the
    // 'local'-scoped and 'remote'-scoped subscriber must each be notified --
    // but only once, even though the key was touched twice.
    store._capabilities.notifyChange(identifier, 'attributes', 'name', 'local');
    store._capabilities.notifyChange(identifier, 'attributes', 'name');
    restore();
    flush(store);

    assert.equal(localCalls, 1, 'the "local"-scoped subscriber was notified exactly once');
    assert.equal(
      remoteCalls,
      1,
      'the "remote"-scoped subscriber was notified exactly once (the unscoped touch reaches everyone)'
    );
    assert.equal(
      defaultChannelCalls,
      1,
      'the default-channel ("local") subscriber was notified exactly once, same as the explicit "local" subscriber'
    );
  });

  test('a key touched once on "local" and once on "remote" within one flush still delivers exactly once to each of a "local"-scoped and a "remote"-scoped subscriber', function (assert) {
    const store = new TestStore();
    void store.cache; // trigger lazy createCache so _capabilities is populated
    const identifier = store.cacheKeyManager.getOrCreateRecordIdentifier({ type: 'user', id: '1' });

    let localCalls = 0;
    let remoteCalls = 0;
    store.notifications.subscribe(
      identifier,
      () => {
        localCalls++;
      },
      'local'
    );
    store.notifications.subscribe(
      identifier,
      () => {
        remoteCalls++;
      },
      'remote'
    );

    const restore = deferFlushes(store);
    // the same key, touched twice before a single flush: once tagged 'local',
    // once tagged 'remote'. The 'local' subscriber hears everything and the
    // 'remote' subscriber matches the 'remote'-tagged touch, so each must be
    // notified exactly once -- neither zero times nor twice.
    store._capabilities.notifyChange(identifier, 'attributes', 'name', 'local');
    store._capabilities.notifyChange(identifier, 'attributes', 'name', 'remote');
    restore();
    flush(store);

    assert.equal(localCalls, 1, 'the "local"-scoped subscriber was notified exactly once');
    assert.equal(
      remoteCalls,
      1,
      'the "remote"-scoped subscriber was notified exactly once, matching the "remote"-tagged touch'
    );
  });

  test('a key touched exclusively on "local" within one flush skips a "remote"-scoped subscriber entirely', function (assert) {
    const store = new TestStore();
    void store.cache; // trigger lazy createCache so _capabilities is populated
    const identifier = store.cacheKeyManager.getOrCreateRecordIdentifier({ type: 'user', id: '1' });

    let localCalls = 0;
    let remoteCalls = 0;
    store.notifications.subscribe(identifier, () => {
      localCalls++;
    });
    store.notifications.subscribe(
      identifier,
      () => {
        remoteCalls++;
      },
      'remote'
    );

    const restore = deferFlushes(store);
    // every touch in this flush window is explicitly 'local' -- the one case
    // a 'remote' subscriber is allowed to skip. Coalescing must not blur that:
    // repeated 'local' touches stay "exclusively local".
    store._capabilities.notifyChange(identifier, 'attributes', 'name', 'local');
    store._capabilities.notifyChange(identifier, 'attributes', 'name', 'local');
    restore();
    flush(store);

    assert.equal(localCalls, 1, 'the default (local) subscriber was notified exactly once');
    assert.equal(remoteCalls, 0, 'the "remote"-scoped subscriber was not notified at all');
  });
});
