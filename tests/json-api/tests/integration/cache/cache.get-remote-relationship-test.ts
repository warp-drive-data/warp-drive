import { useRecommendedStore } from '@warp-drive/core';
import { withDefaults } from '@warp-drive/core/reactive';
import { isPrivateStore } from '@warp-drive/core/store/-private';
import type { ResourceKey } from '@warp-drive/core/types';
import type { Type } from '@warp-drive/core/types/symbols';
import { module, test } from '@warp-drive/diagnostic';
import { JSONAPICache } from '@warp-drive/json-api';

interface User {
  id: string;
  $type: 'user';
  $key: ResourceKey;
  name: string;
  bestFriend: User | null;
  friends: User[];
  [Type]: 'user';
}

const TestStore = useRecommendedStore({
  cache: JSONAPICache,
  schemas: [
    withDefaults({
      type: 'user',
      fields: [
        { kind: 'field', name: 'name' },
        {
          kind: 'belongsTo',
          type: 'user',
          name: 'bestFriend',
          options: { inverse: null, async: false, linksMode: true },
        },
        {
          kind: 'hasMany',
          type: 'user',
          name: 'friends',
          options: { inverse: null, async: false, linksMode: true },
        },
      ],
    }),
  ],
});
type TestStore = InstanceType<typeof TestStore>;

module('<JSONAPICache>.getRemoteRelationship', function () {
  test('returns the correct remote relationship data for a clean belongsTo (null)', function (assert) {
    const store = isPrivateStore(new TestStore());
    const cache = store.cache;
    const user = store.push<User>({
      data: {
        id: '1',
        type: 'user',
        attributes: {
          name: 'John Doe',
        },
        relationships: {
          bestFriend: {
            data: null,
          },
        },
      },
    });

    const state = cache.getRemoteRelationship(user.$key, 'bestFriend');
    assert.equal(state?.data, null, 'The cache value is defined as null');
    assert.deepEqual(
      state,
      {
        data: null,
      },
      'The cache value does not have extra properties'
    );
  });

  test('returns the correct remote relationship data for a never-set belongsTo (undefined)', function (assert) {
    const store = isPrivateStore(new TestStore());
    const cache = store.cache;
    const user = store.push<User>({
      data: {
        id: '1',
        type: 'user',
        attributes: {
          name: 'John Doe',
        },
        relationships: {
          bestFriend: { links: { related: '/users/1/relationships/bestFriend' } },
        },
      },
    });

    const key = user.$key;
    const state = cache.getRemoteRelationship(key, 'bestFriend');
    assert.false('data' in state, 'The cache value does not have a data property');
    assert.deepEqual(
      state,
      {
        links: {
          related: '/users/1/relationships/bestFriend',
        },
      },
      'The cache value does not have extra properties'
    );
  });

  test('returns the correct remote relationship data for a clean belongsTo (has value)', function (assert) {
    const store = isPrivateStore(new TestStore());
    const cache = store.cache;
    const user = store.push<User>({
      data: {
        id: '1',
        type: 'user',
        attributes: {
          name: 'John Doe',
        },
        relationships: {
          bestFriend: {
            data: {
              id: '2',
              type: 'user',
            },
          },
        },
      },
      included: [
        {
          id: '2',
          type: 'user',
          attributes: {
            name: 'Jane Doe',
          },
        },
      ],
    });

    const state = cache.getRemoteRelationship(user.$key, 'bestFriend');
    assert.deepEqual(
      state?.data,
      { id: '2', type: 'user', lid: '@lid:user-2' } as ResourceKey,
      'The cache value is present'
    );
    assert.deepEqual(
      state,
      {
        data: { id: '2', type: 'user', lid: '@lid:user-2' } as ResourceKey,
      },
      'The cache value does not have extra properties'
    );
  });
});
