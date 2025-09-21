import { setOwner } from '@ember/owner';

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
});
