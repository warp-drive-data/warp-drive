import { setOwner } from '@ember/owner';

import type { ReactiveRelationshipDocument } from '@warp-drive/core/reactive';
import type { Type } from '@warp-drive/core/types/symbols';
import { module, setupTest, test } from '@warp-drive/diagnostic/ember';
import { JSONAPICache } from '@warp-drive/json-api';
import { useLegacyStore } from '@warp-drive/legacy';
import { withRestoredDeprecatedModelRequestBehaviors as withLegacy } from '@warp-drive/legacy/model/migration-support';

const Store = useLegacyStore({
  linksMode: false,
  cache: JSONAPICache,
});

module('Legacy | Reads | SourceKey', function (hooks) {
  setupTest(hooks);

  test('belongsTo can use sourceKey', function (assert) {
    type User = {
      id: string | null;
      $type: 'user';
      name: string;
      bestFriend: User | null;
      [Type]: 'user';
    };
    const store = new Store();
    setOwner(store, this.owner);
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
            sourceKey: 'best-friend',
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
          'best-friend': {
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
            'best-friend': {
              data: { type: 'user', id: '1' },
            },
          },
        },
      ],
    });
    const Matt = store.peekRecord<User>('user', '2')!;

    assert.equal(Rey.id, '1', 'id is accessible');
    assert.equal(Rey.name, 'Rey Skybarker', 'name is accessible');
    assert.equal(Rey.bestFriend, Matt, 'Rey has Matt as bestFriend');
    assert.equal(Matt.bestFriend, Rey, 'Matt has Rey as bestFriend');
  });

  test('hasMany can use sourceKey', function (assert) {
    type User = {
      id: string | null;
      $type: 'user';
      name: string;
      friends: User[];
      [Type]: 'user';
    };
    const store = new Store();
    setOwner(store, this.owner);
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
            sourceKey: 'best-friends',
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
          'best-friends': {
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
            'best-friends': {
              data: [{ type: 'user', id: '1' }],
            },
          },
        },
      ],
    });
    const Matt = store.peekRecord<User>('user', '2')!;

    assert.equal(Rey.id, '1', 'id is accessible');
    assert.equal(Rey.name, 'Rey Skybarker', 'name is accessible');
    assert.equal(Rey.friends.length, 1, 'Rey has only one friend :(');
    assert.equal(Matt.friends.length, 1, 'Matt has only one friend :(');
    assert.equal(Rey.friends[0], Matt, 'Rey has Matt as bestFriend');
    assert.equal(Matt.friends[0], Rey, 'Matt has Rey as bestFriend');
  });

  test('belongsTo with a sourceKey resolves its inverse', function (assert) {
    type User = {
      id: string | null;
      $type: 'user';
      name: string;
      bestFriend: User | null;
      [Type]: 'user';
    };
    const store = new Store();
    setOwner(store, this.owner);
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
            sourceKey: 'best-friend',
            type: 'user',
            kind: 'belongsTo',
            options: { async: false, inverse: 'bestFriend' },
          },
        ],
      })
    );

    // only Rey's side of the relationship is in the payload, so Matt's
    // side comes entirely from the inverse update in the graph
    const Rey = store.push<User>({
      data: {
        type: 'user',
        id: '1',
        attributes: {
          name: 'Rey Skybarker',
        },
        relationships: {
          'best-friend': {
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
        },
        {
          type: 'user',
          id: '3',
          attributes: {
            name: 'Wesley Thoburn',
          },
        },
      ],
    });
    const Matt = store.peekRecord<User>('user', '2')!;
    const Wes = store.peekRecord<User>('user', '3')!;

    assert.equal(Rey.bestFriend, Matt, 'Rey has Matt as bestFriend');
    assert.equal(Matt.bestFriend, Rey, 'Matt has Rey as bestFriend via the inverse');
    assert.equal(Wes.bestFriend, null, 'Wes has no bestFriend');

    // a remote update keyed by the sourceKey updates both inverses
    store.push<User>({
      data: {
        type: 'user',
        id: '1',
        relationships: {
          'best-friend': {
            data: { type: 'user', id: '3' },
          },
        },
      },
    });
    assert.equal(Rey.bestFriend, Wes, 'Rey has Wes as bestFriend');
    assert.equal(Wes.bestFriend, Rey, 'Wes has Rey as bestFriend via the inverse');
    assert.equal(Matt.bestFriend, null, 'Matt no longer has a bestFriend');

    // a local change updates both inverses
    Rey.bestFriend = Matt;
    assert.equal(Rey.bestFriend, Matt, 'Rey has Matt as bestFriend again');
    assert.equal(Matt.bestFriend, Rey, 'Matt has Rey as bestFriend via the inverse');
    assert.equal(Wes.bestFriend, null, 'Wes no longer has a bestFriend');
  });

  test('hasMany with a sourceKey resolves its inverse', function (assert) {
    type User = {
      id: string | null;
      $type: 'user';
      name: string;
      friends: User[];
      [Type]: 'user';
    };
    const store = new Store();
    setOwner(store, this.owner);
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
            sourceKey: 'best-friends',
            kind: 'hasMany',
            options: { async: false, inverse: 'friends' },
          },
        ],
      })
    );

    // only Rey's side of the relationship is ever in a payload, so Matt's and
    // Wes's sides come entirely from the inverse updates in the graph
    const Rey = store.push<User>({
      data: {
        type: 'user',
        id: '1',
        attributes: {
          name: 'Rey Skybarker',
        },
        relationships: {
          'best-friends': {
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
        },
        {
          type: 'user',
          id: '3',
          attributes: {
            name: 'Wesley Thoburn',
          },
        },
      ],
    });
    // a remote update keyed by the sourceKey updates both inverses
    store.push<User>({
      data: {
        type: 'user',
        id: '1',
        relationships: {
          'best-friends': {
            data: [{ type: 'user', id: '3' }],
          },
        },
      },
    });

    const Matt = store.peekRecord<User>('user', '2')!;
    const Wes = store.peekRecord<User>('user', '3')!;
    const friendIds = (user: User) => user.friends.map((friend) => friend.id);

    assert.deepEqual(friendIds(Rey), ['3'], 'Rey has Wes as a friend');
    assert.deepEqual(friendIds(Wes), ['1'], 'Wes has Rey as a friend via the inverse');
    assert.deepEqual(friendIds(Matt), [], 'Matt no longer has Rey as a friend via the inverse');
  });

  test('resource can use sourceKey', function (assert) {
    type User = {
      id: string | null;
      $type: 'user';
      name: string;
      bestFriend: ReactiveRelationshipDocument<User | null>;
      [Type]: 'user';
    };
    const store = new Store();
    setOwner(store, this.owner);
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
            sourceKey: 'best-friend',
            type: 'user',
            kind: 'resource',
            options: { async: false, inverse: 'bestFriend' },
          },
        ],
      })
    );

    // only Rey's side of the relationship is in the payload, so Matt's
    // side comes entirely from the inverse update in the graph
    const Rey = store.push<User>({
      data: {
        type: 'user',
        id: '1',
        attributes: {
          name: 'Rey Skybarker',
        },
        relationships: {
          'best-friend': {
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
        },
        {
          type: 'user',
          id: '3',
          attributes: {
            name: 'Wesley Thoburn',
          },
        },
      ],
    });
    const Matt = store.peekRecord<User>('user', '2')!;
    const Wes = store.peekRecord<User>('user', '3')!;

    assert.equal(Rey.id, '1', 'id is accessible');
    assert.equal(Rey.name, 'Rey Skybarker', 'name is accessible');
    assert.equal(Rey.bestFriend.data, Matt, 'Rey has Matt as bestFriend');
    assert.equal(Matt.bestFriend.data, Rey, 'Matt has Rey as bestFriend via the inverse');
    assert.equal(Wes.bestFriend.data, undefined, 'Wes has never received data for bestFriend');

    // a remote update keyed by the sourceKey updates both inverses
    store.push<User>({
      data: {
        type: 'user',
        id: '1',
        relationships: {
          'best-friend': {
            data: { type: 'user', id: '3' },
          },
        },
      },
    });
    assert.equal(Rey.bestFriend.data, Wes, 'Rey has Wes as bestFriend');
    assert.equal(Wes.bestFriend.data, Rey, 'Wes has Rey as bestFriend via the inverse');
    assert.equal(Matt.bestFriend.data, null, 'Matt no longer has a bestFriend');

    // a local change updates both inverses
    Rey.bestFriend.data = Matt;
    assert.equal(Rey.bestFriend.data, Matt, 'Rey has Matt as bestFriend again');
    assert.equal(Matt.bestFriend.data, Rey, 'Matt has Rey as bestFriend via the inverse');
    assert.equal(Wes.bestFriend.data, null, 'Wes no longer has a bestFriend');
  });

  test('collection can use sourceKey', function (assert) {
    type User = {
      id: string | null;
      $type: 'user';
      name: string;
      friends: ReactiveRelationshipDocument<User[]>;
      [Type]: 'user';
    };
    const store = new Store();
    setOwner(store, this.owner);
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
            sourceKey: 'best-friends',
            kind: 'collection',
            options: { async: false, inverse: 'friends' },
          },
        ],
      })
    );

    // only Rey's side of the relationship is in the payload, so Matt's
    // side comes entirely from the inverse update in the graph
    const Rey = store.push<User>({
      data: {
        type: 'user',
        id: '1',
        attributes: {
          name: 'Rey Skybarker',
        },
        relationships: {
          'best-friends': {
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
        },
        {
          type: 'user',
          id: '3',
          attributes: {
            name: 'Wesley Thoburn',
          },
        },
      ],
    });
    const Matt = store.peekRecord<User>('user', '2')!;
    const Wes = store.peekRecord<User>('user', '3')!;

    assert.equal(Rey.id, '1', 'id is accessible');
    assert.equal(Rey.name, 'Rey Skybarker', 'name is accessible');
    assert.equal(Rey.friends.data!.length, 1, 'Rey has only one friend :(');
    assert.equal(Matt.friends.data!.length, 1, 'Matt has only one friend :(');
    assert.equal(Rey.friends.data![0], Matt, 'Rey has Matt as a friend');
    assert.equal(Matt.friends.data![0], Rey, 'Matt has Rey as a friend via the inverse');
    assert.equal(Wes.friends.data, undefined, 'Wes has never received data for friends');

    // a remote update keyed by the sourceKey updates both inverses
    store.push<User>({
      data: {
        type: 'user',
        id: '1',
        relationships: {
          'best-friends': {
            data: [{ type: 'user', id: '3' }],
          },
        },
      },
    });
    assert.equal(Rey.friends.data!.length, 1, 'Rey still has only one friend :(');
    assert.equal(Rey.friends.data![0], Wes, 'Rey has Wes as a friend');
    assert.equal(Wes.friends.data!.length, 1, 'Wes has one friend');
    assert.equal(Wes.friends.data![0], Rey, 'Wes has Rey as a friend via the inverse');
    assert.equal(Matt.friends.data!.length, 0, 'Matt no longer has any friends :(');

    // a local change updates both inverses
    Rey.friends.data!.push(Matt);
    assert.equal(Rey.friends.data!.length, 2, 'Rey has two friends');
    assert.equal(Matt.friends.data!.length, 1, 'Matt has one friend');
    assert.equal(Matt.friends.data![0], Rey, 'Matt has Rey as a friend via the inverse');
    assert.equal(Wes.friends.data![0], Rey, 'Wes still has Rey as a friend');
  });
});
