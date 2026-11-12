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
      ],
    })
  );
  return store;
}

module('Legacy | Reads | resource and collection', function (hooks) {
  setupTest(hooks);

  test('resource and collection fields are documents in LegacyMode', function (this: TestContext, assert) {
    const store = setupStore(this);

    const Rey = store.push<User>({
      data: {
        type: 'user',
        id: '1',
        attributes: { name: 'Rey Skybarker' },
        relationships: {
          bestFriend: {
            links: { related: '/user/1/bestFriend' },
            data: { type: 'user', id: '2' },
          },
          friends: {
            links: { related: '/user/1/friends' },
            meta: { count: 1 },
            data: [{ type: 'user', id: '2' }],
          },
        },
      },
      included: [
        {
          type: 'user',
          id: '2',
          attributes: { name: 'Matt Seidel' },
          relationships: {
            bestFriend: { data: { type: 'user', id: '1' } },
            friends: { data: [{ type: 'user', id: '1' }] },
          },
        },
      ],
    });
    const Matt = store.peekRecord<User>('user', '2')!;

    assert.equal(Rey.name, 'Rey Skybarker', 'name is accessible');
    assert.equal(Rey.bestFriend.data, Matt, 'Rey has Matt as bestFriend');
    assert.deepEqual(Rey.bestFriend.links, { related: '/user/1/bestFriend' }, 'bestFriend links are accessible');
    assert.equal(Matt.bestFriend.data, Rey, 'Matt has Rey as bestFriend');

    assert.equal(Rey.friends.data?.length, 1, 'Rey has one friend');
    assert.equal(Rey.friends.data?.[0], Matt, 'Rey has Matt as a friend');
    assert.deepEqual(Rey.friends.meta, { count: 1 }, 'friends meta is accessible');
    assert.equal(Matt.friends.data?.[0], Rey, 'Matt has Rey as a friend');

    assert.equal(Rey.bestFriend, Rey.bestFriend, 'the document instance is stable');
    assert.equal(Rey.friends.data, Rey.friends.data, 'the array instance is stable');
  });

  test('a remote update is reflected without checkout in LegacyMode', function (this: TestContext, assert) {
    const store = setupStore(this);

    const Rey = store.push<User>({
      data: {
        type: 'user',
        id: '1',
        attributes: { name: 'Rey Skybarker' },
        relationships: {
          bestFriend: { data: { type: 'user', id: '2' } },
          friends: { data: [{ type: 'user', id: '2' }] },
        },
      },
      included: [
        {
          type: 'user',
          id: '2',
          attributes: { name: 'Matt Seidel' },
          relationships: {
            bestFriend: { data: { type: 'user', id: '1' } },
            friends: { data: [{ type: 'user', id: '1' }] },
          },
        },
        {
          type: 'user',
          id: '3',
          attributes: { name: 'Wesley Thoburn' },
          relationships: {
            bestFriend: { data: null },
            friends: { data: [] },
          },
        },
      ],
    });
    const Wes = store.peekRecord<User>('user', '3')!;
    const bestFriend = Rey.bestFriend;
    const friends = Rey.friends.data!;

    store.push<User>({
      data: {
        type: 'user',
        id: '1',
        attributes: { name: 'Rey Skybarker' },
        relationships: {
          bestFriend: { data: { type: 'user', id: '3' } },
          friends: {
            data: [
              { type: 'user', id: '3' },
              { type: 'user', id: '2' },
            ],
          },
        },
      },
    });

    assert.equal(Rey.bestFriend, bestFriend, 'the document instance is stable');
    assert.equal(bestFriend.data, Wes, 'bestFriend was updated');
    assert.equal(Rey.friends.data, friends, 'the array instance is stable');
    assert.arrayEquals(
      friends.map((f) => f.id),
      ['3', '2'],
      'friends were updated'
    );
    assert.equal(Wes.bestFriend.data, Rey, 'the inverse was updated');
    assert.equal(Wes.friends.data?.[0], Rey, 'the collection inverse was updated');
  });
});
