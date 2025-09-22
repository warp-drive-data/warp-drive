import { setOwner } from '@ember/owner';

import type { Type } from '@warp-drive/core/types/symbols';
import { module, setupTest, test } from '@warp-drive/diagnostic/ember';
import { JSONAPICache } from '@warp-drive/json-api';
import { useLegacyStore } from '@warp-drive/legacy';
import { JSONAPIAdapter } from '@warp-drive/legacy/adapter/json-api';
import type { AsyncHasMany } from '@warp-drive/legacy/model';
import { PromiseBelongsTo, PromiseManyArray } from '@warp-drive/legacy/model/-private';
import { withRestoredDeprecatedModelRequestBehaviors as withLegacy } from '@warp-drive/legacy/model/migration-support';

const Store = useLegacyStore({
  linksMode: false,
  cache: JSONAPICache,
});

module('Legacy | Create | relationships', function (hooks) {
  setupTest(hooks);

  hooks.beforeEach(function () {
    this.owner.register('adapter:application', JSONAPIAdapter);
  });

  test('we can create with a belongsTo', function (assert) {
    type User = {
      id: string | null;
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
    const Matt = store.push<User>({
      data: {
        type: 'user',
        id: '2',
        attributes: {
          name: 'Matt Seidel',
        },
        relationships: {
          bestFriend: {
            data: null,
          },
        },
      },
    });

    const Rey = store.createRecord<User>('user', {
      name: 'Rey Skybarker',
      bestFriend: Matt,
    });

    assert.equal(Rey.id, null, 'id is accessible');
    assert.equal(Rey.name, 'Rey Skybarker', 'name is accessible');
    assert.equal(Rey.bestFriend, Matt, 'Rey has Matt as bestFriend');
    assert.equal(Matt.bestFriend, Rey, 'Matt has Rey as bestFriend');
  });

  test('we can create with a hasMany', function (assert) {
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

    const Matt = store.push<User>({
      data: {
        type: 'user',
        id: '2',
        attributes: {
          name: 'Matt Seidel',
        },
        relationships: {
          friends: {
            data: [],
          },
        },
      },
    });

    const Rey = store.createRecord<User>('user', {
      name: 'Rey Skybarker',
      friends: [Matt],
    });

    assert.equal(Rey.id, null, 'id is accessible');
    assert.equal(Rey.name, 'Rey Skybarker', 'name is accessible');
    assert.equal(Rey.friends.length, 1, 'Rey has only one friend :(');
    assert.equal(Matt.friends.length, 1, 'Matt has only one friend :(');
    assert.equal(Rey.friends[0], Matt, 'Rey has Matt as bestFriend');
    assert.equal(Matt.friends[0], Rey, 'Matt has Rey as bestFriend');
  });

  test('we can create with an async belongsTo', async function (assert) {
    type User = {
      id: string | null;
      $type: 'user';
      name: string;
      bestFriend: Promise<User | null>;
      friends: AsyncHasMany<User>;
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

    const Matt = store.push<User>({
      data: {
        type: 'user',
        id: '2',
        attributes: {
          name: 'Matt Seidel',
        },
        relationships: {
          bestFriend: {
            data: null,
          },
        },
      },
    });

    const Rey = store.createRecord<User>('user', {
      name: 'Rey Skybarker',
      bestFriend: Matt,
    });

    assert.equal(Rey.id, null, 'id is accessible');
    assert.equal(Rey.name, 'Rey Skybarker', 'name is accessible');
    assert.true(Rey.bestFriend instanceof PromiseBelongsTo, 'Rey has an async bestFriend');

    const ReyBestFriend = await Rey.bestFriend;
    assert.equal(ReyBestFriend, Matt, 'Rey has Matt as bestFriend');

    const MattBestFriend = await Matt.bestFriend;
    assert.equal(MattBestFriend, Rey, 'Matt has Rey as bestFriend');
  });

  test('we can create with an async hasMany', async function (assert) {
    type User = {
      id: string | null;
      name: string;
      bestFriend: Promise<User | null>;
      friends: AsyncHasMany<User>;
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

    const Matt = store.push<User>({
      data: {
        type: 'user',
        id: '2',
        attributes: {
          name: 'Matt Seidel',
        },
        relationships: {
          friends: {
            data: [],
          },
        },
      },
    });

    const Rey = store.createRecord<User>('user', {
      name: 'Rey Skybarker',
      friends: [Matt],
    });

    assert.equal(Rey.id, null, 'id is accessible');
    assert.equal(Rey.name, 'Rey Skybarker', 'name is accessible');
    assert.true(Rey.friends instanceof PromiseManyArray, 'Rey has async friends');

    const ReyFriends = await Rey.friends;
    assert.equal(ReyFriends.length, 1, 'Rey has only one friend :(');
    assert.equal(ReyFriends[0], Matt, 'Rey has Matt as friend');

    const MattFriends = await Matt.friends;
    assert.equal(MattFriends.length, 1, 'Matt has only one friend :(');
    assert.equal(MattFriends[0], Rey, 'Matt has Rey as friend');
  });
});
