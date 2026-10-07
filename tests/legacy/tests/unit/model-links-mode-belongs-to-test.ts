import { CacheHandler, RequestManager } from '@warp-drive/core';
import type { Handler } from '@warp-drive/core/request';
import type { Type } from '@warp-drive/core/types/symbols';
import { module, setupTest, test } from '@warp-drive/diagnostic/ember';
import { JSONAPIAdapter } from '@warp-drive/legacy/adapter/json-api';
import { LegacyNetworkHandler } from '@warp-drive/legacy/compat';
import Model, { attr, belongsTo } from '@warp-drive/legacy/model';

import Store from '../serializer/store';

class User extends Model {
  @attr
  declare name: string;

  // inverse: null so an inverse update in the response can't stand in
  // for the relationship itself being updated
  @belongsTo('user', { async: false, inverse: null, linksMode: true })
  declare bestFriend: User | null;

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

const RAY = { data: { type: 'user', id: '3', attributes: { name: 'Ray' } } };

module('Unit | Model | belongsTo in linksMode', function (hooks) {
  setupTest(hooks);

  test('reloading a sync linksMode belongsTo with data fetches its related link and updates the relationship', async function (assert) {
    // an app still using adapters for other relationships
    this.owner.register('adapter:application', JSONAPIAdapter);
    const store = setupStore(this.owner);
    useHandler(store, assert, RAY);

    const chris = store.push<User>({
      data: {
        type: 'user',
        id: '1',
        attributes: { name: 'Chris' },
        relationships: {
          bestFriend: {
            links: { related: '/user/1/bestFriend' },
            data: { type: 'user', id: '2' },
          },
        },
      },
      included: [{ type: 'user', id: '2', attributes: { name: 'Rey' } }],
    });

    assert.equal(chris.bestFriend?.id, '2', 'bestFriend is accessible');

    const result = await chris.belongsTo('bestFriend').reload();

    assert.verifySteps(['op=findBelongsTo, url=/user/1/bestFriend'], 'the related link was requested');
    assert.equal(result?.id, '3', 'reload resolves with the fetched record');
    assert.equal(chris.bestFriend?.id, '3', 'bestFriend is updated from the response');
  });

  test('reloading a sync linksMode belongsTo with only a link fetches its related link and updates the relationship', async function (assert) {
    const store = setupStore(this.owner);
    useHandler(store, assert, RAY);

    const chris = store.push<User>({
      data: {
        type: 'user',
        id: '1',
        attributes: { name: 'Chris' },
        relationships: {
          bestFriend: {
            links: { related: '/user/1/bestFriend' },
          },
        },
      },
    });

    const result = await chris.belongsTo('bestFriend').reload();

    assert.verifySteps(['op=findBelongsTo, url=/user/1/bestFriend'], 'the related link was requested');
    assert.equal(result?.id, '3', 'reload resolves with the fetched record');
    assert.equal(chris.bestFriend?.id, '3', 'bestFriend is updated from the response');
  });

  test('loading a sync linksMode belongsTo whose record is not loaded fetches its related link and updates the relationship', async function (assert) {
    const store = setupStore(this.owner);
    useHandler(store, assert, RAY);

    const chris = store.push<User>({
      data: {
        type: 'user',
        id: '1',
        attributes: { name: 'Chris' },
        relationships: {
          bestFriend: {
            links: { related: '/user/1/bestFriend' },
            // user:2 is never loaded
            data: { type: 'user', id: '2' },
          },
        },
      },
    });

    const result = await chris.belongsTo('bestFriend').load();

    assert.verifySteps(['op=findBelongsTo, url=/user/1/bestFriend'], 'the related link was requested');
    assert.equal(result?.id, '3', 'load resolves with the fetched record');
    assert.equal(chris.bestFriend?.id, '3', 'bestFriend is updated from the response');
  });
});
