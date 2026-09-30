/* eslint-disable warp-drive/no-legacy-request-patterns -- these tests cover the legacy reload API */
import type { Handler } from '@warp-drive/core/request';
import { CacheHandler, RequestManager } from '@warp-drive/core';
import type { Type } from '@warp-drive/core/types/symbols';
import { module, setupTest, test } from '@warp-drive/diagnostic/ember';
import { JSONAPIAdapter } from '@warp-drive/legacy/adapter/json-api';
import { LegacyNetworkHandler } from '@warp-drive/legacy/compat';
import Model, { attr, hasMany } from '@warp-drive/legacy/model';

import Store from '../serializer/store';

class User extends Model {
  @attr
  declare name: string;

  @hasMany('user', { async: false, inverse: null, linksMode: true })
  declare friends: User[] & { reload(): Promise<unknown> };

  declare [Type]: 'user';
}

function setupStore(owner: { register(name: string, value: unknown): void; lookup(name: string): unknown }) {
  owner.register('service:store', Store);
  owner.register('model:user', User);
  return owner.lookup('service:store') as Store;
}

function useHandler(store: Store, assert: { step(value: string): void }, response: unknown) {
  const handler: Handler = {
    request<T>(context): Promise<T> {
      assert.step(`op=${context.request.op ?? 'UNKNOWN OP CODE'}, url=${context.request.url ?? 'UNKNOWN URL'}`);
      return Promise.resolve(response as T);
    },
  };
  const manager = new RequestManager();
  manager.use([LegacyNetworkHandler, handler]);
  manager.useCache(CacheHandler);
  store.requestManager = manager;
}

module('Unit | Model | hasMany in linksMode', function (hooks) {
  setupTest(hooks);

  test('reloading a sync linksMode hasMany with data fetches its related link and updates membership', async function (assert) {
    // an app still using adapters for other relationships
    this.owner.register('adapter:application', JSONAPIAdapter);
    const store = setupStore(this.owner);
    useHandler(store, assert, {
      data: [{ type: 'user', id: '3', attributes: { name: 'Ray' } }],
    });

    const chris = store.push<User>({
      data: {
        type: 'user',
        id: '1',
        attributes: { name: 'Chris' },
        relationships: {
          friends: {
            links: { related: '/user/1/friends' },
            data: [{ type: 'user', id: '2' }],
          },
        },
      },
      included: [{ type: 'user', id: '2', attributes: { name: 'Rey' } }],
    });

    assert.deepEqual(
      chris.friends.map((f) => f.id),
      ['2'],
      'friends are accessible'
    );

    await chris.friends.reload();

    assert.verifySteps(['op=findHasMany, url=/user/1/friends'], 'the related link was requested');
    assert.deepEqual(
      chris.friends.map((f) => f.id),
      ['3'],
      'friends are updated from the response'
    );
  });

  test('reloading a sync linksMode hasMany with only a link fetches its related link and updates membership', async function (assert) {
    const store = setupStore(this.owner);
    useHandler(store, assert, {
      data: [{ type: 'user', id: '3', attributes: { name: 'Ray' } }],
    });

    const chris = store.push<User>({
      data: {
        type: 'user',
        id: '1',
        attributes: { name: 'Chris' },
        relationships: {
          friends: {
            links: { related: '/user/1/friends' },
          },
        },
      },
    });

    await chris.friends.reload();

    assert.verifySteps(['op=findHasMany, url=/user/1/friends'], 'the related link was requested');
    assert.deepEqual(
      chris.friends.map((f) => f.id),
      ['3'],
      'friends are updated from the response'
    );
  });
});
