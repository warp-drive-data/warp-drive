import { module, test } from '@warp-drive/diagnostic';
import { effect, field, LocalResource, SessionResource } from '@warp-drive/experiments/storage';

/** A unique resource id per test so tests never share persisted state. */
function freshId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2)}`;
}

module('Unit | storage | StorageResource', function () {
  module('@field defaults and persistence', function () {
    test('an unset field returns its class-declared default', function (assert) {
      @SessionResource(freshId('defaults'))
      class Settings {
        @field theme = 'light';
      }
      const settings = new Settings();
      assert.equal(settings.theme, 'light');
    });

    test('setting a field persists it, readable from a new instance with the same id', function (assert) {
      const id = freshId('shared-id');

      @SessionResource(id)
      class SettingsA {
        @field theme = 'light';
      }
      const a = new SettingsA();
      a.theme = 'dark';

      @SessionResource(id)
      class SettingsB {
        @field theme = 'light';
      }
      const b = new SettingsB();
      assert.equal(b.theme, 'dark', 'a second class sharing the same resource id sees the persisted value');
    });

    test('object values round-trip through JSON serialization', function (assert) {
      @SessionResource(freshId('object-field'))
      class Filters {
        @field selected: string[] = [];
      }
      const filters = new Filters();
      filters.selected = ['a', 'b', 'c'];
      assert.deepEqual(filters.selected, ['a', 'b', 'c']);
    });

    test('two instances of a singleton (no primary key) resource share state', function (assert) {
      @SessionResource(freshId('singleton'))
      class Counter {
        @field count = 0;
      }
      const first = new Counter();
      const second = new Counter();

      first.count = 5;
      assert.equal(second.count, 5, 'a plain string id makes every instance share the same storage');
    });
  });

  module('LocalResource with a primary-key function', function () {
    test('each instance keyed by a different id gets isolated storage', function (assert) {
      const namespace = freshId('pk-ns');

      @LocalResource((instance: { id: string }) => `${namespace}:${instance.id}`)
      class PerUserSetting {
        id: string;
        @field value = 'default';

        constructor(id: string) {
          this.id = id;
        }
      }

      const forAlice = new PerUserSetting('alice');
      const forBob = new PerUserSetting('bob');

      forAlice.value = 'alice-value';
      forBob.value = 'bob-value';

      assert.equal(forAlice.value, 'alice-value');
      assert.equal(forBob.value, 'bob-value');
    });

    test('two instances constructed with the same key share state', function (assert) {
      const namespace = freshId('pk-shared');

      @LocalResource((instance: { id: string }) => `${namespace}:${instance.id}`)
      class PerUserSetting {
        id: string;
        @field value = 'default';

        constructor(id: string) {
          this.id = id;
        }
      }

      const first = new PerUserSetting('shared-user');
      const second = new PerUserSetting('shared-user');

      first.value = 'updated';
      assert.equal(second.value, 'updated');
    });
  });

  module('field storage-type overrides', function () {
    test("field('session') persists via sessionStorage even on a LocalResource", function (assert) {
      const id = freshId('mixed-storage');

      @LocalResource(id)
      class Mixed {
        @field('local') localField = 'local-default';
        @field('session') sessionField = 'session-default';
      }
      const mixed = new Mixed();
      mixed.localField = 'local-value';
      mixed.sessionField = 'session-value';

      assert.equal(localStorage.getItem(`persisted:${id}:localField`), JSON.stringify('local-value'));
      assert.equal(sessionStorage.getItem(`persisted:${id}:sessionField`), JSON.stringify('session-value'));
    });
  });

  module('@effect', function () {
    test('runs when a storage event reports a change to the field key', async function (assert) {
      const id = freshId('effect');

      let resolveTransition: (value: { from: unknown; to: unknown }) => void;
      const transition = new Promise<{ from: unknown; to: unknown }>((resolve) => {
        resolveTransition = resolve;
      });

      @SessionResource(id)
      class Notifier {
        @effect((update) => {
          resolveTransition({ from: update.from, to: update.to });
        })
        status = 'idle';
      }

      new Notifier();

      // Effects are installed asynchronously (a microtask after field setup),
      // so dispatch the simulated cross-tab event after yielding.
      await new Promise((resolve) => setTimeout(resolve, 0));

      window.dispatchEvent(
        new StorageEvent('storage', {
          storageArea: sessionStorage,
          key: `persisted:${id}:status`,
          oldValue: JSON.stringify('idle'),
          newValue: JSON.stringify('active'),
        })
      );

      assert.deepEqual(await transition, { from: 'idle', to: 'active' });
    });
  });
});
