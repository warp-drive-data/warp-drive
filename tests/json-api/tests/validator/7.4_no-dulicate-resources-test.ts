import { useRecommendedStore } from '@warp-drive/core';
import { PRODUCTION } from '@warp-drive/core/build-config/env';
import { withDefaults } from '@warp-drive/core/reactive';
import { module, skip, test as runTest } from '@warp-drive/diagnostic';
import { JSONAPICache } from '@warp-drive/json-api';

import { captureLoggedReport } from './utils';

const test = PRODUCTION ? skip : runTest;

module('Validator | 7.4 No Duplicate Resources', function () {
  test('It errors on duplicate resources when the duplicate is the primary record', async function (assert) {
    const capture = captureLoggedReport();
    const Store = useRecommendedStore({
      cache: JSONAPICache,
      schemas: [
        withDefaults({
          type: 'user',
          fields: [
            { kind: 'field', name: 'name' },
            {
              kind: 'hasMany',
              name: 'friends',
              type: 'user',
              options: { inverse: null, async: false, linksMode: true },
            },
          ],
        }),
      ],
      handlers: [
        {
          request<T>() {
            return Promise.resolve({
              data: {
                type: 'user',
                id: '1',
                attributes: {
                  name: 'Alice',
                },
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
                  attributes: {
                    name: 'A related record',
                  },
                },
                {
                  type: 'user',
                  id: '1',
                  attributes: {
                    name: 'Alice Duplicate',
                  },
                },
                {
                  type: 'user',
                  id: '3',
                  attributes: {
                    name: 'A related record',
                  },
                },
              ],
            }) as Promise<T>;
          },
        },
      ],
    });
    const store = new Store();

    await store.request({ url: '/users/1' });
    capture.restore();
    const found = capture.seen.some(
      (v: unknown[]) =>
        typeof v[0] === 'string' &&
        v[0].startsWith('2 errors and 0 warnings found in the {json:api} document returned by GET /users/1')
    );
    assert.true(found, 'An error was logged for the missing related resource');
  });

  test('It errors on duplicate resources when the duplicate is just one of the primary records', async function (assert) {
    const capture = captureLoggedReport();
    const Store = useRecommendedStore({
      cache: JSONAPICache,
      schemas: [
        withDefaults({
          type: 'user',
          fields: [
            { kind: 'field', name: 'name' },
            {
              kind: 'hasMany',
              name: 'friends',
              type: 'user',
              options: { inverse: null, async: false, linksMode: true },
            },
          ],
        }),
      ],
      handlers: [
        {
          request<T>() {
            return Promise.resolve({
              data: [
                {
                  type: 'user',
                  id: '5',
                  attributes: {
                    name: 'A record',
                  },
                },
                {
                  type: 'user',
                  id: '1',
                  attributes: {
                    name: 'Alice',
                  },
                  relationships: {
                    friends: {
                      data: [
                        { type: 'user', id: '2' },
                        { type: 'user', id: '3' },
                      ],
                    },
                  },
                },
                {
                  type: 'user',
                  id: '4',
                  attributes: {
                    name: 'A record',
                  },
                },
              ],
              included: [
                {
                  type: 'user',
                  id: '2',
                  attributes: {
                    name: 'A related record',
                  },
                },
                {
                  type: 'user',
                  id: '1',
                  attributes: {
                    name: 'Alice Duplicate',
                  },
                },
                {
                  type: 'user',
                  id: '3',
                  attributes: {
                    name: 'A related record',
                  },
                },
              ],
            }) as Promise<T>;
          },
        },
      ],
    });
    const store = new Store();

    await store.request({ url: '/users/1' });
    capture.restore();
    const found = capture.seen.some(
      (v: unknown[]) =>
        typeof v[0] === 'string' &&
        v[0].startsWith('2 errors and 0 warnings found in the {json:api} document returned by GET /users/1')
    );
    assert.true(found, 'An error was logged for the missing related resource');
  });

  test('It errors on duplicate resources when the duplicate is also a primary record', async function (assert) {
    const capture = captureLoggedReport();
    const Store = useRecommendedStore({
      cache: JSONAPICache,
      schemas: [
        withDefaults({
          type: 'user',
          fields: [
            { kind: 'field', name: 'name' },
            {
              kind: 'hasMany',
              name: 'friends',
              type: 'user',
              options: { inverse: null, async: false, linksMode: true },
            },
          ],
        }),
      ],
      handlers: [
        {
          request<T>() {
            return Promise.resolve({
              data: [
                {
                  type: 'user',
                  id: '5',
                  attributes: {
                    name: 'A record',
                  },
                },
                {
                  type: 'user',
                  id: '1',
                  attributes: {
                    name: 'Alice',
                  },
                  relationships: {
                    friends: {
                      data: [
                        { type: 'user', id: '2' },
                        { type: 'user', id: '3' },
                      ],
                    },
                  },
                },
                {
                  type: 'user',
                  id: '4',
                  attributes: {
                    name: 'A record',
                  },
                },
                {
                  type: 'user',
                  id: '1',
                  attributes: {
                    name: 'Alice Duplicate',
                  },
                },
              ],
              included: [
                {
                  type: 'user',
                  id: '2',
                  attributes: {
                    name: 'A related record',
                  },
                },
                {
                  type: 'user',
                  id: '3',
                  attributes: {
                    name: 'A related record',
                  },
                },
              ],
            }) as Promise<T>;
          },
        },
      ],
    });
    const store = new Store();

    await store.request({ url: '/users/1' });
    capture.restore();
    const found = capture.seen.some(
      (v: unknown[]) =>
        typeof v[0] === 'string' &&
        v[0].startsWith('2 errors and 0 warnings found in the {json:api} document returned by GET /users/1')
    );
    assert.true(found, 'An error was logged for the missing related resource');
  });

  test('It errors on duplicate resources when the duplicates are all included records', async function (assert) {
    const capture = captureLoggedReport();
    const Store = useRecommendedStore({
      cache: JSONAPICache,
      schemas: [
        withDefaults({
          type: 'user',
          fields: [
            { kind: 'field', name: 'name' },
            {
              kind: 'hasMany',
              name: 'friends',
              type: 'user',
              options: { inverse: null, async: false, linksMode: true },
            },
          ],
        }),
      ],
      handlers: [
        {
          request<T>() {
            return Promise.resolve({
              data: [
                {
                  type: 'user',
                  id: '5',
                  attributes: {
                    name: 'Alice',
                  },
                  relationships: {
                    friends: {
                      data: [
                        { type: 'user', id: '1' },
                        { type: 'user', id: '2' },
                        { type: 'user', id: '3' },
                      ],
                    },
                  },
                },
              ],
              included: [
                {
                  type: 'user',
                  id: '1',
                  attributes: {
                    name: 'Alice',
                  },
                },
                {
                  type: 'user',
                  id: '2',
                  attributes: {
                    name: 'A related record',
                  },
                },
                {
                  type: 'user',
                  id: '1',
                  attributes: {
                    name: 'Alice Duplicate',
                  },
                },
                {
                  type: 'user',
                  id: '3',
                  attributes: {
                    name: 'A related record',
                  },
                },
              ],
            }) as Promise<T>;
          },
        },
      ],
    });
    const store = new Store();

    await store.request({ url: '/users/1' });
    capture.restore();
    const found = capture.seen.some(
      (v: unknown[]) =>
        typeof v[0] === 'string' &&
        v[0].startsWith('2 errors and 0 warnings found in the {json:api} document returned by GET /users/1')
    );
    assert.true(found, 'An error was logged for the missing related resource');
  });
});
