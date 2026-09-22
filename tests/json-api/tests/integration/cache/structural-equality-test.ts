import type { NotificationType, Store } from '@warp-drive/core';
import { recordIdentifierFor, useRecommendedStore } from '@warp-drive/core';
import { checkout, withDefaults } from '@warp-drive/core/reactive';
import type { ResourceKey } from '@warp-drive/core/types/identifier';
import type { Value } from '@warp-drive/core/types/json/raw';
import type { Type } from '@warp-drive/core/types/symbols';
import { module, test } from '@warp-drive/diagnostic';
import type { TestContext } from '@warp-drive/diagnostic/-types';
import { JSONAPICache } from '@warp-drive/json-api';

/**
 * Attribute values compared by reference always look changed on a re-push of equal content, even
 * when nothing a reader could observe actually moved. Structural equality -- arrays element-wise,
 * plain objects key-wise ignoring key order -- is what lets a re-push of the same content stay
 * silent, and it is what lets a local edit that a push happens to confirm actually get pruned.
 * Anything that is not a plain array or plain object (a `Date`, for instance) falls back to
 * reference/strict inequality, which is a documented limitation rather than a bug.
 */

// a type alias, not an interface: attribute values need an implicit index signature to satisfy
// the cache's `Value` type
type Message = { id: string; state: string };

interface ExistingUser {
  [Type]: 'user';
  id: string;
  firstName: string;
  lastName: string;
  messages: Message[];
  settings: Record<string, unknown> | null;
}

interface CustomContext extends TestContext {
  store: Store;
}

function flush(store: Store): void {
  (store.notifications as unknown as { _flush: () => void })._flush();
}

/** Records the `attributes` keys delivered to a subscriber on the given channel. */
function watch(store: Store, record: unknown, channel: 'local' | 'remote'): string[] {
  const keys: string[] = [];
  store.notifications.subscribe(
    recordIdentifierFor(record as object),
    (_cacheKey: ResourceKey, type: NotificationType, key?: string | null) => {
      if (type === 'attributes') keys.push(String(key));
    },
    channel
  );
  return keys;
}

function pushUser(store: Store, messages: Message[] = []): ExistingUser {
  store.push({
    data: {
      type: 'user',
      id: '1',
      attributes: { firstName: 'Chris', lastName: 'Thoburn', messages },
    },
  });
  return store.peekRecord<ExistingUser>('user', '1')!;
}

module<CustomContext>('Integration | <JSONAPICache> structural equality of attribute values', function (hooks) {
  hooks.beforeEach(function () {
    const TestStore = useRecommendedStore({
      cache: JSONAPICache,
      schemas: [
        withDefaults({
          type: 'user',
          fields: [
            { name: 'firstName', kind: 'field' },
            { name: 'lastName', kind: 'field' },
            { name: 'messages', kind: 'schema-array', type: 'message' },
            { name: 'settings', kind: 'object' },
          ],
        }),
        {
          type: 'message',
          identity: null,
          fields: [
            { name: 'id', kind: 'field' },
            { name: 'state', kind: 'field' },
          ],
        },
      ],
    });
    this.store = new TestStore();
  });

  test<CustomContext>('re-pushing an equal-content schema-array does not notify either channel', function (assert) {
    const { store } = this;
    const user = pushUser(store, [{ id: 'm1', state: 'pending' }]);
    const remote = watch(store, user, 'remote');
    const local = watch(store, user, 'local');

    // a fresh array/object literal with the same content, not the same reference
    store.push({
      data: {
        type: 'user',
        id: '1',
        attributes: { firstName: 'Chris', lastName: 'Thoburn', messages: [{ id: 'm1', state: 'pending' }] },
      },
    });
    flush(store);

    assert.deepEqual(remote, [], 'remote heard nothing for an equal-content re-push');
    assert.deepEqual(local, [], 'local heard nothing for an equal-content re-push');
  });

  test<CustomContext>('re-pushing a schema-array with one changed element notifies both channels', function (assert) {
    const { store } = this;
    const user = pushUser(store, [{ id: 'm1', state: 'pending' }]);
    const remote = watch(store, user, 'remote');
    const local = watch(store, user, 'local');

    store.push({
      data: {
        type: 'user',
        id: '1',
        attributes: { firstName: 'Chris', lastName: 'Thoburn', messages: [{ id: 'm1', state: 'executed' }] },
      },
    });
    flush(store);

    assert.true(remote.includes('messages'), `remote heard the changed element (saw ${remote.join()})`);
    assert.true(local.includes('messages'), `local heard the changed element (saw ${local.join()})`);
  });

  test<CustomContext>('re-pushing an equal object with keys in a different order does not notify', function (assert) {
    const { store } = this;
    store.push({
      data: {
        type: 'user',
        id: '1',
        attributes: { firstName: 'Chris', lastName: 'Thoburn', messages: [], settings: { a: 1, b: 2 } },
      },
    });
    const user = store.peekRecord<ExistingUser>('user', '1')!;
    const remote = watch(store, user, 'remote');
    const local = watch(store, user, 'local');

    store.push({
      data: {
        type: 'user',
        id: '1',
        attributes: { firstName: 'Chris', lastName: 'Thoburn', messages: [], settings: { b: 2, a: 1 } },
      },
    });
    flush(store);

    assert.deepEqual(remote, [], 'remote heard nothing for a key-order-only difference');
    assert.deepEqual(local, [], 'local heard nothing for a key-order-only difference');
  });

  test<CustomContext>('re-pushing an equal object whose nested value is a non-plain object still notifies', function (assert) {
    const { store } = this;
    store.push({
      data: {
        type: 'user',
        id: '1',
        attributes: {
          firstName: 'Chris',
          lastName: 'Thoburn',
          messages: [],
          settings: { when: new Date(0) } as unknown as Value,
        },
      },
    });
    const user = store.peekRecord<ExistingUser>('user', '1')!;
    const remote = watch(store, user, 'remote');

    // a distinct `Date` instance with the same time value -- non-plain objects fall back to
    // reference/strict inequality rather than attempting a structural comparison
    store.push({
      data: {
        type: 'user',
        id: '1',
        attributes: {
          firstName: 'Chris',
          lastName: 'Thoburn',
          messages: [],
          settings: { when: new Date(0) } as unknown as Value,
        },
      },
    });
    flush(store);

    assert.true(remote.includes('settings'), `remote heard the non-plain-object fallback (saw ${remote.join()})`);
  });

  test<CustomContext>('a nested local edit confirmed by an equal-content push is dropped', async function (assert) {
    const { store } = this;
    const user = pushUser(store, [{ id: 'm1', state: 'pending' }]);
    const lid = recordIdentifierFor(user);
    const remote = watch(store, user, 'remote');

    const editable = await checkout<ExistingUser>(user);
    editable.messages[0].state = 'executed';
    flush(store);

    const localAfterEdit = watch(store, user, 'local');
    store.push({
      data: {
        type: 'user',
        id: '1',
        attributes: { firstName: 'Chris', lastName: 'Thoburn', messages: [{ id: 'm1', state: 'executed' }] },
      },
    });
    flush(store);

    assert.false(store.cache.hasChangedAttrs(lid), 'the confirmed nested edit is no longer dirty');
    assert.true(remote.includes('messages'), `remote heard the confirming push (saw ${remote.join()})`);
    assert.deepEqual(localAfterEdit, [], 'the confirming push emitted nothing on the local channel');
  });

  test<CustomContext>('re-pushing an equal-content array under a diverging nested local edit does not notify', async function (assert) {
    const { store } = this;
    const user = pushUser(store, [{ id: 'm1', state: 'pending' }]);
    const lid = recordIdentifierFor(user);
    const remote = watch(store, user, 'remote');

    const editable = await checkout<ExistingUser>(user);
    editable.messages[0].state = 'executed';
    flush(store);

    const localAfterEdit = watch(store, user, 'local');
    // the original, still-current remote content, re-pushed as a fresh literal
    store.push({
      data: {
        type: 'user',
        id: '1',
        attributes: { firstName: 'Chris', lastName: 'Thoburn', messages: [{ id: 'm1', state: 'pending' }] },
      },
    });
    flush(store);

    assert.deepEqual(remote, [], 'the re-push matches the existing remote state exactly');
    assert.deepEqual(localAfterEdit, [], 'the re-push did not wake the local channel');
    assert.equal(editable.messages[0].state, 'executed', 'the diverging local edit survives the equal-content re-push');
    assert.true(store.cache.hasChangedAttrs(lid), 'the local edit is still dirty');
  });
});
