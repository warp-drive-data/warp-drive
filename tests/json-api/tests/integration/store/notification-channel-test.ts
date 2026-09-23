import { Store } from '@warp-drive/core';
import type { CacheCapabilitiesManager } from '@warp-drive/core/types';
import { module, test } from '@warp-drive/diagnostic';
import { JSONAPICache as Cache } from '@warp-drive/json-api';

import { deferFlushes, flush, recordDeliveries } from '../../utils/notifications';
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

module('Integration | NotificationManager channels', function () {
  test('a subscriber that omits channel behaves as "local": it hears unscoped and local notifies, but not remote', function (assert) {
    const store = new TestStore();
    void store.cache; // trigger lazy createCache so _capabilities is populated
    const identifier = store.cacheKeyManager.getOrCreateRecordIdentifier({ type: 'user', id: '1' });
    const calls = recordDeliveries(store, identifier);

    // an unscoped notify() call always reaches every subscriber, regardless
    // of what channel (if any) they subscribed with.
    store._capabilities.notifyChange(identifier, 'attributes', 'name');
    assert.equal(calls.length, 1, 'received the unscoped notify');

    store._capabilities.notifyChange(identifier, 'attributes', 'name', 'local');
    assert.equal(calls.length, 2, 'received the local-channel notify');

    // a 'remote'-tagged notify declares "only the remote view changed"; a
    // local-view subscriber re-pulls reconciled local state when notified,
    // and that view did not change, so it is skipped.
    store._capabilities.notifyChange(identifier, 'attributes', 'name', 'remote');
    assert.equal(calls.length, 2, 'did not receive the remote-channel notify (the local view did not change)');
  });

  test('a subscriber scoped to "local" hears unscoped and local notifies, but not remote, same as omitting the channel', function (assert) {
    const store = new TestStore();
    void store.cache; // trigger lazy createCache so _capabilities is populated
    const identifier = store.cacheKeyManager.getOrCreateRecordIdentifier({ type: 'user', id: '1' });
    const calls = recordDeliveries(store, identifier, 'local');

    store._capabilities.notifyChange(identifier, 'attributes', 'name', 'remote');
    assert.equal(calls.length, 0, 'did not receive the remote-channel notify (the local view did not change)');

    store._capabilities.notifyChange(identifier, 'attributes', 'name', 'local');
    assert.equal(calls.length, 1, 'received the local-channel notify');

    store._capabilities.notifyChange(identifier, 'attributes', 'name');
    assert.equal(calls.length, 2, 'received the unscoped notify (unscoped reaches every subscriber)');
  });

  test('a subscriber scoped to "remote" hears unscoped and remote notifies, but not local', function (assert) {
    const store = new TestStore();
    void store.cache; // trigger lazy createCache so _capabilities is populated
    const identifier = store.cacheKeyManager.getOrCreateRecordIdentifier({ type: 'user', id: '1' });
    const calls = recordDeliveries(store, identifier, 'remote');

    store._capabilities.notifyChange(identifier, 'attributes', 'name', 'local');
    assert.equal(calls.length, 0, 'did not receive the local-channel notify');

    store._capabilities.notifyChange(identifier, 'attributes', 'name');
    assert.equal(calls.length, 1, 'received the unscoped notify (unscoped reaches every subscriber)');

    store._capabilities.notifyChange(identifier, 'attributes', 'name', 'remote');
    assert.equal(calls.length, 2, 'received the remote-channel notify');
  });

  test('a scoped notify is delivered only to that channel; unscoped reaches both', function (assert) {
    const store = new TestStore();
    void store.cache;
    const identifier = store.cacheKeyManager.getOrCreateRecordIdentifier({ type: 'user', id: '1' });
    const localCalls = recordDeliveries(store, identifier, 'local');
    const remoteCalls = recordDeliveries(store, identifier, 'remote');

    // an unscoped notify (e.g. a cache implementation that doesn't know about
    // channels) reaches everyone, exactly as it did before channels existed.
    store._capabilities.notifyChange(identifier, 'attributes', 'name');
    assert.equal(localCalls.length, 1, 'local subscriber received the unscoped notify');
    assert.equal(remoteCalls.length, 1, 'remote subscriber received the unscoped notify');

    store._capabilities.notifyChange(identifier, 'attributes', 'name', 'local');
    assert.equal(localCalls.length, 2, 'local subscriber received the local-channel notify');
    assert.equal(remoteCalls.length, 1, 'remote subscriber did not receive the local-channel notify');

    store._capabilities.notifyChange(identifier, 'attributes', 'name', 'remote');
    assert.equal(localCalls.length, 2, 'local subscriber did not receive the remote-channel notify');
    assert.equal(remoteCalls.length, 2, 'remote subscriber received the remote-channel notify');
  });

  test('non-field notification types always reach a subscriber regardless of its channel', function (assert) {
    const store = new TestStore();
    void store.cache; // trigger lazy createCache so _capabilities is populated
    const identifier = store.cacheKeyManager.getOrCreateRecordIdentifier({ type: 'user', id: '1' });
    const calls = recordDeliveries(store, identifier, 'remote');

    store._capabilities.notifyChange(identifier, 'errors', null);
    store._capabilities.notifyChange(identifier, 'identity', null);
    store._capabilities.notifyChange(identifier, 'state', null);
    assert.equal(calls.length, 3, 'a remote-scoped subscriber still hears errors/identity/state notifications');
  });

  test('a key touched once on "local" and once unscoped within one flush still delivers exactly once to both a "local"-scoped and a "remote"-scoped subscriber', function (assert) {
    const store = new TestStore();
    void store.cache; // trigger lazy createCache so _capabilities is populated
    const identifier = store.cacheKeyManager.getOrCreateRecordIdentifier({ type: 'user', id: '1' });

    const localCalls = recordDeliveries(store, identifier, 'local');
    const remoteCalls = recordDeliveries(store, identifier, 'remote');
    // omits channel, so it defaults to 'local' -- included here to confirm it
    // behaves identically to the explicit 'local' subscriber above, even in
    // this mixed-channel-dedup scenario.
    const defaultChannelCalls = recordDeliveries(store, identifier);

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

    assert.equal(localCalls.length, 1, 'the "local"-scoped subscriber was notified exactly once');
    assert.equal(
      remoteCalls.length,
      1,
      'the "remote"-scoped subscriber was notified exactly once (the unscoped touch reaches everyone)'
    );
    assert.equal(
      defaultChannelCalls.length,
      1,
      'the default-channel ("local") subscriber was notified exactly once, same as the explicit "local" subscriber'
    );
  });

  test('a key touched once on "local" and once on "remote" within one flush still delivers exactly once to each of a "local"-scoped and a "remote"-scoped subscriber', function (assert) {
    const store = new TestStore();
    void store.cache; // trigger lazy createCache so _capabilities is populated
    const identifier = store.cacheKeyManager.getOrCreateRecordIdentifier({ type: 'user', id: '1' });

    const localCalls = recordDeliveries(store, identifier, 'local');
    const remoteCalls = recordDeliveries(store, identifier, 'remote');

    const restore = deferFlushes(store);
    // the same key, touched twice before a single flush: once tagged 'local',
    // once tagged 'remote'. Each subscriber matches the touch tagged with its
    // own channel, so each must be notified exactly once -- neither zero
    // times nor twice.
    store._capabilities.notifyChange(identifier, 'attributes', 'name', 'local');
    store._capabilities.notifyChange(identifier, 'attributes', 'name', 'remote');
    restore();
    flush(store);

    assert.equal(localCalls.length, 1, 'the "local"-scoped subscriber was notified exactly once');
    assert.equal(
      remoteCalls.length,
      1,
      'the "remote"-scoped subscriber was notified exactly once, matching the "remote"-tagged touch'
    );
  });

  test('a key touched exclusively on "local" within one flush skips a "remote"-scoped subscriber entirely', function (assert) {
    const store = new TestStore();
    void store.cache; // trigger lazy createCache so _capabilities is populated
    const identifier = store.cacheKeyManager.getOrCreateRecordIdentifier({ type: 'user', id: '1' });

    const localCalls = recordDeliveries(store, identifier);
    const remoteCalls = recordDeliveries(store, identifier, 'remote');

    const restore = deferFlushes(store);
    // every touch in this flush window is explicitly 'local' -- the one case
    // a 'remote' subscriber is allowed to skip. Coalescing must not blur that:
    // repeated 'local' touches stay "exclusively local".
    store._capabilities.notifyChange(identifier, 'attributes', 'name', 'local');
    store._capabilities.notifyChange(identifier, 'attributes', 'name', 'local');
    restore();
    flush(store);

    assert.equal(localCalls.length, 1, 'the default (local) subscriber was notified exactly once');
    assert.equal(remoteCalls.length, 0, 'the "remote"-scoped subscriber was not notified at all');
  });
});
