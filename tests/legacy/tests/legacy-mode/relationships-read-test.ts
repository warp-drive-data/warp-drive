import { setOwner } from '@ember/owner';
import type { TestContext } from '@ember/test-helpers';

import { DEBUG } from '@warp-drive/core/build-config/env';
import type { NextFn } from '@warp-drive/core/request';
import type { RequestContext } from '@warp-drive/core/types/request';
import type { Type } from '@warp-drive/core/types/symbols';
import { module, setupTest, test } from '@warp-drive/diagnostic/ember';
import { JSONAPICache } from '@warp-drive/json-api';
import { useLegacyStore } from '@warp-drive/legacy';
import { JSONAPIAdapter } from '@warp-drive/legacy/adapter/json-api';
import { PromiseBelongsTo, PromiseManyArray } from '@warp-drive/legacy/model/-private';
import {
  type WithLegacyDerivations,
  withRestoredDeprecatedModelRequestBehaviors as withLegacy,
} from '@warp-drive/legacy/model/migration-support';

const Store = useLegacyStore({
  linksMode: false,
  cache: JSONAPICache,
});

module('Legacy | Reads | relationships', function (hooks) {
  setupTest(hooks);

  hooks.beforeEach(function () {
    this.owner.register('adapter:application', JSONAPIAdapter);
  });

  test('we can use sync belongsTo', function (assert) {
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
      ],
    });
    const Matt = store.peekRecord<User>('user', '2')!;

    assert.equal(Rey.id, '1', 'id is accessible');
    assert.equal(Rey.name, 'Rey Skybarker', 'name is accessible');
    assert.equal(Rey.bestFriend, Matt, 'Rey has Matt as bestFriend');
    assert.equal(Matt.bestFriend, Rey, 'Matt has Rey as bestFriend');
  });

  test('we can use sync hasMany', function (assert) {
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

  test('we can use async belongsTo', async function (assert) {
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
      ],
    });
    const Matt = store.peekRecord<User>('user', '2')!;

    const ReyBestFriend = await Rey.bestFriend;
    const MattBestFriend = await Matt.bestFriend;

    assert.equal(Rey.id, '1', 'id is accessible');
    assert.equal(Rey.name, 'Rey Skybarker', 'name is accessible');
    assert.true(Rey.bestFriend instanceof PromiseBelongsTo, 'Rey has an async bestFriend');
    assert.true(Matt.bestFriend instanceof PromiseBelongsTo, 'Matt has an async bestFriend');

    assert.equal(ReyBestFriend, Matt, 'Rey has Matt as bestFriend');
    assert.equal(MattBestFriend, Rey, 'Matt has Rey as bestFriend');
  });

  test('we can use async hasMany', async function (assert) {
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
      ],
    });
    const Matt = store.peekRecord<User>('user', '2')!;

    const ReyFriends = await Rey.friends;
    const MattFriends = await Matt.friends;

    assert.equal(Rey.id, '1', 'id is accessible');
    assert.equal(Rey.name, 'Rey Skybarker', 'name is accessible');

    assert.equal(Rey.friends.length, 1, 'Rey has only one friend :(');
    assert.equal(Matt.friends.length, 1, 'Matt has only one friend :(');
    assert.true(Rey.friends instanceof PromiseManyArray, 'Rey has an async bestFriend');
    assert.true(Matt.friends instanceof PromiseManyArray, 'Matt has an async bestFriend');

    assert.equal(ReyFriends.length, 1, 'Rey has only one friend :(');
    assert.equal(MattFriends.length, 1, 'Matt has only one friend :(');
    assert.equal(ReyFriends[0], Matt, 'Rey has Matt as bestFriend');
    assert.equal(MattFriends[0], Rey, 'Matt has Rey as bestFriend');
  });

  test('we can reload sync belongsTo in linksMode', async function (this: TestContext, assert) {
    const TestStore = useLegacyStore({
      linksMode: false,
      handlers: [
        {
          request<T>(context: RequestContext, next: NextFn<T>): Promise<T> {
            assert.step(`op=${context.request.op ?? 'UNKNOWN OP CODE'}, url=${context.request.url ?? 'UNKNOWN URL'}`);
            return Promise.resolve({
              data: {
                type: 'user',
                id: '3',
                attributes: {
                  name: 'Ray',
                },
                relationships: {
                  bestFriend: {
                    links: { related: '/user/3/bestFriend' },
                    data: { type: 'user', id: '1' },
                  },
                },
              },
              included: [
                {
                  type: 'user',
                  id: '1',
                  attributes: {
                    name: 'Chris',
                  },
                  relationships: {
                    bestFriend: {
                      links: { related: '/user/1/bestFriend' },
                      data: { type: 'user', id: '3' },
                    },
                  },
                },
              ],
            } as T);
          },
        },
      ],
      cache: JSONAPICache,
    });
    const store = new TestStore();
    const { schema } = store;

    type LegacyUser = WithLegacyDerivations<{
      [Type]: 'user';
      id: string;
      name: string;
      bestFriend: LegacyUser | null;
    }>;

    schema.registerResource(
      withLegacy({
        type: 'user',
        fields: [
          {
            name: 'name',
            kind: 'attribute',
          },
          {
            name: 'bestFriend',
            type: 'user',
            kind: 'belongsTo',
            options: { inverse: 'bestFriend', async: false, linksMode: true },
          },
        ],
      })
    );

    const record = store.push<LegacyUser>({
      data: {
        type: 'user',
        id: '1',
        attributes: {
          name: 'Chris',
        },
        relationships: {
          bestFriend: {
            links: { related: '/user/1/bestFriend' },
            data: { type: 'user', id: '2' },
          },
        },
      },
      included: [
        {
          type: 'user',
          id: '2',
          attributes: {
            name: 'Rey',
          },
          relationships: {
            bestFriend: {
              links: { related: '/user/2/bestFriend' },
              data: { type: 'user', id: '1' },
            },
          },
        },
      ],
    });

    assert.equal(record.id, '1', 'id is correct');
    assert.equal(record.name, 'Chris', 'name is correct');
    assert.equal(record.bestFriend?.id, '2', 'bestFriend.id is correct');
    assert.equal(record.bestFriend?.name, 'Rey', 'bestFriend.name is correct');

    await record.belongsTo('bestFriend').reload();

    assert.verifySteps(['op=findBelongsTo, url=/user/1/bestFriend'], 'op and url are correct');

    assert.equal(record.id, '1', 'id is correct');
    assert.equal(record.name, 'Chris', 'name is correct');
    assert.equal(record.bestFriend?.id, '3', 'bestFriend.id is correct');
    assert.equal(record.bestFriend?.name, 'Ray', 'bestFriend.name is correct');
  });

  if (DEBUG) {
    test('sync belongsTo reload will error if no links in response in linksMode', async function (this: TestContext, assert) {
      const TestStore = useLegacyStore({
        linksMode: false,
        handlers: [
          {
            request<T>(context: RequestContext, next: NextFn<T>): Promise<T> {
              assert.step(`op=${context.request.op ?? 'UNKNOWN OP CODE'}, url=${context.request.url ?? 'UNKNOWN URL'}`);
              return Promise.resolve({
                data: {
                  type: 'user',
                  id: '3',
                  attributes: {
                    name: 'Ray',
                  },
                  relationships: {
                    bestFriend: {
                      data: { type: 'user', id: '1' },
                    },
                  },
                },
              } as T);
            },
          },
        ],
        cache: JSONAPICache,
        schemas: [
          withLegacy({
            type: 'user',
            fields: [
              {
                name: 'name',
                kind: 'attribute',
              },
              {
                name: 'bestFriend',
                type: 'user',
                kind: 'belongsTo',
                options: { inverse: 'bestFriend', async: false, linksMode: true },
              },
            ],
          }),
        ],
      });
      const store = new TestStore();

      type LegacyUser = WithLegacyDerivations<{
        [Type]: 'user';
        id: string;
        name: string;
        bestFriend: LegacyUser | null;
      }>;

      const record = store.push<LegacyUser>({
        data: {
          type: 'user',
          id: '1',
          attributes: {
            name: 'Chris',
          },
          relationships: {
            bestFriend: {
              links: { related: '/user/1/bestFriend' },
              data: { type: 'user', id: '2' },
            },
          },
        },
        included: [
          {
            type: 'user',
            id: '2',
            attributes: {
              name: 'Rey',
            },
            relationships: {
              bestFriend: {
                links: { related: '/user/2/bestFriend' },
                data: { type: 'user', id: '1' },
              },
            },
          },
        ],
      });

      assert.equal(record.id, '1', 'id is correct');
      assert.equal(record.name, 'Chris', 'name is correct');
      assert.equal(record.bestFriend?.id, '2', 'bestFriend.id is correct');
      assert.equal(record.bestFriend?.name, 'Rey', 'bestFriend.name is correct');

      await assert.throws(
        () => record.belongsTo('bestFriend').reload(),
        'Cannot fetch user.bestFriend because the field is in linksMode but the related link is missing'
      );

      assert.verifySteps(['op=findBelongsTo, url=/user/1/bestFriend'], 'op and url are correct');
    });
  }
});
