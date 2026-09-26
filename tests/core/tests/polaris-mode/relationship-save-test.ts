import { recordIdentifierFor, useRecommendedStore } from '@warp-drive/core';
import type { ReactiveRelationshipDocument } from '@warp-drive/core/reactive';
import { checkout, withDefaults } from '@warp-drive/core/reactive';
import type { Type } from '@warp-drive/core/types/symbols';
import { module, setupTest, test } from '@warp-drive/diagnostic/ember';
import { JSONAPICache } from '@warp-drive/json-api';

/**
 * The relational-data guide (Mutating > Saving) documents that a save only updates the
 * relationships its response includes: a relationship the response leaves out keeps its edits as
 * local state and stays dirty. These tests pin that behavior down for the `resource` and
 * `collection` kinds.
 */

interface User {
  id: string | null;
  $type: 'user';
  name: string;
  bestFriend: ReactiveRelationshipDocument<User | null>;
  friends: ReactiveRelationshipDocument<User[]>;
  [Type]: 'user';
}

/** The handler resolves every request with `response`, e.g. `{ data: null }` for an empty save response. */
function setup(response: unknown = { data: null }) {
  const Store = useRecommendedStore({
    cache: JSONAPICache,
    handlers: [
      {
        request<T>() {
          return Promise.resolve(response as T);
        },
      },
    ],
  });
  const store = new Store();
  store.schema.registerResource(
    withDefaults({
      type: 'user',
      fields: [
        { name: 'name', kind: 'field' },
        { name: 'bestFriend', type: 'user', kind: 'resource', options: { inverse: null, async: false } },
        { name: 'friends', type: 'user', kind: 'collection', options: { inverse: null, async: false } },
      ],
    })
  );
  const [rey, matt, wes] = store.push<User>({
    data: [
      {
        type: 'user',
        id: '1',
        attributes: { name: 'Rey' },
        relationships: {
          bestFriend: { data: { type: 'user', id: '2' } },
          friends: { data: [{ type: 'user', id: '2' }] },
        },
      },
      {
        type: 'user',
        id: '2',
        attributes: { name: 'Matt' },
        relationships: { bestFriend: { data: null }, friends: { data: [] } },
      },
      {
        type: 'user',
        id: '3',
        attributes: { name: 'Wes' },
        relationships: { bestFriend: { data: null }, friends: { data: [] } },
      },
    ],
  }) as unknown as [User, User, User];
  return { store, rey, matt, wes };
}

function saveRequest(record: User) {
  return {
    op: 'updateRecord' as const,
    url: '/users/1',
    method: 'PUT' as const,
    body: JSON.stringify({ data: { type: 'user', id: '1' } }),
    records: [recordIdentifierFor(record)],
  };
}

function ids(doc: ReactiveRelationshipDocument<User[]>): string[] {
  return doc.data!.map((user) => user.id!);
}

module('Saving | resource and collection edits', function (hooks) {
  setupTest(hooks);

  test('a save whose response omits a resource relationship leaves the edit local', async function (assert) {
    const { store, rey, matt, wes } = setup();
    const editable = await checkout<User>(rey);

    editable.bestFriend.data = wes;
    assert.equal(rey.bestFriend.data, matt, 'the immutable record shows the remote value before saving');
    assert.true(editable.bestFriend.isDirty, 'the relationship is dirty before saving');

    await store.request(saveRequest(editable));

    assert.equal(rey.bestFriend.data, matt, 'the immutable record still shows the remote value');
    assert.equal(editable.bestFriend.data, wes, 'the editable record still shows the local edit');
    assert.true(editable.bestFriend.isDirty, 'the relationship is still dirty');
  });

  test('a save whose response omits a collection relationship leaves the edit local', async function (assert) {
    const { store, rey, wes } = setup();
    const editable = await checkout<User>(rey);

    editable.friends.data!.push(wes);
    assert.deepEqual(ids(rey.friends), ['2'], 'the immutable record shows the remote membership before saving');
    assert.true(editable.friends.isDirty, 'the relationship is dirty before saving');

    await store.request(saveRequest(editable));

    assert.deepEqual(ids(rey.friends), ['2'], 'the immutable record still shows the remote membership');
    assert.deepEqual(ids(editable.friends), ['2', '3'], 'the editable record still shows the local edit');
    assert.true(editable.friends.isDirty, 'the relationship is still dirty');
  });
});
