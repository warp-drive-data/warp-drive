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
  bestFriend: ReactiveRelationshipDocument<User | null>;
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
          name: 'bestFriend',
          type: 'user',
          kind: 'resource',
          options: { inverse: 'bestFriend', async: false },
        },
      ],
    })
  );
}

function pushUsers(store: InstanceType<typeof Store>) {
  return store.push<User>({
    data: [
      {
        type: 'user',
        id: '1',
        attributes: { name: 'Rey' },
        relationships: {
          bestFriend: {
            links: { related: '/user/1/bestFriend' },
            meta: { since: '2020' },
            data: { type: 'user', id: '2' },
          },
        },
      },
      {
        type: 'user',
        id: '2',
        attributes: { name: 'Matt' },
        relationships: { bestFriend: { data: { type: 'user', id: '1' } } },
      },
      {
        type: 'user',
        id: '3',
        attributes: { name: 'Wes' },
        relationships: { bestFriend: { data: null } },
      },
    ],
  });
}

module('Writes | resource', function (hooks) {
  setupTest(hooks);

  test('we can set the data of a resource relationship on a checked out record', async function (assert) {
    const store = new Store();
    registerUser(store);
    const [Rey, Matt, Wes] = pushUsers(store);

    assert.equal(Rey.bestFriend.data, Matt, 'Rey has Matt as bestFriend');
    assert.equal(Matt.bestFriend.data, Rey, 'Matt has Rey as bestFriend');
    assert.equal(Wes.bestFriend.data, null, 'Wes has no bestFriend');

    const editableRey = await checkout<User>(Rey);
    assert.true(editableRey.bestFriend !== Rey.bestFriend, 'the editable record has its own document');
    assert.equal(editableRey.bestFriend.data, Matt, 'the editable document starts from the remote state');
    assert.equal(editableRey.bestFriend.remoteData, Matt, 'remoteData reflects the remote state');
    assert.false(editableRey.bestFriend.isDirty, 'the relationship is not dirty');
    const linksBefore = editableRey.bestFriend.links;
    const metaBefore = editableRey.bestFriend.meta;

    editableRey.bestFriend.data = Wes;

    assert.equal(editableRey.bestFriend.data, Wes, 'the editable document reflects the local change');
    assert.equal(editableRey.bestFriend.remoteData, Matt, 'remoteData still reflects the remote state');
    assert.true(editableRey.bestFriend.isDirty, 'the relationship is dirty');
    assert.true(Rey.bestFriend.isDirty, 'the immutable document reports the same dirty state');
    assert.equal(editableRey.bestFriend.links, linksBefore, 'links are untouched (same instance) by a local change');
    assert.equal(editableRey.bestFriend.meta, metaBefore, 'meta is untouched (same instance) by a local change');
    assert.equal(Rey.bestFriend.data, Matt, 'the immutable document still reflects the remote state');
    assert.equal(Rey.bestFriend.remoteData, Matt, 'remoteData on the immutable document is its data');
    assert.equal(Matt.bestFriend.data, Rey, 'the immutable inverse still reflects the remote state');
    assert.equal(Wes.bestFriend.data, null, 'the immutable inverse still reflects the remote state');

    const editableWes = await checkout<User>(Wes);
    const editableMatt = await checkout<User>(Matt);
    assert.equal(editableWes.bestFriend.data, Rey, 'the local inverse was updated');
    assert.equal(editableMatt.bestFriend.data, null, 'the local inverse was cleared');

    editableRey.bestFriend.data = null;
    assert.equal(editableRey.bestFriend.data, null, 'we can clear the relationship');
    assert.equal(editableWes.bestFriend.data, null, 'the local inverse was cleared');
    assert.equal(Rey.bestFriend.data, Matt, 'the immutable document still reflects the remote state');
  });

  test('a payload confirming a local change updates the immutable document', async function (assert) {
    const store = new Store();
    registerUser(store);
    const [Rey, Matt, Wes] = pushUsers(store);

    const editableRey = await checkout<User>(Rey);
    editableRey.bestFriend.data = Wes;
    assert.equal(Rey.bestFriend.data, Matt, 'the immutable document still reflects the remote state');

    // e.g. the response to a save request
    store.push<User>({
      data: {
        type: 'user',
        id: '1',
        attributes: { name: 'Rey' },
        relationships: { bestFriend: { data: { type: 'user', id: '3' } } },
      },
    });

    assert.equal(Rey.bestFriend.data, Wes, 'the immutable document reflects the confirmed state');
    assert.equal(editableRey.bestFriend.data, Wes, 'the editable document reflects the confirmed state');
    assert.equal(editableRey.bestFriend.remoteData, Wes, 'remoteData reflects the confirmed state');
    assert.false(editableRey.bestFriend.isDirty, 'the relationship is no longer dirty');
    assert.equal(Wes.bestFriend.data, Rey, 'the immutable inverse reflects the confirmed state');
    assert.equal(Matt.bestFriend.data, null, 'the immutable prior inverse reflects the confirmed state');
  });

  test('commit() promotes a local change to the immutable document', async function (assert) {
    const store = new Store();
    registerUser(store);
    const [Rey, Matt, Wes] = pushUsers(store);

    const editableRey = await checkout<User>(Rey);
    editableRey.bestFriend.data = Wes;
    assert.true(editableRey.bestFriend.isDirty, 'the relationship is dirty');
    assert.equal(Rey.bestFriend.data, Matt, 'the immutable document still reflects the remote state');

    await commit(editableRey);

    assert.equal(Rey.bestFriend.data, Wes, 'the immutable document reflects the committed state');
    assert.equal(editableRey.bestFriend.data, Wes, 'the editable document reflects the committed state');
    assert.equal(editableRey.bestFriend.remoteData, Wes, 'remoteData reflects the committed state');
    assert.false(editableRey.bestFriend.isDirty, 'the relationship is no longer dirty');
    assert.equal(Wes.bestFriend.data, Rey, 'the immutable inverse reflects the committed state');
    assert.equal(Matt.bestFriend.data, null, 'the immutable prior inverse reflects the committed state');
  });

  test('assigning the field itself is not allowed even when editable', async function (assert) {
    const store = new Store();
    registerUser(store);
    const [Rey, , Wes] = pushUsers(store);
    const editableRey = await checkout<User>(Rey);

    await assert.expectAssertion(() => {
      // @ts-expect-error we are testing the runtime guard
      editableRey.bestFriend = Wes;
    }, /Cannot set user.bestFriend directly. Set `data` on the relationship document instead/);

    await assert.expectAssertion(() => {
      // @ts-expect-error we are testing the runtime guard
      editableRey.bestFriend.data = 'not a record';
    }, /Expected a resource or null to be set as the data of user.bestFriend/);
  });

  test('resource relationships can be set via createRecord', async function (assert) {
    const store = new Store();
    registerUser(store);
    const [Rey, Matt] = pushUsers(store);

    const record = store.createRecord<User>('user', { name: 'Chris', bestFriend: Rey });

    assert.equal(record.name, 'Chris', 'name is set');
    assert.equal(record.bestFriend.data, Rey, 'bestFriend is set');
    assert.equal(Rey.bestFriend.data, Matt, 'the local inverse is not visible on the immutable record');
    const editableRey = await checkout<User>(Rey);
    assert.equal(
      recordIdentifierFor(editableRey.bestFriend.data!),
      recordIdentifierFor(record),
      'the local inverse is visible on the editable record'
    );
  });
});
