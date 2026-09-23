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
  friends: ReactiveRelationshipDocument<User[]>;
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
          name: 'friends',
          type: 'user',
          kind: 'collection',
          options: { inverse: 'friends', async },
        },
      ],
    })
  );
}

function pushUsers(store: InstanceType<typeof Store>) {
  return store.push<User>({
    data: {
      type: 'user',
      id: '1',
      attributes: { name: 'Leo' },
      relationships: {
        friends: {
          links: { related: '/user/1/friends' },
          meta: { count: 2 },
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
        attributes: { name: 'Benedikt' },
        relationships: { friends: { data: [{ type: 'user', id: '1' }] } },
      },
      {
        type: 'user',
        id: '3',
        attributes: { name: 'Jane' },
        relationships: { friends: { data: [{ type: 'user', id: '1' }] } },
      },
    ],
  });
}

module('Reads | collection', function (hooks) {
  setupTest(hooks);

  test('the value of a collection field is a document whose data is an array of the related records', function (assert) {
    const store = new Store();
    registerUser(store);
    const record = pushUsers(store);

    const doc = record.friends;
    assert.equal(doc.identifier, null, 'a relationship document has no request identifier');
    assert.deepEqual(doc.links, { related: '/user/1/friends' }, 'friends.links is accessible');
    assert.deepEqual(doc.meta, { count: 2 }, 'friends.meta is accessible');

    const friends = doc.data!;
    assert.true(Array.isArray(friends), 'data is an array');
    assert.equal(friends.length, 2, 'friends has 2 items');
    assert.arrayEquals(
      friends.map((friend) => friend.id),
      ['2', '3'],
      'friends are correct'
    );
    assert.equal(friends[0], store.peekRecord('user', '2'), 'members are record instances');
    assert.equal(friends[0].friends.data?.[0], record, 'the relationship is reciprocal');

    assert.equal(record.friends, doc, 'the document instance is stable across reads');
    assert.equal(record.friends.data, friends, 'the data array is stable across reads');
  });

  test('data is an empty array when the relationship is known to be empty and undefined when unknown', function (assert) {
    const store = new Store();
    registerUser(store, true);

    const [empty, unknown] = store.push<User>({
      data: [
        {
          type: 'user',
          id: '1',
          attributes: { name: 'Leo' },
          relationships: { friends: { links: { related: '/user/1/friends' }, data: [] } },
        },
        {
          type: 'user',
          id: '2',
          attributes: { name: 'Rey' },
          relationships: { friends: { links: { related: '/user/2/friends' } } },
        },
      ],
    });

    assert.deepEqual(empty.friends.data?.slice(), [], 'data is an empty array for an empty relationship');
    assert.equal(unknown.friends.data, undefined, 'data is undefined for a links-only relationship');
    assert.deepEqual(unknown.friends.links, { related: '/user/2/friends' }, 'links are still available');
  });

  test('the field, the document and the array are immutable on a PolarisMode record', async function (assert) {
    const store = new Store();
    registerUser(store);
    const record = pushUsers(store);
    const other = store.push<User>({
      data: { type: 'user', id: '4', attributes: { name: 'William' }, relationships: { friends: { data: [] } } },
    });

    await assert.expectAssertion(() => {
      // @ts-expect-error we are testing the runtime guard
      record.friends = [other];
    }, /Cannot set friends on user because the ReactiveResource is not editable/);

    await assert.expectAssertion(() => {
      record.friends.data = [other];
    }, /Cannot set data on the relationship document for user.friends because the resource is not editable/);

    await assert.expectAssertion(() => {
      record.friends.data!.push(other);
    }, /Mutating this array of records via push is not allowed/);

    await assert.expectAssertion(() => {
      record.friends.data![0] = other;
    }, /Mutating 0 on this Array is not allowed/);

    assert.arrayEquals(
      record.friends.data!.map((friend) => friend.id),
      ['2', '3'],
      'friends are unchanged'
    );
  });

  test('a remote update replaces the membership', function (assert) {
    const store = new Store();
    registerUser(store);
    const record = pushUsers(store);
    const friends = record.friends.data!;

    store.push<User>({
      data: {
        type: 'user',
        id: '1',
        attributes: { name: 'Leo' },
        relationships: {
          friends: {
            links: { related: '/user/1/friends?page=2' },
            meta: { count: 2 },
            data: [
              { type: 'user', id: '3' },
              { type: 'user', id: '4' },
            ],
          },
        },
      },
      included: [
        {
          type: 'user',
          id: '4',
          attributes: { name: 'William' },
          relationships: { friends: { data: [{ type: 'user', id: '1' }] } },
        },
      ],
    });

    assert.equal(record.friends.data, friends, 'the data array is stable');
    assert.arrayEquals(
      friends.map((friend) => friend.id),
      ['3', '4'],
      'friends are updated'
    );
    assert.deepEqual(record.friends.links, { related: '/user/1/friends?page=2' }, 'links are updated');
    assert.deepEqual(
      store.peekRecord<User>('user', '2')!.friends.data!.slice(),
      [],
      'the removed member no longer points back'
    );
  });

  test('we can fetch the related link', async function (assert) {
    const requests: string[] = [];
    const handler = {
      request<T>(context: RequestContext): Promise<T> {
        requests.push(context.request.url!);
        return Promise.resolve({
          data: [
            {
              type: 'user',
              id: '2',
              attributes: { name: 'Benedikt' },
              relationships: {
                friends: { links: { related: '/user/2/friends' }, data: [{ type: 'user', id: '1' }] },
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
    });
    const store = new TestStore();
    registerUser(store, true);

    const record = store.push<User>({
      data: {
        type: 'user',
        id: '1',
        attributes: { name: 'Leo' },
        relationships: {
          friends: { links: { related: '/user/1/friends' } },
        },
      },
    });

    assert.equal(record.friends.data, undefined, 'data is undefined before fetching');

    const result = (await record.friends.fetch()) as { data: User[] };

    assert.deepEqual(requests, ['/user/1/friends'], 'the related link was requested');
    assert.equal(result.data.length, 1, 'the fetched document has the related resources');
    assert.equal(result.data[0].name, 'Benedikt', 'the related resource is in the cache');
  });

  test('materializing a related resource that was not included errors', async function (assert) {
    const store = new Store();
    registerUser(store);

    const record = store.push<User>({
      data: {
        type: 'user',
        id: '1',
        attributes: { name: 'Leo' },
        relationships: {
          friends: {
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
          attributes: { name: 'Benedikt' },
          relationships: { friends: { data: [{ type: 'user', id: '1' }] } },
        },
      ],
    });

    assert.throws(
      () => record.friends.data,
      /Cannot materialize the collection relationship user\.friends on 'user:1': the related resource 'user:3' has no data in the cache/,
      'accessing data for a non-included related resource throws'
    );

    store.push<User>({
      data: {
        type: 'user',
        id: '3',
        attributes: { name: 'Jane' },
        relationships: { friends: { data: [{ type: 'user', id: '1' }] } },
      },
    });
    assert.arrayEquals(
      record.friends.data!.map((f) => f.id),
      ['2', '3'],
      'data is available once every related resource is loaded'
    );
  });

  test('an async collection relationship payload must carry a related link', async function (assert) {
    const store = new Store();
    registerUser(store, true);

    await assert.expectAssertion(
      () =>
        store.push<User>({
          data: {
            type: 'user',
            id: '1',
            attributes: { name: 'Leo' },
            relationships: {
              friends: { data: [] },
            },
          },
        }),
      /The collection relationship 'user\.friends' is async \(async: true\) and must have a 'links\.related' link/
    );
  });
});
