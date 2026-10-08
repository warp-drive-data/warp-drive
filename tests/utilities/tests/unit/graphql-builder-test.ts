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
        cacheOptions: { key: 'https://api.example.com/api/v1/GetUsers#{}' },
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
        cacheOptions: { key: 'https://api.example.com/api/v1/GetUser#{"id":"1"}' },
        op: 'query',
      },
      `query works with type and options`
    );
    assert.deepEqual(headersToObject(result.headers), GRAPHQL_HEADERS);
    assert.true(true);
  });

  test('the cache key does not depend on the order of the variables', function (this: TestContext, assert) {
    const GET_MEMBERS_QUERY = parse(`
      query GetMembers($from: String, $to: String) {
        members(from: $from, to: $to) {
          name
        }
      }
    `);

    const a = get(GET_MEMBERS_QUERY, 'member', { from: '2026-01-01', to: '2026-01-31' });
    const b = get(GET_MEMBERS_QUERY, 'member', { to: '2026-01-31', from: '2026-01-01' });

    assert.equal(a.cacheOptions?.key, b.cacheOptions?.key, 'the same variables in another order give the same key');
  });

  test('the cache key differs when the variables differ', function (this: TestContext, assert) {
    const GET_MEMBERS_QUERY = parse(`
      query GetMembers($from: String, $to: String) {
        members(from: $from, to: $to) {
          name
        }
      }
    `);

    const january = get(GET_MEMBERS_QUERY, 'member', { from: '2026-01-01', to: '2026-01-31' });
    const february = get(GET_MEMBERS_QUERY, 'member', { from: '2026-02-01', to: '2026-02-28' });

    assert.notEqual(january.cacheOptions?.key, february.cacheOptions?.key, 'different variables give different keys');
  });

  test('the cache key is kept with the reload options', function (this: TestContext, assert) {
    const GET_USER_QUERY = parse(`
      query GetUser($id: ID!) {
        user(id: $id) {
          firstName
        }
      }
    `);

    const result = get(GET_USER_QUERY, 'user', { id: '1' }, { reload: true, backgroundReload: false });

    assert.deepEqual(result.cacheOptions, {
      reload: true,
      backgroundReload: false,
      key: 'https://api.example.com/api/v1/GetUser#{"id":"1"}',
    });
  });
});
