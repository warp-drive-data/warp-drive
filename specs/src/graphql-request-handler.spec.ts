import { parse } from 'graphql';

import { Fetch, RequestManager } from '@warp-drive/core';
import { getRequestState } from '@warp-drive/core/reactive';
import type { CacheHandler, Future, NextFn } from '@warp-drive/core/request';
import type { RequestContext, StructuredDataDocument } from '@warp-drive/core/types/request';
import { spec, type SpecTest, type SuiteBuilder } from '@warp-drive/diagnostic/spec';
import { MockServerHandler } from '@warp-drive/holodeck';
import { GET, POST } from '@warp-drive/holodeck/mock';
import { buildBaseURL } from '@warp-drive/utilities';
import { get } from '@warp-drive/utilities/graphql';
import { GraphQLToJSONAPIHandler } from '@warp-drive/utilities/handlers';

// our tests use a rendering test context and add manager to it
interface LocalTestContext {
  manager: RequestManager;
}

type RequestState<RT, E> = ReturnType<typeof getRequestState<RT, E>>;

const GET_USER_QUERY = parse(`
  query GetUser {
    user {
      id
      firstName
      lastName
    }
  }
`);

const GET_POSTS_QUERY = parse(`
  query GetPosts {
    posts {
      edges {
        node {
          id
          title
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`);

class SimpleCacheHandler implements CacheHandler {
  _cache: Map<string, unknown> = new Map();
  request<T = unknown>(
    context: RequestContext,
    next: NextFn<T>
  ): T | Promise<T | StructuredDataDocument<T>> | Future<T> {
    const { url, method } = context.request;
    if (url && method === 'GET' && this._cache.has(url)) {
      return this._cache.get(url) as T;
    }

    const future = next(context.request);
    context.setStream(future.getStream());

    return future.then(
      (result) => {
        if (url && method === 'GET') {
          this._cache.set(url, result);
        }
        return result;
      },
      (error) => {
        if (url && method === 'GET') {
          this._cache.set(url, error);
        }
        throw error;
      }
    );
  }
}

export interface GraphqlRequestHandlerSpecSignature extends Record<string, SpecTest<LocalTestContext, object>> {
  'it transforms a successful graphql response into a json:api document': SpecTest<
    LocalTestContext,
    {
      request: Future<unknown>;
      _getRequestState: (p: Future<unknown>) => RequestState<unknown, unknown>;
      countFor: (result: unknown, error: unknown) => number;
    }
  >;
  'it transforms a paginated graphql connection into an array of resources with pageInfo meta': SpecTest<
    LocalTestContext,
    {
      request: Future<unknown>;
      _getRequestState: (p: Future<unknown>) => RequestState<unknown, unknown>;
      countFor: (result: unknown, error: unknown) => number;
    }
  >;
  "it rejects with an aggregate error when errorPolicy is 'all' and the response contains graphql errors": SpecTest<
    LocalTestContext,
    {
      request: Future<unknown>;
      _getRequestState: (p: Future<unknown>) => RequestState<unknown, unknown>;
      countFor: (result: unknown, error: unknown) => number;
    }
  >;
  "it rejects with an aggregate error when errorPolicy is 'all' and the root field is an Error union member": SpecTest<
    LocalTestContext,
    {
      request: Future<unknown>;
      _getRequestState: (p: Future<unknown>) => RequestState<unknown, unknown>;
      countFor: (result: unknown, error: unknown) => number;
    }
  >;
  'it unwraps a Success union member into its nested resource': SpecTest<
    LocalTestContext,
    {
      request: Future<unknown>;
      _getRequestState: (p: Future<unknown>) => RequestState<unknown, unknown>;
      countFor: (result: unknown, error: unknown) => number;
    }
  >;
  'it resolves a null root field to null data': SpecTest<
    LocalTestContext,
    {
      request: Future<unknown>;
      _getRequestState: (p: Future<unknown>) => RequestState<unknown, unknown>;
      countFor: (result: unknown, error: unknown) => number;
    }
  >;
  'it keeps a scalar root result in meta': SpecTest<
    LocalTestContext,
    {
      request: Future<unknown>;
      _getRequestState: (p: Future<unknown>) => RequestState<unknown, unknown>;
      countFor: (result: unknown, error: unknown) => number;
    }
  >;
  'it keeps a root object without __typename in meta': SpecTest<
    LocalTestContext,
    {
      request: Future<unknown>;
      _getRequestState: (p: Future<unknown>) => RequestState<unknown, unknown>;
      countFor: (result: unknown, error: unknown) => number;
    }
  >;
  'it rejects a mutation that has graphql errors without an errorPolicy': SpecTest<
    LocalTestContext,
    {
      request: Future<unknown>;
      _getRequestState: (p: Future<unknown>) => RequestState<unknown, unknown>;
      countFor: (result: unknown, error: unknown) => number;
    }
  >;
  'it lets a mutation choose its errorPolicy': SpecTest<
    LocalTestContext,
    {
      request: Future<unknown>;
      _getRequestState: (p: Future<unknown>) => RequestState<unknown, unknown>;
      countFor: (result: unknown, error: unknown) => number;
    }
  >;
  'it keeps the result of a delete in meta instead of turning it into a resource': SpecTest<
    LocalTestContext,
    {
      request: Future<unknown>;
      _getRequestState: (p: Future<unknown>) => RequestState<unknown, unknown>;
      countFor: (result: unknown, error: unknown) => number;
    }
  >;
  "it collects graphql errors into response meta when errorPolicy is 'ignore'": SpecTest<
    LocalTestContext,
    {
      request: Future<unknown>;
      _getRequestState: (p: Future<unknown>) => RequestState<unknown, unknown>;
      countFor: (result: unknown, error: unknown) => number;
    }
  >;
  'it does not transform responses from non-graphql endpoints': SpecTest<
    LocalTestContext,
    {
      request: Future<unknown>;
      _getRequestState: (p: Future<unknown>) => RequestState<unknown, unknown>;
      countFor: (result: unknown, error: unknown) => number;
    }
  >;
}

export const GraphqlRequestHandlerSpec: SuiteBuilder<LocalTestContext, GraphqlRequestHandlerSpecSignature> =
  spec<LocalTestContext>('GraphQLToJSONAPIHandler', function (hooks) {
    hooks.beforeEach(function () {
      const manager = new RequestManager();
      manager.use([new GraphQLToJSONAPIHandler(), new MockServerHandler(this), Fetch]);
      manager.useCache(new SimpleCacheHandler());

      this.manager = manager;
    });
  })
    .for('it transforms a successful graphql response into a json:api document')
    .use<{
      request: Future<unknown>;
      _getRequestState: (p: Future<unknown>) => RequestState<unknown, unknown>;
      countFor: (result: unknown, error: unknown) => number;
    }>(async function (assert) {
      // `namespace: 'graphql'` puts `/graphql/` in the request url, which is
      // one of the two ways GraphQLToJSONAPIHandler recognizes a graphql
      // response to transform (the other being an `x-response-format: graphql`
      // response header, which we cannot rely on here since the holodeck mock
      // server's CORS policy does not expose arbitrary custom response headers
      // to the browser via `Access-Control-Expose-Headers`).
      const requestInfo = get(GET_USER_QUERY, 'user', {}, { namespace: 'graphql' });
      await POST(
        this,
        'graphql/GetUser',
        () => ({
          data: {
            user: {
              __typename: 'User',
              id: '1',
              firstName: 'Chris',
              lastName: 'Thoburn',
            },
          },
        }),
        { body: requestInfo.body }
      );

      const request = this.manager.request<unknown>(requestInfo);

      let state1: RequestState<unknown, unknown> | undefined;
      function _getRequestState(p: Future<unknown>): RequestState<unknown, unknown> {
        state1 = getRequestState(p);
        return state1;
      }
      let counter = 0;
      function countFor(_result: unknown, _error: unknown) {
        return ++counter;
      }

      await this.render({
        request,
        _getRequestState,
        countFor,
      });

      assert.equal(state1!.result, null, 'result is null before the request resolves');
      assert.equal(counter, 1, 'counter is 1');
      assert.dom().hasText('Count:1');

      await request;
      await this.h.rerender();

      const result = state1!.result as {
        data: { type: string; id: string; attributes: Record<string, unknown> };
      };
      assert.equal(result.data.type, 'user', 'type is singularized correctly');
      assert.equal(result.data.id, '1', 'id is correct');
      assert.equal(result.data.attributes.firstName, 'Chris', 'firstName attribute is correct');
      assert.equal(result.data.attributes.lastName, 'Thoburn', 'lastName attribute is correct');
      assert.equal(counter, 2, 'counter is 2');
      assert.dom().hasText('Count:2');
    })

    .for('it transforms a paginated graphql connection into an array of resources with pageInfo meta')
    .use<{
      request: Future<unknown>;
      _getRequestState: (p: Future<unknown>) => RequestState<unknown, unknown>;
      countFor: (result: unknown, error: unknown) => number;
    }>(async function (assert) {
      const requestInfo = get(GET_POSTS_QUERY, 'post', {}, { namespace: 'graphql' });
      await POST(
        this,
        'graphql/GetPosts',
        () => ({
          data: {
            posts: {
              edges: [
                {
                  node: {
                    __typename: 'Post',
                    id: '10',
                    title: 'Hello World',
                  },
                },
              ],
              pageInfo: {
                hasNextPage: false,
                endCursor: 'abc',
              },
            },
          },
        }),
        { body: requestInfo.body }
      );

      const request = this.manager.request<unknown>(requestInfo);

      let state1: RequestState<unknown, unknown> | undefined;
      function _getRequestState(p: Future<unknown>): RequestState<unknown, unknown> {
        state1 = getRequestState(p);
        return state1;
      }
      let counter = 0;
      function countFor(_result: unknown, _error: unknown) {
        return ++counter;
      }

      await this.render({
        request,
        _getRequestState,
        countFor,
      });

      assert.equal(counter, 1, 'counter is 1');

      await request;
      await this.h.rerender();

      const result = state1!.result as {
        data: Array<{ type: string; id: string; attributes: Record<string, unknown> }>;
        meta: { posts: { pageInfo: { hasNextPage: boolean; endCursor: string } } };
      };
      assert.true(Array.isArray(result.data), 'data is an array');
      assert.equal(result.data.length, 1, 'data has one resource');
      assert.equal(result.data[0].type, 'post', 'type is singularized correctly');
      assert.equal(result.data[0].attributes.title, 'Hello World', 'title attribute is correct');
      assert.deepEqual(
        result.meta.posts.pageInfo,
        { hasNextPage: false, endCursor: 'abc' },
        'pageInfo meta is preserved'
      );
      assert.equal(counter, 2, 'counter is 2');
      assert.dom().hasText('Count:2');
    })

    .for("it rejects with an aggregate error when errorPolicy is 'all' and the response contains graphql errors")
    .use<{
      request: Future<unknown>;
      _getRequestState: (p: Future<unknown>) => RequestState<unknown, unknown>;
      countFor: (result: unknown, error: unknown) => number;
    }>(async function (assert) {
      const requestInfo = get(GET_USER_QUERY, 'user', {}, { namespace: 'graphql' });
      await POST(
        this,
        'graphql/GetUser',
        () => ({
          errors: [
            {
              message: 'User not found',
              path: ['user'],
            },
          ],
        }),
        { status: 200, body: requestInfo.body }
      );

      const request = this.manager.request<unknown>({ ...requestInfo, options: { errorPolicy: 'all' } });

      let state1: RequestState<unknown, unknown> | undefined;
      function _getRequestState(p: Future<unknown>): RequestState<unknown, unknown> {
        state1 = getRequestState(p);
        return state1;
      }
      let counter = 0;
      function countFor(_result: unknown, _error: unknown) {
        return ++counter;
      }

      await this.render({
        request,
        _getRequestState,
        countFor,
      });

      assert.equal(counter, 1, 'counter is 1');

      try {
        await request;
      } catch {
        // ignore, we assert against the reactive state below
      }
      await this.h.rerender();

      assert.equal(state1!.result, null, 'result is null');
      assert.true(state1!.error instanceof Error, 'error is an instance of Error');
      const error = state1!.error as Error & { content?: unknown };
      // Since this is a 200 (successful, per fetch/HTTP semantics) response for
      // a non-mutation ('query') op, the Fetch handler clones the Response to
      // attach a synthetic `date` header (the holodeck mock server doesn't set
      // one). A `Response` created via `new Response(...)` always reports
      // `type: 'default'` and `url: ''` (both are only ever populated by the
      // platform on responses returned directly from a real `fetch()` call),
      // which is why this differs from the `(cors) - <url>` shape seen on
      // genuine network/HTTP-level errors (e.g. the 404 case exercised by the
      // get-request-state-rendering spec).
      assert.equal(error.message, '[200] POST (default) - ', 'error message is correct');
      assert.deepEqual(
        error.content,
        [{ title: 'GraphQL Error', detail: 'User not found', source: { pointer: '/user' } }],
        'error content contains the formatted graphql errors'
      );
      assert.equal(counter, 2, 'counter is 2');
    })

    .for("it rejects with an aggregate error when errorPolicy is 'all' and the root field is an Error union member")
    .use<{
      request: Future<unknown>;
      _getRequestState: (p: Future<unknown>) => RequestState<unknown, unknown>;
      countFor: (result: unknown, error: unknown) => number;
    }>(async function (assert) {
      const requestInfo = get(GET_USER_QUERY, 'user', {}, { namespace: 'graphql' });
      await POST(
        this,
        'graphql/GetUser',
        () => ({
          data: {
            user: {
              __typename: 'ValidationError',
              message: 'Name is required',
            },
          },
        }),
        { status: 200, body: requestInfo.body }
      );

      const request = this.manager.request<unknown>({ ...requestInfo, options: { errorPolicy: 'all' } });

      let state1: RequestState<unknown, unknown> | undefined;
      function _getRequestState(p: Future<unknown>): RequestState<unknown, unknown> {
        state1 = getRequestState(p);
        return state1;
      }
      let counter = 0;
      function countFor(_result: unknown, _error: unknown) {
        return ++counter;
      }

      await this.render({
        request,
        _getRequestState,
        countFor,
      });

      try {
        await request;
      } catch {
        // ignore, we assert against the reactive state below
      }
      await this.h.rerender();

      assert.equal(state1!.result, null, 'result is null');
      assert.true(state1!.error instanceof Error, 'error is an instance of Error');
      const error = state1!.error as Error & { content?: unknown };
      assert.deepEqual(
        error.content,
        [{ title: 'GraphQL Error', detail: 'Name is required', source: {} }],
        'error content contains the union error message'
      );
    })

    .for('it unwraps a Success union member into its nested resource')
    .use<{
      request: Future<unknown>;
      _getRequestState: (p: Future<unknown>) => RequestState<unknown, unknown>;
      countFor: (result: unknown, error: unknown) => number;
    }>(async function (assert) {
      const requestInfo = get(GET_USER_QUERY, 'user', {}, { namespace: 'graphql' });
      await POST(
        this,
        'graphql/GetUser',
        () => ({
          data: {
            user: {
              __typename: 'createUserSuccess',
              user: { __typename: 'User', id: '1', firstName: 'Chris' },
            },
          },
        }),
        { body: requestInfo.body }
      );

      const request = this.manager.request<unknown>(requestInfo);

      let state1: RequestState<unknown, unknown> | undefined;
      function _getRequestState(p: Future<unknown>): RequestState<unknown, unknown> {
        state1 = getRequestState(p);
        return state1;
      }
      let counter = 0;
      function countFor(_result: unknown, _error: unknown) {
        return ++counter;
      }

      await this.render({
        request,
        _getRequestState,
        countFor,
      });

      await request;
      await this.h.rerender();

      const result = state1!.result as { data: { type: string; id: string; attributes: Record<string, unknown> } };
      assert.equal(result.data.type, 'user', 'type comes from the nested resource');
      assert.equal(result.data.id, '1', 'id comes from the nested resource');
      assert.equal(result.data.attributes.firstName, 'Chris', 'attributes come from the nested resource');
    })

    .for('it resolves a null root field to null data')
    .use<{
      request: Future<unknown>;
      _getRequestState: (p: Future<unknown>) => RequestState<unknown, unknown>;
      countFor: (result: unknown, error: unknown) => number;
    }>(async function (assert) {
      const requestInfo = get(GET_USER_QUERY, 'user', {}, { namespace: 'graphql' });
      await POST(
        this,
        'graphql/GetUser',
        () => ({
          data: {
            user: null,
          },
        }),
        { body: requestInfo.body }
      );

      const request = this.manager.request<unknown>(requestInfo);

      let state1: RequestState<unknown, unknown> | undefined;
      function _getRequestState(p: Future<unknown>): RequestState<unknown, unknown> {
        state1 = getRequestState(p);
        return state1;
      }
      let counter = 0;
      function countFor(_result: unknown, _error: unknown) {
        return ++counter;
      }

      await this.render({
        request,
        _getRequestState,
        countFor,
      });

      await request;
      await this.h.rerender();

      assert.equal(state1!.error, null, 'it is not an error');
      const result = state1!.result as { data: unknown; meta?: Record<string, unknown> };
      assert.equal(result.data, null, 'data is null');
    })

    .for('it keeps a scalar root result in meta')
    .use<{
      request: Future<unknown>;
      _getRequestState: (p: Future<unknown>) => RequestState<unknown, unknown>;
      countFor: (result: unknown, error: unknown) => number;
    }>(async function (assert) {
      const requestInfo = get(GET_USER_QUERY, 'user', {}, { namespace: 'graphql' });
      await POST(
        this,
        'graphql/GetUser',
        () => ({
          data: {
            user: true,
          },
        }),
        { body: requestInfo.body }
      );

      const request = this.manager.request<unknown>(requestInfo);

      let state1: RequestState<unknown, unknown> | undefined;
      function _getRequestState(p: Future<unknown>): RequestState<unknown, unknown> {
        state1 = getRequestState(p);
        return state1;
      }
      let counter = 0;
      function countFor(_result: unknown, _error: unknown) {
        return ++counter;
      }

      await this.render({
        request,
        _getRequestState,
        countFor,
      });

      await request;
      await this.h.rerender();

      assert.equal(state1!.error, null, 'it is not an error');
      const result = state1!.result as { data: unknown; meta?: Record<string, unknown> };
      assert.equal(result.data, null, 'data is null');
      assert.equal(result.meta?.user, true, 'the scalar result is kept in meta under the field name');
    })

    .for('it keeps a root object without __typename in meta')
    .use<{
      request: Future<unknown>;
      _getRequestState: (p: Future<unknown>) => RequestState<unknown, unknown>;
      countFor: (result: unknown, error: unknown) => number;
    }>(async function (assert) {
      const requestInfo = get(GET_USER_QUERY, 'user', {}, { namespace: 'graphql' });
      await POST(
        this,
        'graphql/GetUser',
        () => ({
          data: {
            user: { id: '1', firstName: 'Chris' },
          },
        }),
        { body: requestInfo.body }
      );

      const request = this.manager.request<unknown>(requestInfo);

      let state1: RequestState<unknown, unknown> | undefined;
      function _getRequestState(p: Future<unknown>): RequestState<unknown, unknown> {
        state1 = getRequestState(p);
        return state1;
      }
      let counter = 0;
      function countFor(_result: unknown, _error: unknown) {
        return ++counter;
      }

      await this.render({
        request,
        _getRequestState,
        countFor,
      });

      await request;
      await this.h.rerender();

      assert.equal(state1!.error, null, 'it is not an error');
      const result = state1!.result as { data: unknown; meta?: Record<string, unknown> };
      assert.equal(result.data, null, 'data is null, the object cannot be typed');
      assert.deepEqual(result.meta?.user, { id: '1', firstName: 'Chris' }, 'the object is kept in meta under the field name');
    })

    .for('it rejects a mutation that has graphql errors without an errorPolicy')
    .use<{
      request: Future<unknown>;
      _getRequestState: (p: Future<unknown>) => RequestState<unknown, unknown>;
      countFor: (result: unknown, error: unknown) => number;
    }>(async function (assert) {
      const requestInfo = get(GET_USER_QUERY, 'user', {}, { namespace: 'graphql' });
      await POST(
        this,
        'graphql/GetUser',
        () => ({ errors: [{ message: 'Not allowed', path: ['user'] }] }),
        { body: requestInfo.body }
      );

      const request = this.manager.request<unknown>({ ...requestInfo, op: 'updateRecord' });

      let state1: RequestState<unknown, unknown> | undefined;
      function _getRequestState(p: Future<unknown>): RequestState<unknown, unknown> {
        state1 = getRequestState(p);
        return state1;
      }
      let counter = 0;
      function countFor(_result: unknown, _error: unknown) {
        return ++counter;
      }

      await this.render({
        request,
        _getRequestState,
        countFor,
      });

      try {
        await request;
      } catch {
        // ignore, we assert against the reactive state below
      }
      await this.h.rerender();

      assert.equal(state1!.result, null, 'result is null');
      assert.true(state1!.error instanceof Error, 'the request rejects');
      const error = state1!.error as Error & { content?: unknown };
      assert.deepEqual(
        error.content,
        [{ title: 'GraphQL Error', detail: 'Not allowed', source: { pointer: '/user' } }],
        'the error carries the graphql errors'
      );
    })

    .for('it lets a mutation choose its errorPolicy')
    .use<{
      request: Future<unknown>;
      _getRequestState: (p: Future<unknown>) => RequestState<unknown, unknown>;
      countFor: (result: unknown, error: unknown) => number;
    }>(async function (assert) {
      const requestInfo = get(GET_USER_QUERY, 'user', {}, { namespace: 'graphql' });
      await POST(
        this,
        'graphql/GetUser',
        () => ({ errors: [{ message: 'Not allowed', path: ['user'] }] }),
        { body: requestInfo.body }
      );

      const request = this.manager.request<unknown>({ ...requestInfo, op: 'updateRecord', options: { errorPolicy: 'ignore' } });

      let state1: RequestState<unknown, unknown> | undefined;
      function _getRequestState(p: Future<unknown>): RequestState<unknown, unknown> {
        state1 = getRequestState(p);
        return state1;
      }
      let counter = 0;
      function countFor(_result: unknown, _error: unknown) {
        return ++counter;
      }

      await this.render({
        request,
        _getRequestState,
        countFor,
      });

      await request;
      await this.h.rerender();

      assert.equal(state1!.error, null, 'the request does not reject when the app chose errorPolicy ignore');
      const result = state1!.result as { meta?: { errors: Array<{ detail: string }> } };
      assert.equal(result.meta?.errors.length, 1, 'the errors are collected into meta');
      assert.equal(result.meta?.errors[0].detail, 'Not allowed', 'with their detail');
    })

    .for('it keeps the result of a delete in meta instead of turning it into a resource')
    .use<{
      request: Future<unknown>;
      _getRequestState: (p: Future<unknown>) => RequestState<unknown, unknown>;
      countFor: (result: unknown, error: unknown) => number;
    }>(async function (assert) {
      const requestInfo = get(GET_USER_QUERY, 'user', {}, { namespace: 'graphql' });
      await POST(
        this,
        'graphql/GetUser',
        () => ({ data: { user: { __typename: 'DeleteUserPayload', id: '1' } } }),
        { body: requestInfo.body }
      );

      const request = this.manager.request<unknown>({ ...requestInfo, op: 'deleteRecord' });

      let state1: RequestState<unknown, unknown> | undefined;
      function _getRequestState(p: Future<unknown>): RequestState<unknown, unknown> {
        state1 = getRequestState(p);
        return state1;
      }
      let counter = 0;
      function countFor(_result: unknown, _error: unknown) {
        return ++counter;
      }

      await this.render({
        request,
        _getRequestState,
        countFor,
      });

      await request;
      await this.h.rerender();

      assert.equal(state1!.error, null, 'it is not an error');
      const result = state1!.result as { data: unknown; included: unknown[]; meta?: Record<string, unknown> };
      assert.equal(result.data, null, 'data is null, a delete payload is not a resource');
      assert.deepEqual(result.included, [], 'nothing is included');
      assert.deepEqual(result.meta?.user, { __typename: 'DeleteUserPayload', id: '1' }, 'the payload is kept in meta');
    })

    .for("it collects graphql errors into response meta when errorPolicy is 'ignore'")
    .use<{
      request: Future<unknown>;
      _getRequestState: (p: Future<unknown>) => RequestState<unknown, unknown>;
      countFor: (result: unknown, error: unknown) => number;
    }>(async function (assert) {
      const requestInfo = get(GET_USER_QUERY, 'user', {}, { namespace: 'graphql' });
      await POST(
        this,
        'graphql/GetUser',
        () => ({
          data: {
            user: {
              __typename: 'User',
              id: '1',
              firstName: 'Chris',
              errors: [
                {
                  message: 'lastName failed',
                  path: ['user', 'lastName'],
                },
              ],
            },
          },
        }),
        { body: requestInfo.body }
      );

      const request = this.manager.request<unknown>({ ...requestInfo, options: { errorPolicy: 'ignore' } });

      let state1: RequestState<unknown, unknown> | undefined;
      function _getRequestState(p: Future<unknown>): RequestState<unknown, unknown> {
        state1 = getRequestState(p);
        return state1;
      }
      let counter = 0;
      function countFor(_result: unknown, _error: unknown) {
        return ++counter;
      }

      await this.render({
        request,
        _getRequestState,
        countFor,
      });

      await request;
      await this.h.rerender();

      assert.equal(state1!.error, null, 'error is null, this is a success');
      const result = state1!.result as {
        data: { attributes: Record<string, unknown> };
        meta: { errors: Array<{ detail: string }> };
      };
      assert.equal(result.data.attributes.firstName, 'Chris', 'firstName attribute is correct');
      assert.equal(result.meta.errors.length, 1, 'meta.errors has one entry');
      assert.equal(result.meta.errors[0].detail, 'lastName failed', 'meta.errors entry has the correct detail');
      assert.dom().hasText('Count:2');
    })

    .for('it does not transform responses from non-graphql endpoints')
    .use<{
      request: Future<unknown>;
      _getRequestState: (p: Future<unknown>) => RequestState<unknown, unknown>;
      countFor: (result: unknown, error: unknown) => number;
    }>(async function (assert) {
      const url = buildBaseURL({ resourcePath: 'account-status', op: 'query', identifier: { type: 'account-status' } });
      await GET(this, 'account-status', () => ({
        user: {
          __typename: 'User',
          id: '9',
          name: 'Untouched',
        },
      }));

      const request = this.manager.request<unknown>({ url, method: 'GET' });

      let state1: RequestState<unknown, unknown> | undefined;
      function _getRequestState(p: Future<unknown>): RequestState<unknown, unknown> {
        state1 = getRequestState(p);
        return state1;
      }
      let counter = 0;
      function countFor(_result: unknown, _error: unknown) {
        return ++counter;
      }

      await this.render({
        request,
        _getRequestState,
        countFor,
      });

      await request;
      await this.h.rerender();

      const result = state1!.result as { user: { name: string } };
      assert.equal(result.user.name, 'Untouched', 'response was passed through unchanged');
      assert.dom().hasText('Count:2');
    })
    .build();
