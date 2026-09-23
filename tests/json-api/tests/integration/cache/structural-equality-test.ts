import type { Store } from '@warp-drive/core';
import { recordIdentifierFor, useRecommendedStore } from '@warp-drive/core';
import { checkout, withDefaults } from '@warp-drive/core/reactive';
import type { ObjectValue } from '@warp-drive/core/types/json/raw';
import { Type } from '@warp-drive/core/types/symbols';
import { module, test } from '@warp-drive/diagnostic';
import { JSONAPICache } from '@warp-drive/json-api';

/**
 * How the cache decides whether an attribute value changed. A `schema-object`, and each element of a
 * `schema-array`, compares by the identity hash its `ObjectSchema` declares, so the schema owns the
 * definition of "same". Everything else, including a schema-object with `identity: null` and the
 * unstructured `object` and `array` kinds, compares by reference and so notifies on every re-push
 * of a fresh payload. That over-notification is by design (see #10094): content equality is the
 * schema's to define, not the cache's to guess.
 *
 * Assert on notifications (`assert.notifiedOn`), never on a subsequent property read: a getter
 * re-reads the cache, so reading the value back passes whether or not anything was notified.
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

function setupStore(): Store {
  const store = new TestStore();
  store.schema.registerHashFn(hashMessage);
  store.schema.registerHashFn(hashSticker);
  store.schema.registerHashFn(hashReaction);
  return store;
}

const BASE_ATTRS = { firstName: 'Chris', lastName: 'Thoburn' };

function pushUser(store: Store, attrs: Record<string, unknown> = {}): ExistingUser {
  store.push({
    data: { type: 'user', id: '1', attributes: { ...BASE_ATTRS, messages: [], ...attrs } },
  });
  return store.peekRecord<ExistingUser>('user', '1')!;
}

module('Integration | <JSONAPICache> equality of attribute values', function () {
  test('re-pushing an equal-hash schema-array does not notify either channel', function (assert) {
    const store = setupStore();
    const user = pushUser(store, { messages: [{ id: 'm1', state: 'pending' }] });
    const lid = recordIdentifierFor(user);
    assert.watchNotifications(store);

    // a fresh array/object literal with the same content, not the same reference
    pushUser(store, { messages: [{ id: 'm1', state: 'pending' }] });

    assert.notifiedOn('remote', lid, 'attributes', 'messages', 0, 'remote heard nothing for an equal-hash re-push');
    assert.notifiedOn('local', lid, 'attributes', 'messages', 0, 'local heard nothing for an equal-hash re-push');
    assert.notifiedOn('unscoped', lid, 'attributes', 'messages', 0, 'nothing was notified unscoped either');
  });

  test('re-pushing a schema-array with a changed hashed field notifies both channels', function (assert) {
    const store = setupStore();
    const user = pushUser(store, { messages: [{ id: 'm1', state: 'pending' }] });
    const lid = recordIdentifierFor(user);
    assert.watchNotifications(store);

    pushUser(store, { messages: [{ id: 'm1', state: 'executed' }] });

    // with no local edit both projections moved, so the key is announced once, unscoped
    assert.notifiedOn('unscoped', lid, 'attributes', 'messages', 1, 'the changed element was announced unscoped');
    assert.notified(lid, 'attributes', 'messages', 1, 'and that was the only notification for the key');
  });

  test('the hash decides: a change to a field the hash ignores does not notify', function (assert) {
    const store = setupStore();
    const user = pushUser(store, { messages: [{ id: 'm1', state: 'pending', note: 'a' }] });
    const lid = recordIdentifierFor(user);
    assert.watchNotifications(store);

    pushUser(store, { messages: [{ id: 'm1', state: 'pending', note: 'b' }] });

    assert.notified(lid, 'attributes', 'messages', 0, 'note is outside the hash, so the schema says nothing changed');
  });

  test('a polymorphic schema-array resolves the hash per element type', function (assert) {
    const store = setupStore();
    const attachments = [
      { kind: 'sticker', code: 'wave' },
      { kind: 'reaction', emoji: '👋', count: 2 },
    ];
    const user = pushUser(store, { attachments });
    const lid = recordIdentifierFor(user);
    assert.watchNotifications(store);

    pushUser(store, { attachments: attachments.map((a) => ({ ...a })) });
    assert.notified(lid, 'attributes', 'attachments', 0, 'equal hashes across two element types stay silent');

    pushUser(store, { attachments: [attachments[0], { kind: 'reaction', emoji: '👋', count: 3 }] });
    assert.notified(lid, 'attributes', 'attachments', 1, 'a changed hashed field on one element notifies');

    pushUser(store, { attachments: [attachments[0], { kind: 'sticker', code: 'wave' }] });
    assert.notified(lid, 'attributes', 'attachments', 1, 'an element changing type notifies');
  });

  test('a schema-object with identity: null compares by reference and notifies on an equal-content re-push', function (assert) {
    const store = setupStore();
    const user = pushUser(store, { unhashedProfile: { bio: 'hi' } });
    const lid = recordIdentifierFor(user);
    assert.watchNotifications(store);

    pushUser(store, { unhashedProfile: { bio: 'hi' } });

    assert.notified(lid, 'attributes', 'unhashedProfile', 1, 'no hash declared, so a fresh object is a change');
  });

  test('an unstructured object field compares by reference and notifies on an equal-content re-push', function (assert) {
    const store = setupStore();
    const user = pushUser(store, { settings: { a: 1, b: 2 } });
    const lid = recordIdentifierFor(user);
    assert.watchNotifications(store);

    pushUser(store, { settings: { a: 1, b: 2 } });

    assert.notified(lid, 'attributes', 'settings', 1, 'object fields have no schema to hash against');
  });

  // the scalar counterpart, which holds by reference equality alone, is in did-commit-notification-test.ts
  test('a nested local edit confirmed by an equal-hash push is dropped', async function (assert) {
    const store = setupStore();
    const user = pushUser(store, { messages: [{ id: 'm1', state: 'pending' }] });
    const lid = recordIdentifierFor(user);
    assert.watchNotifications(store);

    const editable = await checkout<ExistingUser>(user);
    editable.messages[0].state = 'executed';
    assert.notifiedOn('local', lid, 'attributes', 'messages', 1, 'the nested edit notified the local channel');
    assert.notifiedOn(
      'remote',
      lid,
      'attributes',
      'messages',
      0,
      'the nested edit alone does not reach the remote channel'
    );
    assert.clearNotifications();

    pushUser(store, { messages: [{ id: 'm1', state: 'executed' }] });

    assert.false(store.cache.hasChangedAttrs(lid), 'the confirmed nested edit is no longer dirty');
    assert.notifiedOn('remote', lid, 'attributes', 'messages', 1, 'remote heard the confirming push');
    assert.notifiedOn(
      'local',
      lid,
      'attributes',
      'messages',
      0,
      'the confirming push emitted nothing on the local channel'
    );
    assert.notifiedOn('unscoped', lid, 'attributes', 'messages', 0, 'the confirming push announced nothing unscoped');
  });

  test('re-pushing an equal-hash array under a diverging nested local edit does not notify', async function (assert) {
    const store = setupStore();
    const user = pushUser(store, { messages: [{ id: 'm1', state: 'pending' }] });
    const lid = recordIdentifierFor(user);
    assert.watchNotifications(store);

    const editable = await checkout<ExistingUser>(user);
    editable.messages[0].state = 'executed';
    assert.notifiedOn(
      'remote',
      lid,
      'attributes',
      'messages',
      0,
      'the nested edit alone does not reach the remote channel'
    );
    assert.clearNotifications();

    // the original, still-current remote content, re-pushed as a fresh literal
    pushUser(store, { messages: [{ id: 'm1', state: 'pending' }] });

    assert.notified(lid, 'attributes', 'messages', 0, 'the re-push matches the existing remote state exactly');
    assert.equal(editable.messages[0].state, 'executed', 'the diverging local edit survives the equal-hash re-push');
    assert.true(store.cache.hasChangedAttrs(lid), 'the local edit is still dirty');
  });

  test('a push carrying the value a memoized default already supplies does not notify', function (assert) {
    const store = setupStore();
    const user = pushUser(store);
    const lid = recordIdentifierFor(user);
    // reading the field memoizes the default, so both projections now resolve it through defaultAttrs
    assert.equal(user.nickname, 'anon', 'the remote projection reads the default');
    assert.watchNotifications(store);

    pushUser(store, { nickname: 'anon' });

    assert.notified(
      lid,
      'attributes',
      'nickname',
      0,
      'both projections read anon before and after, so nothing was notified'
    );
    assert.equal(user.nickname, 'anon', 'the persisted value now backs the read');

    pushUser(store, { nickname: 'bob' });

    assert.notified(lid, 'attributes', 'nickname', 1, 'a value that differs from the default still notifies');
    assert.equal(user.nickname, 'bob', 'and is what the remote projection reads');
  });
});
