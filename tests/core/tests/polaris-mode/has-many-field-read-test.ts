import { recordIdentifierFor, useRecommendedStore } from '@warp-drive/core';
import { withDefaults } from '@warp-drive/core/reactive';
import type { Context } from '@warp-drive/core/request';
import type { RelatedCollection } from '@warp-drive/core/store/-private';
import type { Type } from '@warp-drive/core/types/symbols';
import { module, setupTest, skip, test } from '@warp-drive/diagnostic/ember';
import { JSONAPICache } from '@warp-drive/json-api';

const Store = useRecommendedStore({
  cache: JSONAPICache,
});
type User = {
  id: string | null;
  $type: 'user';
  name: string;
  friends: User[] | null;
  [Type]: 'user';
};

module('Reads | hasMany in linksMode', function (hooks) {
  setupTest(hooks);

  test('we can use sync hasMany in linksMode', function (assert) {
    const store = new Store();
    const { schema } = store;

    schema.registerResource(
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
            kind: 'hasMany',
            options: { inverse: 'friends', async: false, linksMode: true },
          },
        ],
      })
    );

    const record = store.push<User>({
      data: {
        type: 'user',
        id: '1',
        attributes: {
          name: 'Leo',
        },
        relationships: {
          friends: {
            links: { related: '/user/1/friends' },
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
          attributes: {
            name: 'Benedikt',
          },
          relationships: {
            friends: {
              links: { related: '/user/2/friends' },
              data: [{ type: 'user', id: '1' }],
            },
          },
        },
        {
          type: 'user',
          id: '3',
          attributes: {
            name: 'Jane',
          },
          relationships: {
            friends: {
              links: { related: '/user/3/friends' },
              data: [{ type: 'user', id: '1' }],
            },
          },
        },
      ],
    });

    assert.equal(record.id, '1', 'id is accessible');
    assert.equal(record.$type, 'user', '$type is accessible');
    assert.equal(record.name, 'Leo', 'name is accessible');
    assert.true(record.friends instanceof Array, 'Friends is an instance of Array');
    assert.true(Array.isArray(record.friends), 'Friends is an array');
    assert.equal(record.friends?.length, 2, 'friends has 2 items');
    assert.equal(record.friends?.[0].id, '2', 'friends[0].id is accessible');
    assert.equal(record.friends?.[0].$type, 'user', 'friends[0].user is accessible');
    assert.equal(record.friends?.[0].name, 'Benedikt', 'friends[0].name is accessible');
    assert.equal(record.friends?.[0].friends?.[0].id, record.id, 'friends is reciprocal');
  });

  test('we can update sync hasMany in linksMode', function (assert) {
    const store = new Store();
    const { schema } = store;

    schema.registerResource(
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
            kind: 'hasMany',
            options: { inverse: 'friends', async: false, linksMode: true },
          },
        ],
      })
    );

    const record = store.push<User>({
      data: {
        type: 'user',
        id: '1',
        attributes: {
          name: 'Leo',
        },
        relationships: {
          friends: {
            links: { related: '/user/1/friends' },
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
          attributes: {
            name: 'Benedikt',
          },
          relationships: {
            friends: {
              links: { related: '/user/2/friends' },
              data: [{ type: 'user', id: '1' }],
            },
          },
        },
        {
          type: 'user',
          id: '3',
          attributes: {
            name: 'Jane',
          },
          relationships: {
            friends: {
              links: { related: '/user/3/friends' },
              data: [{ type: 'user', id: '1' }],
            },
          },
        },
      ],
    });

    assert.equal(record.id, '1', 'id is accessible');
    assert.equal(record.name, 'Leo', 'name is accessible');
    assert.equal(record.friends?.length, 2, 'friends.length is accessible');
    assert.equal(record.friends?.[0]?.id, '2', 'friends[0].id is accessible');
    assert.equal(record.friends?.[0]?.name, 'Benedikt', 'friends[0].name is accessible');

    // ensure cache is still accurate
    const serialized = store.cache.peek(recordIdentifierFor(record));
    assert.satisfies(
      serialized,
      {
        type: 'user',
        id: '1',
        lid: '@lid:user-1',
        attributes: {
          name: 'Leo',
        },
        relationships: {
          friends: {
            links: { related: '/user/1/friends' },
            data: [
              { type: 'user', id: '2', lid: '@lid:user-2' },
              { type: 'user', id: '3', lid: '@lid:user-3' },
            ],
          },
        },
      },
      'cache is accurate'
    );

    store.push<User>({
      data: {
        type: 'user',
        id: '1',
        attributes: {
          name: 'Leo',
        },
        relationships: {
          friends: {
            links: { related: '/user/1/friends' },
            data: [{ type: 'user', id: '3' }],
          },
        },
      },
      included: [
        {
          type: 'user',
          id: '3',
          attributes: {
            name: 'Jane',
          },
          relationships: {
            friends: {
              links: { related: '/user/3/friends' },
              data: [
                { type: 'user', id: '1' },
                { type: 'user', id: '2' },
              ],
            },
          },
        },
      ],
    });

    assert.equal(record.id, '1', 'id is accessible');
    assert.equal(record.name, 'Leo', 'name is accessible');
    assert.equal(record.friends?.length, 1, 'friends.length is accessible');
    assert.equal(record.friends?.[0]?.id, '3', 'friends[0].id is accessible');
    assert.equal(record.friends?.[0]?.name, 'Jane', 'friends[0].name is accessible');
    assert.equal(record.friends?.[0]?.friends?.length, 2, 'friends[0].friends.length is accessible');
    assert.equal(record.friends?.[0]?.friends?.[0].id, '1', 'friends[0].friends[0].id is accessible');
    assert.equal(record.friends?.[0]?.friends?.[0].name, 'Leo', 'friends[0].friends[0].name is accessible');

    // ensure cache is still accurate
    const serialized2 = store.cache.peek(recordIdentifierFor(record));
    assert.satisfies(
      serialized2,
      {
        type: 'user',
        id: '1',
        lid: '@lid:user-1',
        attributes: {
          name: 'Leo',
        },
        relationships: {
          friends: {
            links: { related: '/user/1/friends' },
            data: [{ type: 'user', id: '3', lid: '@lid:user-3' }],
          },
        },
      },
      'cache is accurate'
    );
  });

  test('we can update sync hasMany in linksMode with the same data in a different order', function (assert) {
    const store = new Store();
    const { schema } = store;

    schema.registerResource(
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
            kind: 'hasMany',
            options: { inverse: 'friends', async: false, linksMode: true },
          },
        ],
      })
    );

    const record = store.push<User>({
      data: {
        type: 'user',
        id: '1',
        attributes: {
          name: 'Leo',
        },
        relationships: {
          friends: {
            links: { related: '/user/1/friends' },
            data: [
              { type: 'user', id: '2' },
              { type: 'user', id: '3' },
              { type: 'user', id: '4' },
            ],
          },
        },
      },
      included: [
        {
          type: 'user',
          id: '2',
          attributes: {
            name: 'Benedikt',
          },
          relationships: {
            friends: {
              links: { related: '/user/2/friends' },
              data: [{ type: 'user', id: '1' }],
            },
          },
        },
        {
          type: 'user',
          id: '3',
          attributes: {
            name: 'Jane',
          },
          relationships: {
            friends: {
              links: { related: '/user/3/friends' },
              data: [{ type: 'user', id: '1' }],
            },
          },
        },
        {
          type: 'user',
          id: '4',
          attributes: {
            name: 'Michael',
          },
          relationships: {
            friends: {
              links: { related: '/user/4/friends' },
              data: [{ type: 'user', id: '1' }],
            },
          },
        },
      ],
    });

    assert.equal(record.id, '1', 'id is accessible');
    assert.equal(record.name, 'Leo', 'name is accessible');
    assert.equal(record.friends?.length, 3, 'friends.length is accessible');
    assert.equal(record.friends?.[0]?.id, '2', 'friends[0].id is accessible');
    assert.equal(record.friends?.[0]?.name, 'Benedikt', 'friends[0].name is accessible');

    store.push<User>({
      data: {
        type: 'user',
        id: '1',
        attributes: {
          name: 'Leo',
        },
        relationships: {
          friends: {
            links: { related: '/user/1/friends' },
            data: [
              { type: 'user', id: '4' },
              { type: 'user', id: '3' },
              { type: 'user', id: '2' },
            ],
          },
        },
      },
      included: [
        {
          type: 'user',
          id: '4',
          attributes: {
            name: 'Michael',
          },
          relationships: {
            friends: {
              links: { related: '/user/4/friends' },
              data: [{ type: 'user', id: '1' }],
            },
          },
        },
        {
          type: 'user',
          id: '3',
          attributes: {
            name: 'Jane',
          },
          relationships: {
            friends: {
              links: { related: '/user/3/friends' },
              data: [{ type: 'user', id: '1' }],
            },
          },
        },
        {
          type: 'user',
          id: '2',
          attributes: {
            name: 'Benedikt',
          },
          relationships: {
            friends: {
              links: { related: '/user/2/friends' },
              data: [{ type: 'user', id: '1' }],
            },
          },
        },
      ],
    });

    assert.equal(record.id, '1', 'id is accessible');
    assert.equal(record.name, 'Leo', 'name is accessible');
    assert.equal(record.friends?.length, 3, 'friends.length is accessible');
    assert.equal(record.friends?.[0]?.id, '4', 'friends[0].id is accessible');
    assert.equal(record.friends?.[0]?.name, 'Michael', 'friends[0].name is accessible');
    assert.equal(record.friends?.[0]?.friends?.length, 1, 'friends[0].friends.length is accessible');
    assert.equal(record.friends?.[0]?.friends?.[0].id, '1', 'friends[0].friends[0].id is accessible');
    assert.equal(record.friends?.[0]?.friends?.[0].name, 'Leo', 'friends[0].friends[0].name is accessible');
    assert.equal(record.friends?.[1]?.id, '3', 'friends[0].id is accessible');
    assert.equal(record.friends?.[1]?.name, 'Jane', 'friends[0].name is accessible');
    assert.equal(record.friends?.[1]?.friends?.length, 1, 'friends[0].friends.length is accessible');
    assert.equal(record.friends?.[1]?.friends?.[0].id, '1', 'friends[0].friends[0].id is accessible');
    assert.equal(record.friends?.[1]?.friends?.[0].name, 'Leo', 'friends[0].friends[0].name is accessible');
  });

  test('we can reload a sync hasMany in linksMode, removing an item', async function (assert) {
    const handler = {
      request<T>(): Promise<T> {
        return Promise.resolve({
          data: [
            {
              type: 'user',
              id: '4',
              attributes: {
                name: 'Michael',
              },
              relationships: {
                friends: {
                  links: { related: '/user/4/friends' },
                  data: [{ type: 'user', id: '1' }],
                },
              },
            },
          ],
          links: { self: '/user/1/friends' },
        } as T);
      },
    };

    const TestStore = useRecommendedStore({
      cache: JSONAPICache,
      handlers: [handler],
      schemas: [
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
              kind: 'hasMany',
              options: { inverse: 'friends', async: false, linksMode: true },
            },
          ],
        }),
      ],
    });
    const store = new TestStore();

    const record = store.push<User>({
      data: {
        type: 'user',
        id: '1',
        attributes: {
          name: 'Leo',
        },
        relationships: {
          friends: {
            links: { related: '/user/1/friends' },
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
          attributes: {
            name: 'Benedikt',
          },
          relationships: {
            friends: {
              links: { related: '/user/2/friends' },
              data: [{ type: 'user', id: '1' }],
            },
          },
        },
        {
          type: 'user',
          id: '3',
          attributes: {
            name: 'Jane',
          },
          relationships: {
            friends: {
              links: { related: '/user/3/friends' },
              data: [{ type: 'user', id: '1' }],
            },
          },
        },
      ],
    });

    assert.equal(record.friends?.length, 2, 'the user has 2 friends');

    await (record.friends as RelatedCollection).reload();

    assert.equal(record.friends?.length, 1, 'the user has 1 friend after a reload');
    assert.equal(record.friends?.[0]?.id, '4', 'friends[0].id is accessible');
    assert.equal(record.friends?.[0]?.name, 'Michael', 'friends[0].name is accessible');
  });

  test('we can reload a sync hasMany in linksMode, adding an item', async function (assert) {
    const handler = {
      request<T>(): Promise<T> {
        return Promise.resolve({
          data: [
            {
              type: 'user',
              id: '2',
              attributes: {
                name: 'Benedikt',
              },
              relationships: {
                friends: {
                  links: { related: '/user/2/friends' },
                  data: [{ type: 'user', id: '1' }],
                },
              },
            },
            {
              type: 'user',
              id: '3',
              attributes: {
                name: 'Jane',
              },
              relationships: {
                friends: {
                  links: { related: '/user/3/friends' },
                  data: [{ type: 'user', id: '1' }],
                },
              },
            },
          ],
          links: { self: '/user/1/friends' },
        } as T);
      },
    };

    const TestStore = useRecommendedStore({
      cache: JSONAPICache,
      handlers: [handler],
      schemas: [
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
              kind: 'hasMany',
              options: { inverse: 'friends', async: false, linksMode: true },
            },
          ],
        }),
      ],
    });
    const store = new TestStore();

    const record = store.push<User>({
      data: {
        type: 'user',
        id: '1',
        attributes: {
          name: 'Leo',
        },
        relationships: {
          friends: {
            links: { related: '/user/1/friends' },
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
          attributes: {
            name: 'Benedikt',
          },
          relationships: {
            friends: {
              links: { related: '/user/2/friends' },
              data: [{ type: 'user', id: '1' }],
            },
          },
        },
      ],
    });

    assert.equal(record.friends?.length, 2, 'the user has 2 friends');

    await (record.friends as RelatedCollection).reload();

    assert.equal(record.friends?.length, 2, 'the user has 1 friend after a reload');
    assert.equal(record.friends?.[0]?.id, '2', 'friends[0].id is accessible');
    assert.equal(record.friends?.[0]?.name, 'Benedikt', 'friends[0].name is accessible');
    assert.equal(record.friends?.[1]?.id, '3', 'friends[1].id is accessible');
    assert.equal(record.friends?.[1]?.name, 'Jane', 'friends[1].name is accessible');
  });

  test('we can reload a sync hasMany in linksMode, for a new set of records', async function (assert) {
    const handler = {
      request<T>(): Promise<T> {
        return Promise.resolve({
          data: [
            {
              type: 'user',
              id: '4',
              attributes: {
                name: 'Michael',
              },
              relationships: {
                friends: {
                  links: { related: '/user/4/friends' },
                  data: [{ type: 'user', id: '1' }],
                },
              },
            },
          ],
          links: { self: '/user/1/friends' },
        } as T);
      },
    };

    const TestStore = useRecommendedStore({
      cache: JSONAPICache,
      handlers: [handler],
      schemas: [
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
              kind: 'hasMany',
              options: { inverse: 'friends', async: false, linksMode: true },
            },
          ],
        }),
      ],
    });
    const store = new TestStore();

    const record = store.push<User>({
      data: {
        type: 'user',
        id: '1',
        attributes: {
          name: 'Leo',
        },
        relationships: {
          friends: {
            links: { related: '/user/1/friends' },
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
          attributes: {
            name: 'Benedikt',
          },
          relationships: {
            friends: {
              links: { related: '/user/2/friends' },
              data: [{ type: 'user', id: '1' }],
            },
          },
        },
        {
          type: 'user',
          id: '3',
          attributes: {
            name: 'Jane',
          },
          relationships: {
            friends: {
              links: { related: '/user/3/friends' },
              data: [{ type: 'user', id: '1' }],
            },
          },
        },
      ],
    });

    assert.equal(record.friends?.length, 2, 'the user has 2 friends');

    await (record.friends as RelatedCollection).reload();

    assert.equal(record.friends?.length, 1, 'the user has 1 friend after a reload');
    assert.equal(record.friends?.[0]?.id, '4', 'friends[0].id is accessible');
    assert.equal(record.friends?.[0]?.name, 'Michael', 'friends[0].name is accessible');
  });

  test('we have refenrece stability on sync hasMany in linksMode', async function (assert) {
    const handler = {
      request<T>(context: Context): Promise<T> {
        return Promise.resolve({
          data: [
            {
              type: 'user',
              id: '2',
              attributes: {
                name: 'Benedikt',
              },
              relationships: {
                friends: {
                  links: { related: '/user/2/friends' },
                  data: [{ type: 'user', id: '1' }],
                },
              },
            },
            {
              type: 'user',
              id: '3',
              attributes: {
                name: 'Jane',
              },
              relationships: {
                friends: {
                  links: { related: '/user/3/friends' },
                  data: [{ type: 'user', id: '1' }],
                },
              },
            },
          ],
        } as T);
      },
    };

    const TestStore = useRecommendedStore({
      cache: JSONAPICache,
      handlers: [handler],
      schemas: [
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
              kind: 'hasMany',
              options: { inverse: 'friends', async: false, linksMode: true },
            },
          ],
        }),
      ],
    });
    const store = new TestStore();

    const record = store.push<User>({
      data: {
        type: 'user',
        id: '1',
        attributes: {
          name: 'Leo',
        },
        relationships: {
          friends: {
            links: { related: '/user/1/friends' },
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
          attributes: {
            name: 'Benedikt',
          },
          relationships: {
            friends: {
              links: { related: '/user/2/friends' },
              data: [{ type: 'user', id: '1' }],
            },
          },
        },
        {
          type: 'user',
          id: '3',
          attributes: {
            name: 'Jane',
          },
          relationships: {
            friends: {
              links: { related: '/user/3/friends' },
              data: [{ type: 'user', id: '1' }],
            },
          },
        },
      ],
    });

    const friends = record.friends;

    assert.equal(friends, record.friends, 'the friends relationship is stable');

    await (record.friends as RelatedCollection).reload();

    assert.equal(friends, record.friends, 'the friends relationship is stable after reload');
  });

  skip('we error for async hasMany access in linksMode because we are not implemented yet', function (assert) {
    const store = new Store();
    const { schema } = store;

    schema.registerResource(
      withDefaults({
        type: 'user',
        fields: [
          {
            name: 'name',
            kind: 'field',
          },
          // @ts-expect-error not implemented yet
          {
            name: 'friends',
            type: 'user',
            kind: 'hasMany',
            options: { inverse: 'friends', async: true, linksMode: true },
          },
        ],
      })
    );

    const record = store.push<User>({
      data: {
        type: 'user',
        id: '1',
        attributes: {
          name: 'Leo',
        },
        relationships: {
          friends: {
            links: { related: '/user/1/friends' },
            data: [
              { type: 'user', id: '2' },
              { type: 'user', id: '3' },
            ],
          },
        },
      },
      included: [
        // NOTE: If this is included, we can assume the link is pre-fetched
        {
          type: 'user',
          id: '2',
          attributes: {
            name: 'Benedikt',
          },
          relationships: {
            friends: {
              links: { related: '/user/2/friends' },
              data: [{ type: 'user', id: '1' }],
            },
          },
        },
        {
          type: 'user',
          id: '3',
          attributes: {
            name: 'Jane',
          },
          relationships: {
            friends: {
              data: [{ type: 'user', id: '1' }],
            },
          },
        },
      ],
    });

    assert.equal(record.id, '1', 'id is accessible');
    assert.equal(record.$type, 'user', '$type is accessible');
    assert.equal(record.name, 'Leo', 'name is accessible');

    // assert.expectAssertion(
    //   () => record.friends,
    //   'Cannot fetch user.friends because the field is in linksMode but async is not yet supported'
    // );
  });

  test('we can update sync hasMany in linksMode (with an inverse belongsTo)', function (assert) {
    type Pet = {
      id: string | null;
      $type: 'pet';
      name: string;
      owner: PetOwner;
      [Type]: 'pet';
    };

    type PetOwner = {
      id: string | null;
      $type: 'pet-owner';
      name: string;
      pets: Pet[] | null;
      [Type]: 'pet-owner';
    };

    const store = new Store();
    const { schema } = store;

    schema.registerResource(
      withDefaults({
        type: 'pet',
        fields: [
          {
            name: 'name',
            kind: 'field',
          },
          {
            name: 'owner',
            type: 'pet-owner',
            kind: 'belongsTo',
            options: { inverse: 'pets', async: false, linksMode: true },
          },
        ],
      })
    );
    schema.registerResource(
      withDefaults({
        type: 'pet-owner',
        fields: [
          {
            name: 'name',
            kind: 'field',
          },
          {
            name: 'pets',
            type: 'pet',
            kind: 'hasMany',
            options: { inverse: 'owner', async: false, linksMode: true },
          },
        ],
      })
    );

    const record = store.push<PetOwner>({
      data: {
        type: 'pet-owner',
        id: '1',
        attributes: {
          name: 'Karel',
        },
        relationships: {
          pets: {
            links: { related: '/pet-owner/1/pets' },
            data: [
              { type: 'pet', id: '2' },
              { type: 'pet', id: '3' },
            ],
          },
        },
      },
      included: [
        {
          type: 'pet',
          id: '2',
          attributes: {
            name: 'Jeanne',
          },
          relationships: {
            owner: {
              links: { related: '/pet/2/owner' },
              data: {
                id: '1',
                type: 'pet-owner',
              },
            },
          },
        },
        {
          type: 'pet',
          id: '3',
          attributes: {
            name: 'Billie',
          },
          relationships: {
            owner: {
              links: { related: '/pet/3/owner' },
              data: {
                id: '1',
                type: 'pet-owner',
              },
            },
          },
        },
      ],
    });

    assert.equal(record.id, '1', 'id is accessible');
    assert.equal(record.name, 'Karel', 'name is accessible');
    assert.equal(record.pets?.length, 2, 'pets.length is accessible');
    assert.equal(record.pets?.[0]?.id, '2', 'pets[0].id is accessible');
    assert.equal(record.pets?.[0]?.name, 'Jeanne', 'pets[0].name is accessible');
    assert.equal(record.pets?.[0]?.owner.id, '1', 'pets[0].owner.id is accessible');
    assert.equal(record.pets?.[0]?.owner.name, 'Karel', 'pets[0].owner.name is accessible');

    // ensure cache is still accurate
    const serialized = store.cache.peek(recordIdentifierFor(record));
    assert.satisfies(
      serialized,
      {
        type: 'pet-owner',
        id: '1',
        lid: '@lid:pet-owner-1',
        attributes: {
          name: 'Karel',
        },
        relationships: {
          pets: {
            links: { related: '/pet-owner/1/pets' },
            data: [
              { type: 'pet', id: '2', lid: '@lid:pet-2' },
              { type: 'pet', id: '3', lid: '@lid:pet-3' },
            ],
          },
        },
      },
      'cache is accurate'
    );

    // Sadly, one of the pets had to go :'(
    store.push<PetOwner>({
      data: {
        type: 'pet-owner',
        id: '1',
        attributes: {
          name: 'Karel',
        },
        relationships: {
          pets: {
            links: { related: '/pet-owner/1/pets' },
            data: [{ type: 'pet', id: '3' }],
          },
        },
      },
      included: [
        {
          type: 'pet',
          id: '3',
          attributes: {
            name: 'Billie',
          },
          relationships: {
            owner: {
              data: {
                id: '1',
                type: 'pet-owner',
              },
              links: { related: '/pet/3/owner' },
            },
          },
        },
      ],
    });

    assert.equal(record.id, '1', 'id is accessible');
    assert.equal(record.name, 'Karel', 'name is accessible');
    assert.equal(record.pets?.length, 1, 'pets.length is accessible');
    assert.equal(record.pets?.[0]?.id, '3', 'pets[0].id is accessible');
    assert.equal(record.pets?.[0]?.name, 'Billie', 'pets[0].name is accessible');

    // ensure cache is still accurate
    const serialized2 = store.cache.peek(recordIdentifierFor(record));
    assert.satisfies(
      serialized2,
      {
        type: 'pet-owner',
        id: '1',
        lid: '@lid:pet-owner-1',
        attributes: {
          name: 'Karel',
        },
        relationships: {
          pets: {
            links: { related: '/pet-owner/1/pets' },
            data: [{ type: 'pet', id: '3', lid: '@lid:pet-3' }],
          },
        },
      },
      'cache is accurate'
    );
  });

  test('we can update sync hasMany in linksMode (without an inverse)', function (assert) {
    type Pet = {
      id: string | null;
      $type: 'pet';
      name: string;
      [Type]: 'pet';
    };

    type PetOwner = {
      id: string | null;
      $type: 'pet-owner';
      name: string;
      pets: Pet[] | null;
      [Type]: 'pet-owner';
    };

    const store = new Store();
    const { schema } = store;

    schema.registerResource(
      withDefaults({
        type: 'pet',
        fields: [
          {
            name: 'name',
            kind: 'field',
          },
        ],
      })
    );
    schema.registerResource(
      withDefaults({
        type: 'pet-owner',
        fields: [
          {
            name: 'name',
            kind: 'field',
          },
          {
            name: 'pets',
            type: 'pet',
            kind: 'hasMany',
            options: { inverse: null, async: false, linksMode: true },
          },
        ],
      })
    );

    const record = store.push<PetOwner>({
      data: {
        type: 'pet-owner',
        id: '1',
        attributes: {
          name: 'Karel',
        },
        relationships: {
          pets: {
            links: { related: '/pet-owner/1/pets' },
            data: [
              { type: 'pet', id: '2' },
              { type: 'pet', id: '3' },
            ],
          },
        },
      },
      included: [
        {
          type: 'pet',
          id: '2',
          attributes: {
            name: 'Jeanne',
          },
        },
        {
          type: 'pet',
          id: '3',
          attributes: {
            name: 'Billie',
          },
        },
      ],
    });

    assert.equal(record.id, '1', 'id is accessible');
    assert.equal(record.name, 'Karel', 'name is accessible');
    assert.equal(record.pets?.length, 2, 'pets.length is accessible');
    assert.equal(record.pets?.[0]?.id, '2', 'pets[0].id is accessible');
    assert.equal(record.pets?.[0]?.name, 'Jeanne', 'pets[0].name is accessible');

    // ensure cache is still accurate
    const serialized = store.cache.peek(recordIdentifierFor(record));
    assert.satisfies(
      serialized,
      {
        type: 'pet-owner',
        id: '1',
        lid: '@lid:pet-owner-1',
        attributes: {
          name: 'Karel',
        },
        relationships: {
          pets: {
            links: { related: '/pet-owner/1/pets' },
            data: [
              { type: 'pet', id: '2', lid: '@lid:pet-2' },
              { type: 'pet', id: '3', lid: '@lid:pet-3' },
            ],
          },
        },
      },
      'cache is accurate'
    );

    // Sadly, one of the pets had to go :'(
    store.push<PetOwner>({
      data: {
        type: 'pet-owner',
        id: '1',
        attributes: {
          name: 'Karel',
        },
        relationships: {
          pets: {
            links: { related: '/pet-owner/1/pets' },
            data: [{ type: 'pet', id: '3' }],
          },
        },
      },
      included: [
        {
          type: 'pet',
          id: '3',
          attributes: {
            name: 'Billie',
          },
        },
      ],
    });

    assert.equal(record.id, '1', 'id is accessible');
    assert.equal(record.name, 'Karel', 'name is accessible');
    assert.equal(record.pets?.length, 1, 'pets.length is accessible');
    assert.equal(record.pets?.[0]?.id, '3', 'pets[0].id is accessible');
    assert.equal(record.pets?.[0]?.name, 'Billie', 'pets[0].name is accessible');

    // ensure cache is still accurate
    const serialized2 = store.cache.peek(recordIdentifierFor(record));
    assert.satisfies(
      serialized2,
      {
        type: 'pet-owner',
        id: '1',
        lid: '@lid:pet-owner-1',
        attributes: {
          name: 'Karel',
        },
        relationships: {
          pets: {
            links: { related: '/pet-owner/1/pets' },
            data: [{ type: 'pet', id: '3', lid: '@lid:pet-3' }],
          },
        },
      },
      'cache is accurate'
    );
  });
});
