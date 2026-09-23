import { setOwner } from '@ember/owner';
import type { TestContext } from '@ember/test-helpers';

import type { ReactiveRelationshipDocument } from '@warp-drive/core/reactive';
import type { Type } from '@warp-drive/core/types/symbols';
import { module, setupTest, test } from '@warp-drive/diagnostic/ember';
import { JSONAPICache } from '@warp-drive/json-api';
import { useLegacyStore } from '@warp-drive/legacy';
import { JSONAPIAdapter } from '@warp-drive/legacy/adapter/json-api';
import { withRestoredDeprecatedModelRequestBehaviors as withLegacy } from '@warp-drive/legacy/model/migration-support';

const Store = useLegacyStore({
  linksMode: false,
  cache: JSONAPICache,
});

type User = {
  id: string | null;
  $type: 'user';
  name: string;
  bestFriend: ReactiveRelationshipDocument<User | null>;
  friends: ReactiveRelationshipDocument<User[]>;
  [Type]: 'user';
};

type Pet = {
  id: string | null;
  $type: 'pet';
  name: string;
  owner: User | null;
  [Type]: 'pet';
};

type Owner = User & { pets: ReactiveRelationshipDocument<Pet[]> };

function setupStore(context: TestContext) {
  const store = new Store();
  setOwner(store, context.owner);
  context.owner.register('service:store', store, { instantiate: false });
  context.owner.register('adapter:application', JSONAPIAdapter);
  store.schema.registerResource(
    withLegacy({
      type: 'user',
      fields: [
        {
          name: 'name',
          type: null,
          kind: 'attribute',
        },
        {
          name: 'bestFriend',
          type: 'user',
          kind: 'resource',
          options: { async: false, inverse: 'bestFriend' },
        },
        {
          name: 'friends',
          type: 'user',
          kind: 'collection',
          options: { async: false, inverse: 'friends' },
        },
        {
          name: 'pets',
          type: 'pet',
          kind: 'collection',
          options: { async: false, inverse: 'owner' },
        },
      ],
    })
  );
  store.schema.registerResource(
    withLegacy({
      type: 'pet',
      fields: [
        {
          name: 'name',
          type: null,
          kind: 'attribute',
        },
        {
          name: 'owner',
          type: 'user',
          kind: 'belongsTo',
          options: { async: false, inverse: 'pets' },
        },
      ],
    })
  );
  return store;
}

function pushUsers(store: InstanceType<typeof Store>) {
  return store.push<User>({
    data: [
      {
        type: 'user',
        id: '1',
        attributes: { name: 'Rey Skybarker' },
        relationships: {
          bestFriend: { data: { type: 'user', id: '2' } },
          friends: { data: [{ type: 'user', id: '2' }] },
          pets: { data: [] },
        },
      },
      {
        type: 'user',
        id: '2',
        attributes: { name: 'Matt Seidel' },
        relationships: {
          bestFriend: { data: { type: 'user', id: '1' } },
          friends: { data: [{ type: 'user', id: '1' }] },
          pets: { data: [] },
        },
      },
      {
        type: 'user',
        id: '3',
        attributes: { name: 'Wesley Thoburn' },
        relationships: {
          bestFriend: { data: null },
          friends: { data: [] },
          pets: { data: [] },
        },
      },
    ],
  });
}

module('Legacy | Edit | resource and collection', function (hooks) {
  setupTest(hooks);

  test('we can set the data of a resource relationship without checkout', function (this: TestContext, assert) {
    const store = setupStore(this);
    const [Rey, Matt, Wes] = pushUsers(store);

    assert.equal(Rey.bestFriend.data, Matt, 'Rey has Matt as bestFriend');
    assert.equal(Matt.bestFriend.data, Rey, 'Matt has Rey as bestFriend');
    assert.equal(Wes.bestFriend.data, null, 'Wesley has no bestFriend');

    assert.false(Rey.bestFriend.isDirty, 'the relationship is not dirty');

    Rey.bestFriend.data = Wes;

    assert.equal(Rey.bestFriend.data, Wes, 'Wes is now the bestFriend of Rey');
    assert.equal(Rey.bestFriend.remoteData, Matt, 'remoteData still reflects the remote state');
    assert.true(Rey.bestFriend.isDirty, 'the relationship is dirty');
    assert.equal(Wes.bestFriend.data, Rey, 'Rey is now the bestFriend of Wes');
    assert.equal(Matt.bestFriend.data, null, 'Matt no longer has a bestFriend');

    Rey.bestFriend.data = null;
    assert.equal(Rey.bestFriend.data, null, 'Rey no longer has a bestFriend');
    assert.equal(Wes.bestFriend.data, null, 'Wes no longer has a bestFriend');
  });

  test('we can mutate and replace a collection relationship without checkout', function (this: TestContext, assert) {
    const store = setupStore(this);
    const [Rey, Matt, Wes] = pushUsers(store);
    const friends = Rey.friends.data!;

    assert.arrayEquals(
      friends.map((f) => f.id),
      ['2'],
      'Rey has Matt as a friend'
    );

    friends.push(Wes);
    assert.arrayEquals(
      friends.map((f) => f.id),
      ['2', '3'],
      'Wes was added'
    );
    assert.equal(Wes.friends.data?.[0], Rey, 'the inverse was updated');

    friends.shift();
    assert.arrayEquals(
      friends.map((f) => f.id),
      ['3'],
      'Matt was removed'
    );
    assert.equal(Matt.friends.data?.length, 0, 'the inverse was updated');

    Rey.friends.data = [Matt, Wes];
    assert.equal(Rey.friends.data, friends, 'the array instance is stable');
    assert.arrayEquals(
      friends.map((f) => f.id),
      ['2', '3'],
      'the membership was replaced'
    );
    assert.equal(Matt.friends.data?.[0], Rey, 'the inverse was updated');
  });

  test('a collection relationship stays in sync with a legacy belongsTo inverse', function (this: TestContext, assert) {
    const store = setupStore(this);
    const [Rey, Matt] = pushUsers(store) as unknown as Owner[];
    const [Rex, Shen] = store.push<Pet>({
      data: [
        {
          type: 'pet',
          id: '1',
          attributes: { name: 'Rex' },
          relationships: { owner: { data: { type: 'user', id: '1' } } },
        },
        {
          type: 'pet',
          id: '2',
          attributes: { name: 'Shen' },
          relationships: { owner: { data: null } },
        },
      ],
    });

    assert.equal(Rey.pets.data?.[0], Rex, 'Rey owns Rex');
    assert.equal(Rex.owner, Rey, 'Rex is owned by Rey');

    Rey.pets.data!.push(Shen);
    assert.equal(Shen.owner, Rey, 'setting the collection updates the legacy belongsTo');

    Shen.owner = Matt;
    assert.arrayEquals(
      Rey.pets.data!.map((p) => p.id),
      ['1'],
      'setting the legacy belongsTo updates the collection'
    );
    assert.equal(Matt.pets.data?.[0], Shen, 'setting the legacy belongsTo updates the new owner');
  });

  test('assigning the field itself is not allowed', async function (this: TestContext, assert) {
    const store = setupStore(this);
    const [Rey, , Wes] = pushUsers(store);

    await assert.expectAssertion(() => {
      // @ts-expect-error we are testing the runtime guard
      Rey.bestFriend = Wes;
    }, /Cannot set user.bestFriend directly/);

    await assert.expectAssertion(() => {
      // @ts-expect-error we are testing the runtime guard
      Rey.friends = [Wes];
    }, /Cannot set user.friends directly/);
  });

  test('resource and collection relationships can be set via createRecord', function (this: TestContext, assert) {
    const store = setupStore(this);
    const [Rey, Matt] = pushUsers(store);

    const record = store.createRecord<User>('user', { name: 'Chris', bestFriend: Rey, friends: [Matt] });

    assert.equal(record.bestFriend.data, Rey, 'bestFriend is set');
    assert.equal(Rey.bestFriend.data, record, 'the inverse is set');
    assert.equal(record.friends.data?.[0], Matt, 'friends are set');
    assert.equal(Matt.friends.data?.length, 2, 'the collection inverse is set');
    assert.equal(Matt.friends.data?.[1], record, 'the collection inverse contains the new record');
  });
});
