import type { Store } from '@warp-drive/core';
import { recordIdentifierFor, useRecommendedStore } from '@warp-drive/core';
import { checkout, withDefaults } from '@warp-drive/core/reactive';
import { Type } from '@warp-drive/core/types/symbols';
import { module, test } from '@warp-drive/diagnostic';
import { JSONAPICache } from '@warp-drive/json-api';

/**
 * `Cache.upsert(identifier, data, true)` returns the keys whose persisted value moved. Nothing
 * inside WarpDrive reads it, but it is public, so these pin down what it reports: a key the
 * merge changed in `remoteAttrs`, whether or not a local edit already held that value, and
 * nothing for a key the schema says did not change.
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
        { name: 'firstName', kind: 'field' },
        { name: 'lastName', kind: 'field' },
        { name: 'messages', kind: 'schema-array', type: 'message' },
      ],
    }),
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

const BASE_ATTRS = { firstName: 'Chris', lastName: 'Thoburn', messages: [{ id: 'm1', state: 'pending' }] };

function setupUser() {
  const store: Store = new TestStore();
  store.schema.registerHashFn(hashMessage);
  store.push({ data: { type: 'user', id: '1', attributes: BASE_ATTRS } });
  const user = store.peekRecord<ExistingUser>('user', '1')!;
  return { store, user, lid: recordIdentifierFor(user) };
}

function upsertUser(store: Store, lid: ReturnType<typeof recordIdentifierFor>, attrs: Record<string, unknown>) {
  return store.cache.upsert(lid, { type: 'user', id: '1', attributes: { ...BASE_ATTRS, ...attrs } }, true);
}

module('Integration | <JSONAPICache>.upsert return value', function () {
  test('a key whose persisted value moved is returned, even when a local edit already held that value', async function (assert) {
    const { store, user, lid } = setupUser();
    const editable = await checkout<ExistingUser>(user);
    editable.firstName = 'Christopher';

    const changed = upsertUser(store, lid, { firstName: 'Christopher' });

    assert.deepEqual(changed, ['firstName'], 'the confirming push still moved the persisted value');
    assert.false(store.cache.hasChangedAttrs(lid), 'and the edit it confirmed is gone');
  });

  test('a key the schema says did not change is not returned', function (assert) {
    const { store, lid } = setupUser();

    // fresh literals with the same content and the same hash
    assert.equal(upsertUser(store, lid, { messages: [{ id: 'm1', state: 'pending' }] }), undefined, 'nothing moved');

    assert.deepEqual(
      upsertUser(store, lid, { messages: [{ id: 'm1', state: 'executed' }] }),
      ['messages'],
      'a changed hash is a change'
    );
  });
});
