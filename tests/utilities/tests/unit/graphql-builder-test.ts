import type { TestContext } from '@ember/test-helpers';

import { parse, print } from 'graphql';

import { setBuildURLConfig } from '@ember-data/request-utils';
import { get } from '@ember-data/request-utils/graphql';
import { module, test } from '@warp-drive/diagnostic';
import { setupTest } from '@warp-drive/diagnostic/ember';

import { headersToObject } from '../helpers/utils';

const GRAPHQL_HEADERS = { accept: 'application/vnd.api+json' };

module('GraphQL | Request Builders', function (hooks) {
  setupTest(hooks);

  hooks.beforeEach(function () {
    setBuildURLConfig({ host: 'https://api.example.com', namespace: 'api/v1' });
  });

  hooks.afterEach(function () {
    setBuildURLConfig({ host: '', namespace: '' });
  });

  test('query', function (this: TestContext, assert) {
    const GET_USER_QUERY = parse(`
      query GetUsers {
        users {
          firstName
          lastName
        }
      }
    `);

    const result = get(GET_USER_QUERY, 'user');
    assert.deepEqual(
      result,
      {
        url: 'https://api.example.com/api/v1/GetUsers',
        method: 'POST',
        headers: new Headers(GRAPHQL_HEADERS),
        body: JSON.stringify({
          query: print(GET_USER_QUERY),
          operationName: 'GetUsers',
          variables: {},
        }),
        cacheOptions: {},
        op: 'query',
      },
      `query works with type and options`
    );
    assert.deepEqual(headersToObject(result.headers), GRAPHQL_HEADERS);
    assert.true(true);
  });

  test('query with variables', function (this: TestContext, assert) {
    const GET_USER_QUERY = parse(`
      query GetUser($id: ID!) {
        user(id: $id) {
          firstName
          lastName
        }
      }
    `);

    const result = get(GET_USER_QUERY, 'user', { id: '1' });
    assert.deepEqual(
      result,
      {
        url: 'https://api.example.com/api/v1/GetUser',
        method: 'POST',
        headers: new Headers(GRAPHQL_HEADERS),
        body: JSON.stringify({
          query: print(GET_USER_QUERY),
          operationName: 'GetUser',
          variables: { id: '1' },
        }),
        cacheOptions: {},
        op: 'query',
      },
      `query works with type and options`
    );
    assert.deepEqual(headersToObject(result.headers), GRAPHQL_HEADERS);
    assert.true(true);
  });
});
