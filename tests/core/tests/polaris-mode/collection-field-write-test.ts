import { recordIdentifierFor, useRecommendedStore } from '@warp-drive/core';
import type { ReactiveRelationshipDocument } from '@warp-drive/core/reactive';
import { checkout, commit, withDefaults } from '@warp-drive/core/reactive';
import type { Type } from '@warp-drive/core/types/symbols';
import { module, setupTest, test } from '@warp-drive/diagnostic/ember';
import { JSONAPICache } from '@warp-drive/json-api';

const Store = useRecommendedStore({
  cache: JSONAPICache,
});

interface User {
  id: string | null;
  $type: 'user';
  name: string;
  friends: ReactiveRelationshipDocument<User[]>;
  [Type]: 'user';
}

function registerUser(store: InstanceType<typeof Store>) {
  store.schema.registerResource(
    withDefaults({
      type: 'user',
      fields: [
        {
          name: 'name',
          kind: 'field',
        },
        {
          name: 'friends',
          type: 'user',
          kind: 'collection',
          options: { inverse: 'friends', async: false },
        },
      ],
    })
  );
}

function pushUsers(store: InstanceType<typeof Store>) {
  const record = store.push<User>({
    data: {
      type: 'user',
      id: '1',
      attributes: { name: 'Leo' },
      relationships: {
        friends: {
          links: { related: '/user/1/friends' },
          meta: { count: 2 },
          data: [
            { type: 'user', id: '2' },
            { type: 'user', id: '3' },
          ],
        },
      },
    },
    included: [
      {
        type: 'user',
        id: '2',
        attributes: { name: 'Benedikt' },
        relationships: { friends: { data: [{ type: 'user', id: '1' }] } },
      },
      {
        type: 'user',
        id: '3',
        attributes: { name: 'Jane' },
        relationships: { friends: { data: [{ type: 'user', id: '1' }] } },
      },
    ],
  });
  const others = store.push<User>({
    data: [
      { type: 'user', id: '4', attributes: { name: 'William' }, relationships: { friends: { data: [] } } },
      { type: 'user', id: '5', attributes: { name: 'Thomas' }, relationships: { friends: { data: [] } } },
      { type: 'user', id: '6', attributes: { name: 'Matthew' }, relationships: { friends: { data: [] } } },
    ],
  });
  return [record, ...others] as [User, User, User, User];
}

function ids(doc: ReactiveRelationshipDocument<User[]>): string[] {
  return doc.data!.map((user) => user.id!);
}

function remoteIds(doc: ReactiveRelationshipDocument<User[]>): string[] {
  return doc.remoteData!.map((user) => user.id!);
}

module('Writes | collection', function (hooks) {
  setupTest(hooks);

  test('we can mutate the data array of a checked out record', async function (assert) {
    const store = new Store();
    registerUser(store);
    const [record, record4, record5, record6] = pushUsers(store);

    const assertRemoteState = () => {
      assert.arrayEquals(ids(record.friends), ['2', '3'], 'the immutable document still reflects the remote state');
    };
    assertRemoteState();

    const editable = await checkout<User>(record);
    assert.true(editable.friends !== record.friends, 'the editable record has its own document');
    assert.true(editable.friends.data !== record.friends.data, 'the editable record has its own array');
    assert.arrayEquals(ids(editable.friends), ['2', '3'], 'the editable document starts from the remote state');
    assert.arrayEquals(remoteIds(editable.friends), ['2', '3'], 'remoteData reflects the remote state');
    assert.false(editable.friends.isDirty, 'the relationship is not dirty');
    const linksBefore = editable.friends.links;
    const metaBefore = editable.friends.meta;
    const remoteArray = editable.friends.remoteData;

    // inverses reflect the local state on editable copies only
    const [record2, record3] = record.friends.data!;
    const editable2 = await checkout<User>(record2);
    const editable3 = await checkout<User>(record3);
    const editable4 = await checkout<User>(record4);
    const editable5 = await checkout<User>(record5);
    const editable6 = await checkout<User>(record6);
    const assertRemoteInverses = () => {
      assert.arrayEquals(ids(record2.friends), ['1'], 'the immutable inverse of record 2 reflects the remote state');
      assert.arrayEquals(ids(record3.friends), ['1'], 'the immutable inverse of record 3 reflects the remote state');
      assert.arrayEquals(ids(record4.friends), [], 'the immutable inverse of record 4 reflects the remote state');
      assert.arrayEquals(ids(record5.friends), [], 'the immutable inverse of record 5 reflects the remote state');
      assert.arrayEquals(ids(record6.friends), [], 'the immutable inverse of record 6 reflects the remote state');
    };
    assertRemoteInverses();

    editable.friends.data!.push(record4);
    assert.arrayEquals(ids(editable.friends), ['2', '3', '4'], 'push adds to the end');
    assert.arrayEquals(ids(editable4.friends), ['1'], 'push updates the local inverse');
    assertRemoteInverses();
    assert.arrayEquals(remoteIds(editable.friends), ['2', '3'], 'remoteData still reflects the remote state');
    assert.equal(editable.friends.remoteData, remoteArray, 'the remoteData array instance is stable');
    assert.true(editable.friends.isDirty, 'the relationship is dirty');
    assert.true(record.friends.isDirty, 'the immutable document reports the same dirty state');
    assert.equal(editable.friends.links, linksBefore, 'links are untouched (same instance) by a local change');
    assert.equal(editable.friends.meta, metaBefore, 'meta is untouched (same instance) by a local change');
    assert.deepEqual(editable.friends.meta, { count: 2 }, 'meta still describes the remote membership');
    assert.equal(record.friends.remoteData, record.friends.data, 'remoteData on the immutable document is its data');
    assertRemoteState();

    editable.friends.data!.unshift(record6);
    assert.arrayEquals(ids(editable.friends), ['6', '2', '3', '4'], 'unshift adds to the front');
    assert.arrayEquals(ids(editable6.friends), ['1'], 'unshift updates the local inverse');
    assertRemoteState();
    assertRemoteInverses();

    editable.friends.data!.splice(1, 0, record5);
    assert.arrayEquals(ids(editable.friends), ['6', '5', '2', '3', '4'], 'splice inserts');
    assert.arrayEquals(ids(editable5.friends), ['1'], 'splice updates the local inverse of an inserted record');
    assertRemoteState();
    assertRemoteInverses();

    const removed = editable.friends.data!.splice(2, 1);
    assert.equal(removed[0].id, '2', 'splice returns the removed records');
    assert.arrayEquals(ids(editable.friends), ['6', '5', '3', '4'], 'splice removes');
    assert.arrayEquals(ids(editable2.friends), [], 'splice clears the local inverse of a removed record');
    assertRemoteInverses();

    const popped = editable.friends.data!.pop();
    assert.equal(popped?.id, '4', 'pop returns the last record');
    assert.arrayEquals(ids(editable.friends), ['6', '5', '3'], 'pop removes from the end');
    assert.arrayEquals(ids(editable4.friends), [], 'pop clears the local inverse');

    const shifted = editable.friends.data!.shift();
    assert.equal(shifted?.id, '6', 'shift returns the first record');
    assert.arrayEquals(ids(editable.friends), ['5', '3'], 'shift removes from the front');
    assert.arrayEquals(ids(editable6.friends), [], 'shift clears the local inverse');

    editable.friends.data!.sort((a, b) => (a.id! < b.id! ? -1 : 1));
    assert.arrayEquals(ids(editable.friends), ['3', '5'], 'sort reorders');
    assert.arrayEquals(ids(editable3.friends), ['1'], 'sort leaves the local inverses alone');
    assert.arrayEquals(ids(editable5.friends), ['1'], 'sort leaves the local inverses alone');

    editable.friends.data![1] = record4;
    assert.arrayEquals(ids(editable.friends), ['3', '4'], 'index assignment replaces a member');
    assert.arrayEquals(ids(editable4.friends), ['1'], 'index assignment updates the local inverse of the new member');
    assert.arrayEquals(ids(editable5.friends), [], 'index assignment clears the local inverse of the replaced member');
    assertRemoteState();
    assertRemoteInverses();

    editable.friends.data!.splice(0);
    assert.equal(editable.friends.data!.length, 0, 'splice(0) removes everything');
    assert.arrayEquals(ids(editable3.friends), [], 'splice(0) clears the local inverses');
    assert.arrayEquals(ids(editable4.friends), [], 'splice(0) clears the local inverses');
    assertRemoteState();
    assertRemoteInverses();
  });

  test('we can replace the data array of a checked out record', async function (assert) {
    const store = new Store();
    registerUser(store);
    const [record, record4, record5] = pushUsers(store);
    const [record2, record3] = record.friends.data!;
    const editable = await checkout<User>(record);
    const editable2 = await checkout<User>(record2);
    const editable3 = await checkout<User>(record3);
    const editable4 = await checkout<User>(record4);
    const editable5 = await checkout<User>(record5);
    const friends = editable.friends.data!;

    editable.friends.data = [record5, record4];

    assert.equal(editable.friends.data, friends, 'the array instance is stable');
    assert.arrayEquals(ids(editable.friends), ['5', '4'], 'the membership was replaced');
    assert.arrayEquals(ids(record.friends), ['2', '3'], 'the immutable document still reflects the remote state');
    assert.arrayEquals(ids(editable4.friends), ['1'], 'the local inverse of a new member is updated');
    assert.arrayEquals(ids(editable5.friends), ['1'], 'the local inverse of a new member is updated');
    assert.arrayEquals(ids(editable2.friends), [], 'the local inverse of a removed member is cleared');
    assert.arrayEquals(ids(editable3.friends), [], 'the local inverse of a removed member is cleared');
    assert.arrayEquals(
      ids(record2.friends),
      ['1'],
      'the immutable inverse of a removed member reflects the remote state'
    );
    assert.arrayEquals(ids(record4.friends), [], 'the immutable inverse of a new member reflects the remote state');

    editable.friends.data = [];
    assert.equal(friends.length, 0, 'the membership was cleared');
    assert.arrayEquals(ids(editable4.friends), [], 'the local inverses are cleared');
    assert.arrayEquals(ids(editable5.friends), [], 'the local inverses are cleared');
    assert.arrayEquals(ids(record2.friends), ['1'], 'the immutable inverses still reflect the remote state');
  });

  test('a payload confirming a local change updates the immutable document', async function (assert) {
    const store = new Store();
    registerUser(store);
    const [record, record4] = pushUsers(store);
    const editable = await checkout<User>(record);
    const editable4 = await checkout<User>(record4);
    const friends = record.friends.data!;

    editable.friends.data!.push(record4);
    assert.arrayEquals(ids(record.friends), ['2', '3'], 'the immutable document still reflects the remote state');
    assert.arrayEquals(ids(editable4.friends), ['1'], 'the local inverse reflects the local change');
    assert.arrayEquals(ids(record4.friends), [], 'the immutable inverse still reflects the remote state');

    // e.g. the response to a save request
    store.push<User>({
      data: {
        type: 'user',
        id: '1',
        attributes: { name: 'Leo' },
        relationships: {
          friends: {
            data: [
              { type: 'user', id: '2' },
              { type: 'user', id: '3' },
              { type: 'user', id: '4' },
            ],
          },
        },
      },
    });

    assert.equal(record.friends.data, friends, 'the array instance is stable');
    assert.arrayEquals(ids(record.friends), ['2', '3', '4'], 'the immutable document reflects the confirmed state');
    assert.arrayEquals(ids(editable.friends), ['2', '3', '4'], 'the editable document reflects the confirmed state');
    assert.arrayEquals(remoteIds(editable.friends), ['2', '3', '4'], 'remoteData reflects the confirmed state');
    assert.false(editable.friends.isDirty, 'the relationship is no longer dirty');
    assert.arrayEquals(ids(record4.friends), ['1'], 'the immutable inverse reflects the confirmed state');
    assert.arrayEquals(ids(editable4.friends), ['1'], 'the editable inverse reflects the confirmed state');
    assert.false(editable4.friends.isDirty, 'the inverse relationship is not dirty');
  });

  test('commit() promotes a local change to the immutable document', async function (assert) {
    const store = new Store();
    registerUser(store);
    const [record, record4] = pushUsers(store);
    const [record2] = record.friends.data!;
    const editable = await checkout<User>(record);
    const friends = record.friends.data!;

    editable.friends.data!.push(record4);
    editable.friends.data!.shift();
    assert.arrayEquals(ids(editable.friends), ['3', '4'], 'the editable document reflects the local change');
    assert.true(editable.friends.isDirty, 'the relationship is dirty');
    assert.arrayEquals(ids(record.friends), ['2', '3'], 'the immutable document still reflects the remote state');

    await commit(editable);

    assert.equal(record.friends.data, friends, 'the array instance is stable');
    assert.arrayEquals(ids(record.friends), ['3', '4'], 'the immutable document reflects the committed state');
    assert.arrayEquals(ids(editable.friends), ['3', '4'], 'the editable document reflects the committed state');
    assert.arrayEquals(remoteIds(editable.friends), ['3', '4'], 'remoteData reflects the committed state');
    assert.false(editable.friends.isDirty, 'the relationship is no longer dirty');
    assert.arrayEquals(ids(record4.friends), ['1'], 'the immutable inverse reflects the committed state');
    assert.arrayEquals(ids(record2.friends), [], 'the immutable prior inverse reflects the committed state');
  });

  test('duplicates are rejected', async function (assert) {
    const store = new Store();
    registerUser(store);
    const [record] = pushUsers(store);
    const editable = await checkout<User>(record);
    const record2 = store.peekRecord<User>('user', '2')!;

    assert.throws(
      () => editable.friends.data!.push(record2),
      /Cannot push duplicates to a collection relationship/,
      'push rejects duplicates'
    );
    assert.throws(
      () => (editable.friends.data = [record2, record2]),
      /Cannot replace a collection relationship's state with a new state that contains duplicates/,
      'replace rejects duplicates'
    );
    assert.arrayEquals(ids(editable.friends), ['2', '3'], 'the membership is unchanged');
  });

  test('assigning the field itself is not allowed even when editable', async function (assert) {
    const store = new Store();
    registerUser(store);
    const [record, record4] = pushUsers(store);
    const editable = await checkout<User>(record);

    await assert.expectAssertion(() => {
      // @ts-expect-error we are testing the runtime guard
      editable.friends = [record4];
    }, /Cannot set user.friends directly. Mutate or set `data` on the relationship document instead/);

    await assert.expectAssertion(() => {
      // @ts-expect-error we are testing the runtime guard
      editable.friends.data = record4;
    }, /Expected an array of resources to be set as the data of user.friends/);
  });

  test('collection relationships can be set via createRecord', async function (assert) {
    const store = new Store();
    registerUser(store);
    const [, record4, record5] = pushUsers(store);

    const record = store.createRecord<User>('user', { name: 'Chris', friends: [record4, record5] });

    assert.equal(record.name, 'Chris', 'name is set');
    assert.arrayEquals(ids(record.friends), ['4', '5'], 'friends are set');
    assert.arrayEquals(ids(record4.friends), [], 'the local inverse is not visible on the immutable record');
    const editable4 = await checkout<User>(record4);
    assert.equal(
      recordIdentifierFor(editable4.friends.data![0]),
      recordIdentifierFor(record),
      'the local inverse is visible on the editable record'
    );
  });
});
