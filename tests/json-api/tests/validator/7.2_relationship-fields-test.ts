import { useRecommendedStore } from '@warp-drive/core';
import { PRODUCTION } from '@warp-drive/core/build-config/env';
import { withDefaults } from '@warp-drive/core/reactive';
import { module, skip, test as runTest } from '@warp-drive/diagnostic';
import { JSONAPICache } from '@warp-drive/json-api';

import { captureLoggedReport } from './utils';

const test = PRODUCTION ? skip : runTest;

function storeFor(payload: object, async: boolean) {
  const Store = useRecommendedStore({
    cache: JSONAPICache,
    handlers: [
      {
        request<T>() {
          return Promise.resolve(payload) as Promise<T>;
        },
      },
    ],
    schemas: [
      withDefaults({
        type: 'user',
        fields: [
          { kind: 'field', name: 'name' },
          {
            kind: 'resource',
            name: 'bestFriend',
            type: 'user',
            options: { inverse: null, async },
          },
          {
            kind: 'collection',
            name: 'friends',
            type: 'user',
            options: { inverse: null, async },
          },
        ],
      }),
    ],
  });
  return new Store();
}

function reportHeader(seen: unknown[][]): string | null {
  for (const args of seen) {
    if (typeof args[0] === 'string' && / errors and \d+ warnings found in the \{json:api\} document/.test(args[0])) {
      return args[0];
    }
  }
  return null;
}

function reportedMessages(seen: unknown[][]): string {
  return seen.map((args) => args.map((v) => (typeof v === 'string' ? v : '')).join(' ')).join('\n');
}

module('Validator | 7.2 resource and collection relationship fields', function () {
  test('a sync relationship with data and included resources is valid', async function (assert) {
    const capture = captureLoggedReport();
    const store = storeFor(
      {
        data: {
          type: 'user',
          id: '1',
          attributes: { name: 'Alice' },
          relationships: {
            bestFriend: { data: { type: 'user', id: '2' } },
            friends: { data: [{ type: 'user', id: '2' }] },
          },
        },
        included: [{ type: 'user', id: '2', attributes: { name: 'Bob' } }],
      },
      false
    );

    await store.request({ url: '/users/1' });
    capture.restore();
    assert.equal(reportHeader(capture.seen), null, 'nothing was reported');
  });

  test('a sync relationship errors when a referenced resource is not included', async function (assert) {
    const capture = captureLoggedReport();
    const store = storeFor(
      {
        data: {
          type: 'user',
          id: '1',
          attributes: { name: 'Alice' },
          relationships: {
            friends: {
              data: [
                { type: 'user', id: '2' },
                { type: 'user', id: '3' },
              ],
            },
          },
        },
        included: [{ type: 'user', id: '2', attributes: { name: 'Bob' } }],
      },
      false
    );

    await store.request({ url: '/users/1' });
    capture.restore();
    const header = reportHeader(capture.seen);
    assert.true(
      header?.startsWith('1 errors and 0 warnings found') === true,
      `exactly one error was reported (${header ?? 'nothing reported'})`
    );
    assert.true(
      reportedMessages(capture.seen).includes(
        'The related resource \'user:3\' referenced by the collection relationship "friends" on "user" is not present in this payload'
      ),
      'the error explains the missing inclusion'
    );
  });

  test('a sync relationship warns when links are present', async function (assert) {
    const capture = captureLoggedReport();
    const store = storeFor(
      {
        data: {
          type: 'user',
          id: '1',
          attributes: { name: 'Alice' },
          relationships: {
            friends: { links: { related: '/users/1/friends' }, data: [{ type: 'user', id: '2' }] },
          },
        },
        included: [{ type: 'user', id: '2', attributes: { name: 'Bob' } }],
      },
      false
    );

    await store.request({ url: '/users/1' });
    capture.restore();
    const header = reportHeader(capture.seen);
    assert.true(
      header?.startsWith('0 errors and 1 warnings found') === true,
      `exactly one warning was reported (${header ?? 'nothing reported'})`
    );
    assert.true(
      reportedMessages(capture.seen).includes('is sync (async: false) and SHOULD NOT provide "links"'),
      'the warning explains that sync relationships should not have links'
    );
  });

  test('a sync relationship errors when present without data', async function (assert) {
    const capture = captureLoggedReport();
    const store = storeFor(
      {
        data: {
          type: 'user',
          id: '1',
          attributes: { name: 'Alice' },
          relationships: {
            bestFriend: { meta: { count: 1 } },
          },
        },
      },
      false
    );

    await store.request({ url: '/users/1' });
    capture.restore();
    const header = reportHeader(capture.seen);
    assert.true(
      header?.startsWith('1 errors and 0 warnings found') === true,
      `exactly one error was reported (${header ?? 'nothing reported'})`
    );
    assert.true(
      reportedMessages(capture.seen).includes('is sync (async: false) and MUST provide its "data" member'),
      'the error explains that data is required'
    );
  });

  test('an async relationship errors when it has no related link', async function (assert) {
    const capture = captureLoggedReport();
    const store = storeFor(
      {
        data: {
          type: 'user',
          id: '1',
          attributes: { name: 'Alice' },
          relationships: {
            // a self link alone is not enough
            friends: { links: { self: '/users/1/relationships/friends' } },
          },
        },
      },
      true
    );

    // the validator reports the problem, then the graph refuses the payload
    await assert.throws(
      () => store.request({ url: '/users/1' }),
      /The collection relationship 'user\.friends' is async \(async: true\) and must have a 'links\.related' link/,
      'the graph refuses the payload'
    );
    capture.restore();
    const header = reportHeader(capture.seen);
    assert.true(
      header?.startsWith('1 errors and 0 warnings found') === true,
      `exactly one error was reported (${header ?? 'nothing reported'})`
    );
    assert.true(
      reportedMessages(capture.seen).includes(
        'is async (async: true) and MUST provide a "links" object with a "related" link'
      ),
      'the error explains that a related link is required'
    );
  });

  test('an async relationship with a related link is valid, with or without data', async function (assert) {
    const capture = captureLoggedReport();
    const store = storeFor(
      {
        data: {
          type: 'user',
          id: '1',
          attributes: { name: 'Alice' },
          relationships: {
            bestFriend: { links: { related: '/users/1/best-friend' } },
            friends: { links: { related: '/users/1/friends' }, data: [{ type: 'user', id: '2' }] },
          },
        },
        included: [{ type: 'user', id: '2', attributes: { name: 'Bob' } }],
      },
      true
    );

    await store.request({ url: '/users/1' });
    capture.restore();
    assert.equal(reportHeader(capture.seen), null, 'nothing was reported');
  });

  test('an async relationship with data still requires the referenced resources to be included', async function (assert) {
    const capture = captureLoggedReport();
    const store = storeFor(
      {
        data: {
          type: 'user',
          id: '1',
          attributes: { name: 'Alice' },
          relationships: {
            bestFriend: { links: { related: '/users/1/best-friend' }, data: { type: 'user', id: '2' } },
          },
        },
      },
      true
    );

    await store.request({ url: '/users/1' });
    capture.restore();
    const header = reportHeader(capture.seen);
    assert.true(
      header?.startsWith('1 errors and 0 warnings found') === true,
      `exactly one error was reported (${header ?? 'nothing reported'})`
    );
    assert.true(
      reportedMessages(capture.seen).includes(
        'The related resource \'user:2\' referenced by the resource relationship "bestFriend" on "user" is not present in this payload'
      ),
      'the error explains the missing inclusion'
    );
  });
});
