import { getOwner, setOwner } from '@ember/owner';

import { useRecommendedStore } from '@warp-drive/core';
import { module, setupTest, test } from '@warp-drive/diagnostic/ember';
import { JSONAPICache } from '@warp-drive/json-api';

module('WarpDrive | useRecommendedStore | handlers callback', function (hooks) {
  setupTest(hooks);

  test('handlers may be a function that receives the store instance', function (assert) {
    let receivedStore: unknown;
    const AppStore = useRecommendedStore({
      cache: JSONAPICache,
      handlers: (store) => {
        receivedStore = store;
        return [];
      },
    });
    const store = new AppStore();
    setOwner(store, this.owner);

    assert.ok(store.requestManager, 'requestManager is created');
    assert.equal(receivedStore, store, 'the callback received the store instance');
  });

  test('the handlers callback can access the owner for DI lookups', function (assert) {
    class FeatureFlags {
      isEnabled = true;
      static create(): FeatureFlags {
        return new this();
      }
    }
    this.owner.register('service:feature-flags', FeatureFlags);

    let sawFlagEnabled = false;
    const AppStore = useRecommendedStore({
      cache: JSONAPICache,
      handlers: (store) => {
        const owner = getOwner(store)!;
        const flags = owner.lookup('service:feature-flags') as FeatureFlags;
        sawFlagEnabled = flags.isEnabled;
        return [];
      },
    });
    const store = new AppStore();
    setOwner(store, this.owner);

    void store.requestManager;
    assert.true(sawFlagEnabled, 'the callback could access owner injections');
  });

  test('the handlers callback is only invoked once', function (assert) {
    let callCount = 0;
    const AppStore = useRecommendedStore({
      cache: JSONAPICache,
      handlers: () => {
        callCount++;
        return [];
      },
    });
    const store = new AppStore();
    setOwner(store, this.owner);

    void store.requestManager;
    void store.requestManager;
    assert.equal(callCount, 1, 'the handlers callback is only invoked once');
  });

  test('a plain array of handlers continues to work', function (assert) {
    const AppStore = useRecommendedStore({
      cache: JSONAPICache,
      handlers: [
        {
          request() {
            return Promise.resolve({ data: null });
          },
        },
      ],
    });
    const store = new AppStore();
    setOwner(store, this.owner);

    assert.ok(store.requestManager, 'requestManager is created from a plain array');
  });
});
