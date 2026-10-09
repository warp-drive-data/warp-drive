import type { TestContext } from '@ember/test-helpers';

import { parse, print } from 'graphql';

import { setBuildURLConfig } from '@ember-data/request-utils';
import {
  createRecord,
  deleteRecord,
  get,
  getGraphqlRequestDetails,
  updateRecord,
} from '@ember-data/request-utils/graphql';
import type Store from '@ember-data/store';
import { recordIdentifierFor } from '@ember-data/store';
import { RequestManager } from '@warp-drive/core';
import type { Handler } from '@warp-drive/core/request';
import type { RequestContext } from '@warp-drive/core/types/request';
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

  test('the operation is found when the document starts with a fragment', function (this: TestContext, assert) {
    const QUERY = parse(`
      fragment UserName on User { firstName }
      query GetUsers { users { ...UserName } }
    `);

    const result = get(QUERY, 'user');
    assert.equal(result.url, 'https://api.example.com/api/v1/GetUsers', 'the url has the operation name');
    assert.equal(getGraphqlRequestDetails(result)?.operationName, 'GetUsers', 'so do the details');
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

  test('the request carries the query, the operation name and the variables it was built from', function (this: TestContext, assert) {
    const GET_USER_QUERY = parse(`
      query GetUser($id: ID!) {
        user(id: $id) {
          firstName
        }
      }
    `);

    const result = get(GET_USER_QUERY, 'user', { id: '1' });
    const details = getGraphqlRequestDetails(result);

    assert.true(details?.document === GET_USER_QUERY, 'the parsed document is attached');
    assert.equal(details?.operationName, 'GetUser', 'the operation name is attached');
    assert.deepEqual(details?.variables, { id: '1' }, 'the variables are attached');
  });

  test('a request that was not built with get has no graphql details', function (this: TestContext, assert) {
    assert.equal(getGraphqlRequestDetails({ url: '/users', method: 'GET' }), undefined);
  });

  test('the graphql details survive spreading the request and setting its options', async function (this: TestContext, assert) {
    const GET_USER_QUERY = parse(`
      query GetUser($id: ID!) {
        user(id: $id) {
          firstName
        }
      }
    `);

    let seen: ReturnType<typeof getGraphqlRequestDetails>;
    const recorder: Handler = {
      request<T>(context: RequestContext): Promise<T> {
        seen = getGraphqlRequestDetails(context.request);
        return Promise.resolve({ data: null } as T);
      },
    };
    const manager = new RequestManager().use([recorder]);

    await manager.request({ ...get(GET_USER_QUERY, 'user', { id: '1' }), options: { errorPolicy: 'all' } });

    assert.true(seen?.document === GET_USER_QUERY, 'a handler can still read the query');
    assert.deepEqual(seen?.variables, { id: '1' }, 'and the variables');
  });

  const SAVE_USER_SETTING = parse(`
    mutation SaveUserSetting($id: ID!, $name: String) {
      saveUserSetting(id: $id, name: $name) {
        __typename
        id
        name
      }
    }
  `);

  test('deleteRecord tells the cache which record is being deleted', function (this: TestContext, assert) {
    const store = this.owner.lookup('service:store') as Store;
    store.push({ data: { id: '12', type: 'user-setting', attributes: { name: 'test' } } });
    const userSetting = store.peekRecord('user-setting', '12');
    const identifier = recordIdentifierFor(userSetting);

    const result = deleteRecord(userSetting, SAVE_USER_SETTING, { id: '12' });

    assert.equal(result.url, 'https://api.example.com/api/v1/SaveUserSetting', 'the url is built from the operation');
    assert.equal(result.method, 'POST', 'a graphql mutation is a POST');
    assert.equal(result.op, 'deleteRecord', 'the op is deleteRecord');
    assert.deepEqual(result.records, [identifier], 'the records are the record being deleted');
    assert.deepEqual(result.data, { record: identifier }, 'the data carries the record');
    assert.deepEqual(headersToObject(result.headers), GRAPHQL_HEADERS);
    assert.deepEqual(
      JSON.parse(result.body),
      { query: print(SAVE_USER_SETTING), operationName: 'SaveUserSetting', variables: { id: '12' } },
      'the body is the mutation and its variables'
    );
    assert.false('cacheOptions' in result, 'a mutation is never cached');
    assert.true(getGraphqlRequestDetails(result)?.document === SAVE_USER_SETTING, 'the details are attached');
  });

  test('updateRecord tells the cache which record is being updated', function (this: TestContext, assert) {
    const store = this.owner.lookup('service:store') as Store;
    store.push({ data: { id: '12', type: 'user-setting', attributes: { name: 'test' } } });
    const userSetting = store.peekRecord('user-setting', '12');
    const identifier = recordIdentifierFor(userSetting);

    const result = updateRecord(userSetting, SAVE_USER_SETTING, { id: '12', name: 'new' }, { namespace: 'graphql' });

    assert.equal(result.url, 'https://api.example.com/graphql/SaveUserSetting', 'the namespace option is used');
    assert.equal(result.op, 'updateRecord', 'the op is updateRecord');
    assert.deepEqual(result.records, [identifier], 'the records are the record being updated');
  });

  test('createRecord tells the cache which new record is being saved', function (this: TestContext, assert) {
    const store = this.owner.lookup('service:store') as Store;
    const userSetting = store.createRecord('user-setting', { name: 'test' });
    const identifier = recordIdentifierFor(userSetting);

    const result = createRecord(userSetting, SAVE_USER_SETTING, { id: 'new', name: 'test' });

    assert.equal(result.op, 'createRecord', 'the op is createRecord');
    assert.deepEqual(result.records, [identifier], 'the records are the new record');
    assert.equal(identifier.id, null, 'the record has no id yet');
  });
});
