import type { Store } from '@warp-drive/core';
import { recordIdentifierFor, useRecommendedStore } from '@warp-drive/core';
import { checkout, withDefaults } from '@warp-drive/core/reactive';
import type { ObjectValue } from '@warp-drive/core/types/json/raw';
import { Type } from '@warp-drive/core/types/symbols';
import { module, test } from '@warp-drive/diagnostic';
import { JSONAPICache } from '@warp-drive/json-api';

/**
 * A nested edit (`editable.address.street = ...`) writes into a local clone of the whole
 * `address` object. These pin down what happens to that clone when one nested value is set back
 * to its baseline: sibling edits must survive, and the edit ends only when the clone as a whole
 * matches the baseline again, by hash where the schema declares one and by content otherwise.
 */

// type aliases, not interfaces: attribute values need an implicit index signature to satisfy the
// cache's `Value` type
type Address = { street: string; city: string };
type Message = { id: string; state: string };

interface ExistingUser {
  [Type]: 'user';
  id: string;
  address: Address;
  messages: Message[];
  settings: { theme: string } | null;
  prefs: { locale: string };
  bio: { text: string } | undefined;
}

function hashMessage(data: object): string {
  const { id, state } = data as Message;
  return `${id}:${state}`;
}
hashMessage[Type] = 'message-hash';

const TestStore = useRecommendedStore({
  cache: JSONAPICache,
  schemas: [
    withDefaults({
      type: 'user',
      fields: [
        { name: 'address', kind: 'schema-object', type: 'address' },
        { name: 'messages', kind: 'schema-array', type: 'message' },
        { name: 'settings', kind: 'field' },
        // a legacy `defaultValue()` function is the one kind of default the cache memoizes
        { name: 'prefs', kind: 'field', options: { defaultValue: () => ({ locale: 'en' }) } as unknown as ObjectValue },
        // never pushed and no default: a nested write has nothing to write into
        { name: 'bio', kind: 'field' },
      ],
    }),
    {
      type: 'address',
      identity: null,
      fields: [
        { name: 'street', kind: 'field' },
        { name: 'city', kind: 'field' },
      ],
    },
    {
      type: 'message',
      identity: { kind: '@hash', name: null, type: 'message-hash' },
      fields: [
        { name: 'id', kind: 'field' },
        { name: 'state', kind: 'field' },
      ],
    },
  ],
});

async function setupEditableUser() {
  const store: Store = new TestStore();
  store.schema.registerHashFn(hashMessage);
  store.push({
    data: {
      type: 'user',
      id: '1',
      attributes: {
        address: { street: '1 Main St', city: 'Portland' },
        settings: { theme: 'dark' },
        messages: [
          { id: 'm1', state: 'pending' },
          { id: 'm2', state: 'pending' },
        ],
      },
    },
  });
  const user = store.peekRecord<ExistingUser>('user', '1')!;
  const lid = recordIdentifierFor(user);
  const editable = await checkout<ExistingUser>(user);
  return { store, user, lid, editable };
}

module('Integration | <JSONAPICache> nested local edits', function () {
  test('reverting one of two sibling nested edits keeps the other', async function (assert) {
    const { store, lid, editable } = await setupEditableUser();

    editable.address.street = '2 Oak Ave';
    editable.address.city = 'Salem';
    editable.address.street = '1 Main St';

    assert.equal(store.cache.getAttr(lid, ['address', 'city']), 'Salem', 'the sibling edit survives the revert');
    assert.equal(
      store.cache.getAttr(lid, ['address', 'street']),
      '1 Main St',
      'the reverted value reads as the baseline'
    );
    assert.true(store.cache.hasChangedAttrs(lid), 'the record is still dirty for the surviving edit');
    assert.deepEqual(
      store.cache.changedAttrs(lid).address,
      [
        { street: '1 Main St', city: 'Portland' },
        { street: '1 Main St', city: 'Salem' },
      ],
      'changedAttrs describes only the surviving edit'
    );
  });

  test('reverting the only nested edit ends the edit', async function (assert) {
    const { store, lid, editable } = await setupEditableUser();

    editable.address.street = '2 Oak Ave';
    assert.true(store.cache.hasChangedAttrs(lid), 'the nested edit dirties the record');

    editable.address.street = '1 Main St';

    assert.false(store.cache.hasChangedAttrs(lid), 'the clone matches the baseline again, so the edit is gone');
    assert.equal(store.cache.changedAttrs(lid).address, undefined, 'changedAttrs has no entry for the field');
  });

  test('a hashed schema-array keeps a sibling element edit when one element is reverted', async function (assert) {
    const { store, lid, editable } = await setupEditableUser();

    editable.messages[0].state = 'executed';
    editable.messages[1].state = 'executed';
    editable.messages[0].state = 'pending';

    assert.equal(editable.messages[1].state, 'executed', 'the sibling element edit survives');
    assert.true(store.cache.hasChangedAttrs(lid), 'the array still differs from the baseline by hash');

    editable.messages[1].state = 'pending';

    assert.false(store.cache.hasChangedAttrs(lid), 'every element hashes like the baseline again, so the edit is gone');
  });

  test('a nested write of the baseline value to an unedited field is a no-op', async function (assert) {
    const { store, lid, editable } = await setupEditableUser();
    assert.watchNotifications(store);

    editable.address.street = '1 Main St';

    assert.false(store.cache.hasChangedAttrs(lid), 'nothing was edited');
    assert.notified(lid, 'attributes', 'address', 0, 'nothing was announced');
  });

  test('a nested read resolves through a memoized legacy default', async function (assert) {
    const { store, lid } = await setupEditableUser();

    // reading the field memoizes the default; the nested path resolves through the same layer
    assert.deepEqual(store.cache.getAttr(lid, 'prefs'), { locale: 'en' }, 'the default is read');
    assert.equal(store.cache.getAttr(lid, ['prefs', 'locale']), 'en', 'local state reads the nested default');
    assert.equal(store.cache.getRemoteAttr(lid, ['prefs', 'locale']), 'en', 'remote state reads it too');
  });

  test('a nested write onto a memoized legacy default edits a clone of the default', async function (assert) {
    const { store, lid } = await setupEditableUser();
    assert.equal(store.cache.getAttr(lid, 'prefs'), store.cache.getAttr(lid, 'prefs'), 'the default is memoized');

    store.cache.setAttr(lid, ['prefs', 'locale'], 'fr');

    assert.equal(store.cache.getAttr(lid, ['prefs', 'locale']), 'fr', 'local state reads the edit');
    // the edit dropped the memo, as a simple-path edit would; remote state recomputes the default
    assert.deepEqual(store.cache.getRemoteAttr(lid, 'prefs'), { locale: 'en' }, 'remote state still reads the default');
    assert.true(store.cache.hasChangedAttrs(lid), 'an edit over a default is still an edit');
    assert.deepEqual(
      store.cache.changedAttrs(lid).prefs,
      [undefined, { locale: 'fr' }],
      'nothing persisted holds the value it replaces'
    );
  });

  test('a nested write onto a field with no object value asserts instead of throwing a TypeError', async function (assert) {
    const { store, lid } = await setupEditableUser();

    await assert.expectAssertion(
      () => store.cache.setAttr(lid, ['bio', 'text'], 'hi'),
      /Cannot set 'bio.text' on 'user': 'bio' holds no object to write into/
    );
  });

  test('a nested read under a null value is undefined rather than a TypeError', async function (assert) {
    const { store, lid } = await setupEditableUser();
    store.push({ data: { type: 'user', id: '1', attributes: { settings: null } } });

    assert.equal(store.cache.getAttr(lid, ['settings', 'theme']), undefined, 'local state stops at the null');
    assert.equal(store.cache.getRemoteAttr(lid, ['settings', 'theme']), undefined, 'remote state stops at the null');
  });
});
