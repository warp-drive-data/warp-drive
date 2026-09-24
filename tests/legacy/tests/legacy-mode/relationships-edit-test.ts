import { setOwner } from '@ember/owner';

import type { Type } from '@warp-drive/core/types/symbols';
import { module, setupTest, test } from '@warp-drive/diagnostic/ember';
import { JSONAPICache } from '@warp-drive/json-api';
import { useLegacyStore } from '@warp-drive/legacy';
import { JSONAPIAdapter } from '@warp-drive/legacy/adapter/json-api';
import { PromiseBelongsTo, PromiseManyArray } from '@warp-drive/legacy/model/-private';
import { withRestoredDeprecatedModelRequestBehaviors as withLegacy } from '@warp-drive/legacy/model/migration-support';

const Store = useLegacyStore({
  linksMode: false,
  cache: JSONAPICache,
});

module('Legacy | Edit | relationships', function (hooks) {
  setupTest(hooks);

  hooks.beforeEach(function () {
    this.owner.register('adapter:application', JSONAPIAdapter);
  });

  test('we can edit a sync belongsTo', function (assert) {
    type User = {
      id: string | null;
      $type: 'user';
      name: string;
      bestFriend: User | null;
      friends: User[];
      [Type]: 'user';
    };
    const store = new Store();
    setOwner(store, this.owner);
    this.owner.register('service:store', store, { instantiate: false });
    const { schema } = store;

    schema.registerResource(
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
            kind: 'belongsTo',
            options: { async: false, inverse: 'bestFriend' },
          },
        ],
      })
    );

    const Rey = store.push<User>({
      data: {
        type: 'user',
        id: '1',
        attributes: {
          name: 'Rey Skybarker',
        },
        relationships: {
          bestFriend: {
            data: { type: 'user', id: '2' },
          },
        },
      },
      included: [
        {
          type: 'user',
          id: '2',
          attributes: {
            name: 'Matt Seidel',
          },
          relationships: {
            bestFriend: {
              data: { type: 'user', id: '1' },
            },
          },
        },
        {
          type: 'user',
          id: '3',
          attributes: {
            name: 'Wesley Thoburn',
          },
          relationships: {
            bestFriend: {
              data: null,
            },
          },
        },
      ],
    });
    const Matt = store.peekRecord<User>('user', '2')!;
    const Wes = store.peekRecord<User>('user', '3')!;

    assert.equal(Rey.id, '1', 'id is accessible');
    assert.equal(Rey.name, 'Rey Skybarker', 'name is accessible');
    assert.equal(Rey.bestFriend, Matt, 'Rey has Matt as bestFriend');
    assert.equal(Matt.bestFriend, Rey, 'Matt has Rey as bestFriend');
    assert.equal(Wes.bestFriend, null, 'Wesley has no bestFriend');

    Rey.bestFriend = Wes;

    assert.equal(Rey.bestFriend, Wes, 'Wes is now the bestFriend of Rey');
    assert.equal(Wes.bestFriend, Rey, 'Rey is now the bestFriend of Wes');
    assert.equal(Matt.bestFriend, null, 'Matt no longer has a bestFriend');
  });

  test('we can replace a sync hasMany', function (assert) {
    type User = {
      id: string | null;
      $type: 'user';
      name: string;
      bestFriend: User | null;
      friends: User[];
      [Type]: 'user';
    };
    const store = new Store();
    setOwner(store, this.owner);
    this.owner.register('service:store', store, { instantiate: false });
    const { schema } = store;

    schema.registerResource(
      withLegacy({
        type: 'user',
        fields: [
          {
            name: 'name',
            type: null,
            kind: 'attribute',
          },
          {
            name: 'friends',
            type: 'user',
            kind: 'hasMany',
            options: { async: false, inverse: 'friends' },
          },
        ],
      })
    );

    const Rey = store.push<User>({
      data: {
        type: 'user',
        id: '1',
        attributes: {
          name: 'Rey Skybarker',
        },
        relationships: {
          friends: {
            data: [{ type: 'user', id: '2' }],
          },
        },
      },
      included: [
        {
          type: 'user',
          id: '2',
          attributes: {
            name: 'Matt Seidel',
          },
          relationships: {
            friends: {
              data: [{ type: 'user', id: '1' }],
            },
          },
        },
        {
          type: 'user',
          id: '3',
          attributes: {
            name: 'Wesley Thoburn',
          },
          relationships: {
            friends: {
              data: [],
            },
          },
        },
      ],
    });
    const Matt = store.peekRecord<User>('user', '2')!;
    const Wes = store.peekRecord<User>('user', '3')!;

    assert.equal(Rey.friends.length, 1, 'Rey has only one friend :(');
    assert.equal(Matt.friends.length, 1, 'Matt has only one friend :(');
    assert.equal(Wes.friends.length, 0, 'Wes has no friends :(');
    assert.equal(Rey.friends[0], Matt, 'Rey has Matt as a friend');
    assert.equal(Matt.friends[0], Rey, 'Matt has Rey as a friend');
    assert.equal(Wes.friends[0], undefined, 'Wes truly has no friends');

    Rey.friends = [Wes];

    assert.equal(Rey.friends.length, 1, 'Rey still has only one friend');
    assert.equal(Matt.friends.length, 0, 'Matt now has no friends');
    assert.equal(Wes.friends.length, 1, 'Wes now has one friend :)');
    assert.equal(Rey.friends[0], Wes, 'Rey has Wes as a friend');
    assert.equal(Wes.friends[0], Rey, 'Wes has Rey as a friend');
    assert.equal(Matt.friends[0], undefined, 'Matt has no friends');
  });

  test('we can edit a sync hasMany', function (assert) {
    type User = {
      id: string | null;
      $type: 'user';
      name: string;
      bestFriend: User | null;
      friends: User[];
      [Type]: 'user';
    };
    const store = new Store();
    setOwner(store, this.owner);
    this.owner.register('service:store', store, { instantiate: false });
    const { schema } = store;

    schema.registerResource(
      withLegacy({
        type: 'user',
        fields: [
          {
            name: 'name',
            type: null,
            kind: 'attribute',
          },
          {
            name: 'friends',
            type: 'user',
            kind: 'hasMany',
            options: { async: false, inverse: 'friends' },
          },
        ],
      })
    );

    const Rey = store.push<User>({
      data: {
        type: 'user',
        id: '1',
        attributes: {
          name: 'Rey Skybarker',
        },
        relationships: {
          friends: {
            data: [{ type: 'user', id: '2' }],
          },
        },
      },
      included: [
        {
          type: 'user',
          id: '2',
          attributes: {
            name: 'Matt Seidel',
          },
          relationships: {
            friends: {
              data: [{ type: 'user', id: '1' }],
            },
          },
        },
        {
          type: 'user',
          id: '3',
          attributes: {
            name: 'Wesley Thoburn',
          },
          relationships: {
            friends: {
              data: [],
            },
          },
        },
      ],
    });
    const Matt = store.peekRecord<User>('user', '2')!;
    const Wes = store.peekRecord<User>('user', '3')!;

    assert.equal(Rey.friends.length, 1, 'Rey has only one friend :(');
    assert.equal(Matt.friends.length, 1, 'Matt has only one friend :(');
    assert.equal(Wes.friends.length, 0, 'Wes has no friends :(');
    assert.equal(Rey.friends[0], Matt, 'Rey has Matt as a friend');
    assert.equal(Matt.friends[0], Rey, 'Matt has Rey as a friend');
    assert.equal(Wes.friends[0], undefined, 'Wes truly has no friends');

    Rey.friends.push(Wes);

    assert.equal(Rey.friends.length, 2, 'Rey now has two friends');
    assert.equal(Matt.friends.length, 1, 'Matt still has one friend');
    assert.equal(Wes.friends.length, 1, 'Wes now has one friend :)');
    assert.equal(Rey.friends[0], Matt, 'Rey has Matt as a friend');
    assert.equal(Rey.friends[1], Wes, 'Rey has Wes as a friend');
    assert.equal(Wes.friends[0], Rey, 'Wes has Rey as a friend');
    assert.equal(Matt.friends[0], Rey, 'Matt has Rey as a friend');
  });

  test('we can edit an async belongsTo', async function (assert) {
    type User = {
      id: string;
      name: string;
      bestFriend: PromiseBelongsTo<User | null>;
      [Type]: 'user';
    };
    const store = new Store();
    setOwner(store, this.owner);
    this.owner.register('service:store', store, { instantiate: false });
    const { schema } = store;

    schema.registerResource(
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
            kind: 'belongsTo',
            options: { async: true, inverse: 'bestFriend' },
          },
        ],
      })
    );

    const Rey = store.push<User>({
      data: {
        type: 'user',
        id: '1',
        attributes: {
          name: 'Rey Skybarker',
        },
        relationships: {
          bestFriend: {
            data: { type: 'user', id: '2' },
          },
        },
      },
      included: [
        {
          type: 'user',
          id: '2',
          attributes: {
            name: 'Matt Seidel',
          },
          relationships: {
            bestFriend: {
              data: { type: 'user', id: '1' },
            },
          },
        },
        {
          type: 'user',
          id: '3',
          attributes: {
            name: 'Wesley Thoburn',
          },
          relationships: {
            bestFriend: {
              data: null,
            },
          },
        },
      ],
    });
    const Matt = store.peekRecord<User>('user', '2')!;
    const Wes = store.peekRecord<User>('user', '3')!;

    const ReyBestFriend = await Rey.bestFriend;
    const MattBestFriend = await Matt.bestFriend;
    const WesBestFriend = await Wes.bestFriend;

    assert.equal(Rey.id, '1', 'id is accessible');
    assert.equal(Rey.name, 'Rey Skybarker', 'name is accessible');
    assert.true(Rey.bestFriend instanceof PromiseBelongsTo, 'Rey has an async bestFriend');
    assert.true(Matt.bestFriend instanceof PromiseBelongsTo, 'Matt has an async bestFriend');
    assert.true(Wes.bestFriend instanceof PromiseBelongsTo, 'Wes has an async bestFriend');

    assert.equal(ReyBestFriend, Matt, 'Rey has Matt as bestFriend');
    assert.equal(MattBestFriend, Rey, 'Matt has Rey as bestFriend');
    assert.equal(WesBestFriend, null, 'Wes has no bestFriend');

    // @ts-expect-error setting an async belongsTo cannot be properly typed
    Rey.bestFriend = Wes;

    const ReyBestFriend2 = await Rey.bestFriend;
    const MattBestFriend2 = await Matt.bestFriend;
    const WesBestFriend2 = await Wes.bestFriend;

    assert.equal(ReyBestFriend2, Wes, 'Rey now has Wes as bestFriend');
    assert.equal(MattBestFriend2, null, 'Matt now has no bestFriend');
    assert.equal(WesBestFriend2, Rey, 'Wes is now the bestFriend of Rey');
  });

  test('we can replace an async hasMany', async function (assert) {
    type User = {
      id: string;
      name: string;
      friends: PromiseManyArray<User>;
      [Type]: 'user';
    };
    const store = new Store();
    setOwner(store, this.owner);
    this.owner.register('service:store', store, { instantiate: false });
    const { schema } = store;

    schema.registerResource(
      withLegacy({
        type: 'user',
        fields: [
          {
            name: 'name',
            type: null,
            kind: 'attribute',
          },
          {
            name: 'friends',
            type: 'user',
            kind: 'hasMany',
            options: { async: true, inverse: 'friends' },
          },
        ],
      })
    );

    const Rey = store.push<User>({
      data: {
        type: 'user',
        id: '1',
        attributes: {
          name: 'Rey Skybarker',
        },
        relationships: {
          friends: {
            data: [{ type: 'user', id: '2' }],
          },
        },
      },
      included: [
        {
          type: 'user',
          id: '2',
          attributes: {
            name: 'Matt Seidel',
          },
          relationships: {
            friends: {
              data: [{ type: 'user', id: '1' }],
            },
          },
        },
        {
          type: 'user',
          id: '3',
          attributes: {
            name: 'Wesley Thoburn',
          },
          relationships: {
            friends: {
              data: [],
            },
          },
        },
      ],
    });
    const Matt = store.peekRecord<User>('user', '2')!;
    const Wes = store.peekRecord<User>('user', '3')!;

    const ReyFriends = await Rey.friends;
    const MattFriends = await Matt.friends;
    const WesFriends = await Wes.friends;

    assert.equal(Rey.id, '1', 'id is accessible');
    assert.equal(Rey.name, 'Rey Skybarker', 'name is accessible');

    assert.equal(Rey.friends.length, 1, 'Rey has only one friend :(');
    assert.equal(Matt.friends.length, 1, 'Matt has only one friend :(');
    assert.true(Rey.friends instanceof PromiseManyArray, 'Rey has async friends');
    assert.true(Matt.friends instanceof PromiseManyArray, 'Matt has async friends');
    assert.true(Wes.friends instanceof PromiseManyArray, 'Wes has async friends');

    assert.equal(ReyFriends.length, 1, 'Rey has only one friend :(');
    assert.equal(MattFriends.length, 1, 'Matt has only one friend :(');
    assert.equal(WesFriends.length, 0, 'Wes has no friends');
    assert.equal(ReyFriends[0], Matt, 'Rey has Matt as a friend');
    assert.equal(MattFriends[0], Rey, 'Matt has Rey as a friend');
    assert.equal(WesFriends[0], undefined, 'Rey really has no friends');

    // @ts-expect-error async hasMany cannot have a sync setter type :(
    Rey.friends = [Wes];

    assert.equal(Rey.friends.length, 1, 'Rey still has only one friend');
    assert.equal(Matt.friends.length, 0, 'Matt now has no friends');
    assert.equal(Wes.friends.length, 1, 'Wes now has one friend :)');
    assert.equal(ReyFriends[0], Wes, 'Rey has Wes as a friend');
    assert.equal(WesFriends[0], Rey, 'Wes has Rey as a friend');
    assert.equal(MattFriends[0], undefined, 'Matt has no friends');

    const ReyFriends2 = await Rey.friends;
    const MattFriends2 = await Matt.friends;
    const WesFriends2 = await Wes.friends;

    assert.equal(Rey.friends.length, 1, 'Rey still has only one friend');
    assert.equal(Matt.friends.length, 0, 'Matt now has no friends');
    assert.equal(Wes.friends.length, 1, 'Wes now has one friend :)');
    assert.equal(ReyFriends2[0], Wes, 'Rey has Wes as a friend');
    assert.equal(WesFriends2[0], Rey, 'Wes has Rey as a friend');
    assert.equal(MattFriends2[0], undefined, 'Matt has no friends');
  });

  test('we can edit an async hasMany', async function (assert) {
    type User = {
      id: string;
      name: string;
      friends: PromiseManyArray<User>;
      [Type]: 'user';
    };
    const store = new Store();
    setOwner(store, this.owner);
    this.owner.register('service:store', store, { instantiate: false });
    const { schema } = store;

    schema.registerResource(
      withLegacy({
        type: 'user',
        fields: [
          {
            name: 'name',
            type: null,
            kind: 'attribute',
          },
          {
            name: 'friends',
            type: 'user',
            kind: 'hasMany',
            options: { async: true, inverse: 'friends' },
          },
        ],
      })
    );

    const Rey = store.push<User>({
      data: {
        type: 'user',
        id: '1',
        attributes: {
          name: 'Rey Skybarker',
        },
        relationships: {
          friends: {
            data: [{ type: 'user', id: '2' }],
          },
        },
      },
      included: [
        {
          type: 'user',
          id: '2',
          attributes: {
            name: 'Matt Seidel',
          },
          relationships: {
            friends: {
              data: [{ type: 'user', id: '1' }],
            },
          },
        },
        {
          type: 'user',
          id: '3',
          attributes: {
            name: 'Wesley Thoburn',
          },
          relationships: {
            friends: {
              data: [],
            },
          },
        },
      ],
    });
    const Matt = store.peekRecord<User>('user', '2')!;
    const Wes = store.peekRecord<User>('user', '3')!;

    const ReyFriends = await Rey.friends;
    const MattFriends = await Matt.friends;
    const WesFriends = await Wes.friends;

    assert.equal(Rey.id, '1', 'id is accessible');
    assert.equal(Rey.name, 'Rey Skybarker', 'name is accessible');

    assert.equal(Rey.friends.length, 1, 'Rey has only one friend :(');
    assert.equal(Matt.friends.length, 1, 'Matt has only one friend :(');
    assert.true(Rey.friends instanceof PromiseManyArray, 'Rey has async friends');
    assert.true(Matt.friends instanceof PromiseManyArray, 'Matt has async friends');
    assert.true(Wes.friends instanceof PromiseManyArray, 'Wes has async friends');

    assert.equal(ReyFriends.length, 1, 'Rey has only one friend :(');
    assert.equal(MattFriends.length, 1, 'Matt has only one friend :(');
    assert.equal(WesFriends.length, 0, 'Wes has no friends');
    assert.equal(ReyFriends[0], Matt, 'Rey has Matt as a friend');
    assert.equal(MattFriends[0], Rey, 'Matt has Rey as a friend');
    assert.equal(WesFriends[0], undefined, 'Rey really has no friends');

    ReyFriends.push(Wes);

    assert.equal(Rey.friends.length, 2, 'Rey now has two friends');
    assert.equal(Matt.friends.length, 1, 'Matt still has one friends');
    assert.equal(Wes.friends.length, 1, 'Wes now has one friend :)');
    assert.equal(ReyFriends[0], Matt, 'Rey has Matt as a friend');
    assert.equal(ReyFriends[1], Wes, 'Rey has Wes as a friend');
    assert.equal(WesFriends[0], Rey, 'Wes has Rey as a friend');
    assert.equal(MattFriends[0], Rey, 'Matt has Rey as a friend');

    const ReyFriends2 = await Rey.friends;
    const MattFriends2 = await Matt.friends;
    const WesFriends2 = await Wes.friends;

    assert.equal(Rey.friends.length, 2, 'Rey now has two friends');
    assert.equal(Matt.friends.length, 1, 'Matt still has one friends');
    assert.equal(Wes.friends.length, 1, 'Wes now has one friend :)');
    assert.equal(ReyFriends2[0], Matt, 'Rey has Matt as a friend');
    assert.equal(ReyFriends2[1], Wes, 'Rey has Wes as a friend');
    assert.equal(WesFriends2[0], Rey, 'Wes has Rey as a friend');
    assert.equal(MattFriends2[0], Rey, 'Matt has Rey as a friend');
  });
});
