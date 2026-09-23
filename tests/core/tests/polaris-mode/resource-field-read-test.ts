import { useRecommendedStore } from '@warp-drive/core';
import type { ReactiveRelationshipDocument } from '@warp-drive/core/reactive';
import { withDefaults } from '@warp-drive/core/reactive';
import type { RequestContext } from '@warp-drive/core/types/request';
import type { Type } from '@warp-drive/core/types/symbols';
import { module, setupTest, test } from '@warp-drive/diagnostic/ember';
import { JSONAPICache } from '@warp-drive/json-api';

const Store = useRecommendedStore({
  cache: JSONAPICache,
});

interface User {
  id: string | null;
  $type: 'user';
  name: string;
  bestFriend: ReactiveRelationshipDocument<User | null>;
  [Type]: 'user';
}

function registerUser(store: InstanceType<typeof Store>, async = false) {
  store.schema.registerResource(
    withDefaults({
      type: 'user',
      fields: [
        {
          name: 'name',
          kind: 'field',
        },
        {
          name: 'bestFriend',
          type: 'user',
          kind: 'resource',
          options: { inverse: 'bestFriend', async },
        },
      ],
    })
  );
}

module('Reads | resource', function (hooks) {
  setupTest(hooks);

  test('the value of a resource field is a document with data, links and meta', function (assert) {
    const store = new Store();
    registerUser(store);

    const record = store.push<User>({
      data: {
        type: 'user',
        id: '1',
        attributes: {
          name: 'Chris',
        },
        relationships: {
          bestFriend: {
            links: { related: '/user/1/bestFriend' },
            meta: { since: '2020' },
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
              data: { type: 'user', id: '1' },
            },
          },
        },
      ],
    });

    assert.equal(record.id, '1', 'id is accessible');
    assert.equal(record.$type, 'user', '$type is accessible');
    assert.equal(record.name, 'Chris', 'name is accessible');

    const doc = record.bestFriend;
    assert.equal(doc.identifier, null, 'a relationship document has no request identifier');
    assert.equal(doc.data?.id, '2', 'bestFriend.data.id is accessible');
    assert.equal(doc.data?.$type, 'user', 'bestFriend.data.$type is accessible');
    assert.equal(doc.data?.name, 'Rey', 'bestFriend.data.name is accessible');
    assert.deepEqual(doc.links, { related: '/user/1/bestFriend' }, 'bestFriend.links is accessible');
    assert.deepEqual(doc.meta, { since: '2020' }, 'bestFriend.meta is accessible');

    assert.equal(record.bestFriend, doc, 'the document instance is stable across reads');
    assert.equal(doc.data, store.peekRecord('user', '2'), 'data is the related record instance');
    assert.equal(doc.data?.bestFriend.data, record, 'the relationship is reciprocal');
    assert.equal(doc.data?.bestFriend.links, undefined, 'links is undefined when not present');
    assert.equal(doc.data?.bestFriend.meta, undefined, 'meta is undefined when not present');

    assert.deepEqual(
      doc.toJSON(),
      {
        identifier: null,
        data: store.peekRecord('user', '2'),
        links: { related: '/user/1/bestFriend' },
        meta: { since: '2020' },
      },
      'toJSON serializes the document shape'
    );
  });

  test('data is null when the relationship is known to be empty and undefined when unknown', function (assert) {
    const store = new Store();
    registerUser(store, true);

    const [empty, unknown] = store.push<User>({
      data: [
        {
          type: 'user',
          id: '1',
          attributes: { name: 'Chris' },
          relationships: {
            bestFriend: { links: { related: '/user/1/bestFriend' }, data: null },
          },
        },
        {
          type: 'user',
          id: '2',
          attributes: { name: 'Rey' },
          relationships: {
            bestFriend: { links: { related: '/user/2/bestFriend' } },
          },
        },
      ],
    });

    assert.equal(empty.bestFriend.data, null, 'data is null for an empty relationship');
    assert.equal(unknown.bestFriend.data, undefined, 'data is undefined for a links-only relationship');
    assert.deepEqual(unknown.bestFriend.links, { related: '/user/2/bestFriend' }, 'links are still available');
  });

  test('the field and the document are immutable on a PolarisMode record', async function (assert) {
    const store = new Store();
    registerUser(store);

    const [record, other] = store.push<User>({
      data: [
        {
          type: 'user',
          id: '1',
          attributes: { name: 'Chris' },
          relationships: { bestFriend: { data: null } },
        },
        {
          type: 'user',
          id: '2',
          attributes: { name: 'Rey' },
          relationships: { bestFriend: { data: null } },
        },
      ],
    });

    await assert.expectAssertion(() => {
      // @ts-expect-error we are testing the runtime guard
      record.bestFriend = other;
    }, /Cannot set bestFriend on user because the ReactiveResource is not editable/);

    await assert.expectAssertion(() => {
      record.bestFriend.data = other;
    }, /Cannot set data on the relationship document for user.bestFriend because the resource is not editable/);

    assert.equal(record.bestFriend.data, null, 'the relationship is unchanged');
  });

  test('we can fetch the related link', async function (assert) {
    const requests: string[] = [];
    const handler = {
      request<T>(context: RequestContext): Promise<T> {
        requests.push(context.request.url!);
        return Promise.resolve({
          data: {
            type: 'user',
            id: '2',
            attributes: { name: 'Rey' },
            relationships: {
              bestFriend: { links: { related: '/user/2/bestFriend' }, data: { type: 'user', id: '1' } },
            },
          },
        } as T);
      },
    };
    const TestStore = useRecommendedStore({
      cache: JSONAPICache,
      handlers: [handler],
    });
    const store = new TestStore();
    registerUser(store, true);

    const record = store.push<User>({
      data: {
        type: 'user',
        id: '1',
        attributes: { name: 'Chris' },
        relationships: {
          bestFriend: { links: { related: '/user/1/bestFriend' } },
        },
      },
    });

    assert.equal(record.bestFriend.data, undefined, 'data is undefined before fetching');

    const result = (await record.bestFriend.fetch()) as { data: User };

    assert.deepEqual(requests, ['/user/1/bestFriend'], 'the related link was requested');
    assert.equal(result.data.id, '2', 'the fetched document has the related resource');
    assert.equal(result.data.name, 'Rey', 'the related resource is in the cache');
  });

  test('materializing a related resource that was not included errors', async function (assert) {
    const store = new Store();
    registerUser(store);

    const record = store.push<User>({
      data: {
        type: 'user',
        id: '1',
        attributes: { name: 'Chris' },
        relationships: {
          bestFriend: { data: { type: 'user', id: '2' } },
        },
      },
    });

    assert.throws(
      () => record.bestFriend.data,
      /Cannot materialize the resource relationship user\.bestFriend on 'user:1': the related resource 'user:2' has no data in the cache/,
      'accessing data for a non-included related resource throws'
    );

    // once the related resource arrives the relationship materializes
    store.push<User>({
      data: {
        type: 'user',
        id: '2',
        attributes: { name: 'Rey' },
        relationships: { bestFriend: { data: { type: 'user', id: '1' } } },
      },
    });
    assert.equal(record.bestFriend.data?.name, 'Rey', 'data is available once the related resource is loaded');
  });

  test('an async resource relationship payload must carry a related link', async function (assert) {
    const store = new Store();
    registerUser(store, true);

    await assert.expectAssertion(
      () =>
        store.push<User>({
          data: {
            type: 'user',
            id: '1',
            attributes: { name: 'Chris' },
            relationships: {
              bestFriend: { data: null },
            },
          },
        }),
      /The resource relationship 'user\.bestFriend' is async \(async: true\) and must have a 'links\.related' link/
    );
  });
});
