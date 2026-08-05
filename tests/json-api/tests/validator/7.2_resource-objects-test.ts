import { useRecommendedStore } from '@warp-drive/core';
import { PRODUCTION } from '@warp-drive/core/build-config/env';
import { module, skip, test as runTest } from '@warp-drive/diagnostic';
import { JSONAPICache } from '@warp-drive/json-api';

import { captureLoggedReport } from './utils';

const test = PRODUCTION ? skip : runTest;

module('Validator | 7.2 Resource Objects', function () {
  test('It does not warn for a relationship with a sourceKey when the payload uses the sourceKey', async function (assert) {
    const capture = captureLoggedReport();
    const Store = useRecommendedStore({
      cache: JSONAPICache,
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
                  'best-friend': {
                    data: { type: 'user', id: '2' },
                  },
                },
              },
              included: [
                {
                  type: 'user',
                  id: '2',
                  attributes: {
                    name: 'Bob',
                  },
                },
              ],
            }) as Promise<T>;
          },
        },
      ],
    });
    const store = new Store();
    store.schema.registerResources([
      {
        type: 'user',
        legacy: true,
        identity: { kind: '@id', name: 'id' },
        fields: [
          { kind: 'field', name: 'name' },
          {
            kind: 'belongsTo',
            name: 'bestFriend',
            type: 'user',
            sourceKey: 'best-friend',
            options: { inverse: null, async: false },
          },
        ],
      },
    ]);

    await store.request({ url: '/users/1' });
    capture.restore();
    // the reporter only logs when there is at least one error or warning to report,
    // so a clean document produces no output at all
    assert.equal(capture.seen.length, 0, 'No warnings or errors were logged for the relationship using its sourceKey');
  });

  test('It gives a specific error when a relationship with a sourceKey is provided using its field name instead', async function (assert) {
    const capture = captureLoggedReport();
    const Store = useRecommendedStore({
      cache: JSONAPICache,
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
                    name: 'Bob',
                  },
                },
              ],
            }) as Promise<T>;
          },
        },
      ],
    });
    const store = new Store();
    store.schema.registerResources([
      {
        type: 'user',
        legacy: true,
        identity: { kind: '@id', name: 'id' },
        fields: [
          { kind: 'field', name: 'name' },
          {
            kind: 'belongsTo',
            name: 'bestFriend',
            type: 'user',
            sourceKey: 'best-friend',
            options: { inverse: null, async: false },
          },
        ],
      },
    ]);

    await store.request({ url: '/users/1' });
    capture.restore();
    // unrecognized relationships are reported as errors by default (strict.unknownRelationship)
    const found = capture.seen.some(
      (v: unknown[]) =>
        typeof v[0] === 'string' &&
        v[0].startsWith('1 errors and 0 warnings found in the {json:api} document returned by GET /users/1')
    );
    assert.true(found, 'An error was logged for the relationship not matching its sourceKey');

    const hasSpecificMessage = capture.seen.some(
      (v: unknown[]) =>
        typeof v[0] === 'string' &&
        v[0].includes('to be provided using its sourceKey "best-friend" instead of its field name "bestFriend"')
    );
    assert.true(
      hasSpecificMessage,
      'The error message specifically calls out the sourceKey/name mismatch rather than reporting a generic unrecognized relationship'
    );
  });
});
