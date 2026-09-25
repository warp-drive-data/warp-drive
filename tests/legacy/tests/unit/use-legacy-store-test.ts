import { getOwner, setOwner } from '@ember/owner';

import { DEBUG } from '@warp-drive/core/build-config/env';
import { module, setupTest, test } from '@warp-drive/diagnostic/ember';
import { JSONAPICache } from '@warp-drive/json-api';
import { useLegacyStore } from '@warp-drive/legacy';
import { withRestoredDeprecatedModelRequestBehaviors as withLegacy } from '@warp-drive/legacy/model/migration-support';

module('WarpDrive | useLegacyStore | handlers callback', function (hooks) {
  setupTest(hooks);

  test('handlers may be a function that receives the store instance', function (assert) {
    let receivedStore: unknown;
    const AppStore = useLegacyStore({
      linksMode: true,
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
    const AppStore = useLegacyStore({
      linksMode: true,
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
    const AppStore = useLegacyStore({
      linksMode: true,
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
    const AppStore = useLegacyStore({
      linksMode: true,
      cache: JSONAPICache,
      handlers: [
        {
          request(context, next) {
            return next(context.request);
          },
        },
      ],
    });
    const store = new AppStore();
    setOwner(store, this.owner);

    assert.ok(store.requestManager, 'requestManager is created from a plain array');
  });
});

module('WarpDrive | useLegacyStore | linksMode', function (hooks) {
  setupTest(hooks);

  test('createRecord works when linksMode is on', function (assert) {
    const AppStore = useLegacyStore({
      linksMode: true,
      cache: JSONAPICache,
      schemas: [
        withLegacy({
          type: 'user',
          fields: [{ name: 'name', type: null, kind: 'attribute' }],
        }),
      ],
    });
    const store = new AppStore();
    setOwner(store, this.owner);

    const record = store.createRecord('user', { name: 'Rey Skybarker' }) as { id: string | null; name: string };

    assert.equal(record.id, null, 'no adapter generated an id');
    assert.equal(record.name, 'Rey Skybarker', 'the record was created');
  });

  if (DEBUG) {
    test('calling adapterFor directly still asserts when linksMode is on', async function (assert) {
      const AppStore = useLegacyStore({
        linksMode: true,
        cache: JSONAPICache,
      });
      const store = new AppStore();
      setOwner(store, this.owner);

      await assert.expectAssertion(() => {
        // eslint-disable-next-line warp-drive/no-legacy-request-patterns
        store.adapterFor('user');
      }, /useLegacyStore was setup in linksMode/);
    });
  }
});
