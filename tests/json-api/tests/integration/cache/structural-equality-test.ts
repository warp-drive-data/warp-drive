import type { NotificationType, Store } from '@warp-drive/core';
import { recordIdentifierFor, useRecommendedStore } from '@warp-drive/core';
import { checkout, withDefaults } from '@warp-drive/core/reactive';
import type { ResourceKey } from '@warp-drive/core/types/identifier';
import type { ObjectValue } from '@warp-drive/core/types/json/raw';
import { Type } from '@warp-drive/core/types/symbols';
import { module, test } from '@warp-drive/diagnostic';
import type { TestContext } from '@warp-drive/diagnostic/-types';
import { JSONAPICache } from '@warp-drive/json-api';

/**
 * How the cache decides whether an attribute value changed. A `schema-object`, and each element of a
 * `schema-array`, compares by the identity hash its `ObjectSchema` declares, so the schema owns the
 * definition of "same". Everything else, including a schema-object with `identity: null` and the
 * unstructured `object` and `array` kinds, compares by reference and so notifies on every re-push
 * of a fresh payload. That over-notification is by design (see #10094): content equality is the
 * schema's to define, not the cache's to guess.
 */

// type aliases, not interfaces: attribute values need an implicit index signature to satisfy the
// cache's `Value` type
type Message = { id: string; state: string; note?: string };
type Sticker = { kind: 'sticker'; code: string };
type Reaction = { kind: 'reaction'; emoji: string; count: number };

interface ExistingUser {
  [Type]: 'user';
  id: string;
  firstName: string;
  lastName: string;
  messages: Message[];
  attachments: Array<Sticker | Reaction>;
  unhashedProfile: { bio: string } | null;
  settings: Record<string, unknown> | null;
  nickname: string;
}

interface CustomContext extends TestContext {
  store: Store;
}

// only `id` and `state` participate, so a change to `note` alone is not a change
function hashMessage(data: object): string {
  const { id, state } = data as Message;
  return `${id}:${state}`;
}
hashMessage[Type] = 'message-hash';

function hashSticker(data: object): string {
  return `sticker:${(data as Sticker).code}`;
}
hashSticker[Type] = 'sticker-hash';

function hashReaction(data: object): string {
  const { emoji, count } = data as Reaction;
  return `reaction:${emoji}:${count}`;
}
hashReaction[Type] = 'reaction-hash';

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

const BASE_ATTRS = { firstName: 'Chris', lastName: 'Thoburn' };

function pushUser(store: Store, attrs: Record<string, unknown> = {}): ExistingUser {
  store.push({
    data: { type: 'user', id: '1', attributes: { ...BASE_ATTRS, messages: [], ...attrs } },
  });
  return store.peekRecord<ExistingUser>('user', '1')!;
}

module<CustomContext>('Integration | <JSONAPICache> equality of attribute values', function (hooks) {
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
            {
              name: 'attachments',
              kind: 'schema-array',
              type: 'attachment',
              options: { polymorphic: true, type: 'kind' },
            },
            { name: 'unhashedProfile', kind: 'schema-object', type: 'profile' },
            { name: 'settings', kind: 'object' },
            // a legacy `defaultValue()` function is the one kind of default the cache memoizes
            { name: 'nickname', kind: 'field', options: { defaultValue: () => 'anon' } as unknown as ObjectValue },
          ],
        }),
        {
          type: 'message',
          identity: { kind: '@hash', name: null, type: 'message-hash' },
          fields: [
            { name: 'id', kind: 'field' },
            { name: 'state', kind: 'field' },
            { name: 'note', kind: 'field' },
          ],
        },
        {
          type: 'sticker',
          identity: { kind: '@hash', name: null, type: 'sticker-hash' },
          fields: [
            { name: 'kind', kind: 'field' },
            { name: 'code', kind: 'field' },
          ],
        },
        {
          type: 'reaction',
          identity: { kind: '@hash', name: null, type: 'reaction-hash' },
          fields: [
            { name: 'kind', kind: 'field' },
            { name: 'emoji', kind: 'field' },
            { name: 'count', kind: 'field' },
          ],
        },
        {
          type: 'profile',
          identity: null,
          fields: [{ name: 'bio', kind: 'field' }],
        },
      ],
    });
    this.store = new TestStore();
    this.store.schema.registerHashFn(hashMessage);
    this.store.schema.registerHashFn(hashSticker);
    this.store.schema.registerHashFn(hashReaction);
  });

  test<CustomContext>('re-pushing an equal-hash schema-array does not notify either channel', function (assert) {
    const { store } = this;
    const user = pushUser(store, { messages: [{ id: 'm1', state: 'pending' }] });
    const remote = watch(store, user, 'remote');
    const local = watch(store, user, 'local');

    // a fresh array/object literal with the same content, not the same reference
    pushUser(store, { messages: [{ id: 'm1', state: 'pending' }] });
    flush(store);

    assert.deepEqual(remote, [], 'remote heard nothing for an equal-hash re-push');
    assert.deepEqual(local, [], 'local heard nothing for an equal-hash re-push');
  });

  test<CustomContext>('re-pushing a schema-array with a changed hashed field notifies both channels', function (assert) {
    const { store } = this;
    const user = pushUser(store, { messages: [{ id: 'm1', state: 'pending' }] });
    const remote = watch(store, user, 'remote');
    const local = watch(store, user, 'local');

    pushUser(store, { messages: [{ id: 'm1', state: 'executed' }] });
    flush(store);

    assert.true(remote.includes('messages'), `remote heard the changed element (saw ${remote.join()})`);
    assert.true(local.includes('messages'), `local heard the changed element (saw ${local.join()})`);
  });

  test<CustomContext>('the hash decides: a change to a field the hash ignores does not notify', function (assert) {
    const { store } = this;
    const user = pushUser(store, { messages: [{ id: 'm1', state: 'pending', note: 'a' }] });
    const remote = watch(store, user, 'remote');

    pushUser(store, { messages: [{ id: 'm1', state: 'pending', note: 'b' }] });
    flush(store);

    assert.deepEqual(remote, [], 'note is outside the hash, so the schema says nothing changed');
  });

  test<CustomContext>('a polymorphic schema-array resolves the hash per element type', function (assert) {
    const { store } = this;
    const attachments = [
      { kind: 'sticker', code: 'wave' },
      { kind: 'reaction', emoji: '👋', count: 2 },
    ];
    const user = pushUser(store, { attachments });
    const remote = watch(store, user, 'remote');

    pushUser(store, { attachments: attachments.map((a) => ({ ...a })) });
    flush(store);
    assert.deepEqual(remote, [], 'equal hashes across two element types stay silent');

    pushUser(store, { attachments: [attachments[0], { kind: 'reaction', emoji: '👋', count: 3 }] });
    flush(store);
    assert.deepEqual(remote, ['attachments'], 'a changed hashed field on one element notifies');

    pushUser(store, { attachments: [attachments[0], { kind: 'sticker', code: 'wave' }] });
    flush(store);
    assert.deepEqual(remote, ['attachments', 'attachments'], 'an element changing type notifies');
  });

  test<CustomContext>('a schema-object with identity: null compares by reference and notifies on an equal-content re-push', function (assert) {
    const { store } = this;
    const user = pushUser(store, { unhashedProfile: { bio: 'hi' } });
    const remote = watch(store, user, 'remote');

    pushUser(store, { unhashedProfile: { bio: 'hi' } });
    flush(store);

    assert.deepEqual(remote, ['unhashedProfile'], 'no hash declared, so a fresh object is a change');
  });

  test<CustomContext>('an unstructured object field compares by reference and notifies on an equal-content re-push', function (assert) {
    const { store } = this;
    const user = pushUser(store, { settings: { a: 1, b: 2 } });
    const remote = watch(store, user, 'remote');

    pushUser(store, { settings: { a: 1, b: 2 } });
    flush(store);

    assert.deepEqual(remote, ['settings'], 'object fields have no schema to hash against');
  });

  // the scalar counterpart, which holds by reference equality alone, is in did-commit-notification-test.ts
  test<CustomContext>('a nested local edit confirmed by an equal-hash push is dropped', async function (assert) {
    const { store } = this;
    const user = pushUser(store, { messages: [{ id: 'm1', state: 'pending' }] });
    const lid = recordIdentifierFor(user);
    const remote = watch(store, user, 'remote');

    const editable = await checkout<ExistingUser>(user);
    editable.messages[0].state = 'executed';
    flush(store);

    const localAfterEdit = watch(store, user, 'local');
    pushUser(store, { messages: [{ id: 'm1', state: 'executed' }] });
    flush(store);

    assert.false(store.cache.hasChangedAttrs(lid), 'the confirmed nested edit is no longer dirty');
    assert.true(remote.includes('messages'), `remote heard the confirming push (saw ${remote.join()})`);
    assert.deepEqual(localAfterEdit, [], 'the confirming push emitted nothing on the local channel');
  });

  test<CustomContext>('re-pushing an equal-hash array under a diverging nested local edit does not notify', async function (assert) {
    const { store } = this;
    const user = pushUser(store, { messages: [{ id: 'm1', state: 'pending' }] });
    const lid = recordIdentifierFor(user);
    const remote = watch(store, user, 'remote');

    const editable = await checkout<ExistingUser>(user);
    editable.messages[0].state = 'executed';
    flush(store);

    const localAfterEdit = watch(store, user, 'local');
    // the original, still-current remote content, re-pushed as a fresh literal
    pushUser(store, { messages: [{ id: 'm1', state: 'pending' }] });
    flush(store);

    assert.deepEqual(remote, [], 'the re-push matches the existing remote state exactly');
    assert.deepEqual(localAfterEdit, [], 'the re-push did not wake the local channel');
    assert.equal(editable.messages[0].state, 'executed', 'the diverging local edit survives the equal-hash re-push');
    assert.true(store.cache.hasChangedAttrs(lid), 'the local edit is still dirty');
  });

  test<CustomContext>('a push carrying the value a memoized default already supplies does not notify', function (assert) {
    const { store } = this;
    const user = pushUser(store);
    // reading the field memoizes the default, so both projections now resolve it through defaultAttrs
    assert.equal(user.nickname, 'anon', 'the remote projection reads the default');
    const remote = watch(store, user, 'remote');
    const local = watch(store, user, 'local');

    pushUser(store, { nickname: 'anon' });
    flush(store);

    assert.deepEqual(remote, [], 'remote read anon before and after, so it heard nothing');
    assert.deepEqual(local, [], 'local read anon before and after, so it heard nothing');
    assert.equal(user.nickname, 'anon', 'the persisted value now backs the read');

    pushUser(store, { nickname: 'bob' });
    flush(store);

    assert.deepEqual(remote, ['nickname'], 'a value that differs from the default still notifies');
    assert.equal(user.nickname, 'bob', 'and is what the remote projection reads');
  });
});
