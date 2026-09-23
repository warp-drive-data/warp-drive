import type { Store } from '@warp-drive/core';
import { recordIdentifierFor, useRecommendedStore } from '@warp-drive/core';
import { checkout, withDefaults } from '@warp-drive/core/reactive';
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
});
