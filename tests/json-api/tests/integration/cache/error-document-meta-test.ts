import { CacheHandler, Fetch, RequestManager, Store } from '@warp-drive/core';
import { getRequestState } from '@warp-drive/core/reactive';
import type { ReactiveDataDocument, ReactiveErrorDocument } from '@warp-drive/core/reactive';
import type { CacheCapabilitiesManager } from '@warp-drive/core/types';
import type { ApiError } from '@warp-drive/core/types/spec/error';
import { module, test } from '@warp-drive/diagnostic';
import { mock, MockServerHandler } from '@warp-drive/holodeck';
import { JSONAPICache as Cache } from '@warp-drive/json-api';
import { buildBaseURL } from '@warp-drive/utilities';

class TestStore extends Store {
  override createCache(wrapper: CacheCapabilitiesManager) {
    return new Cache(wrapper);
  }
}

interface User {
  id: string;
  name: string;
}

/** What this endpoint returns alongside a successful collection. */
type UserPageMeta = { page: { limit: number; offset: number }; total?: number };

/** What it returns alongside a failure — deliberately a different shape. */
type UserErrorMeta = { requestId: string };

type UsersDocument = ReactiveDataDocument<User[], UserPageMeta, ApiError, UserErrorMeta>;
type UsersErrorDocument = ReactiveErrorDocument<User[], UserPageMeta, ApiError, UserErrorMeta>;

/** `true` when `A` and `B` are mutually assignable, `false` otherwise. */
type Exact<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

/** Errors on anything but `true`, turning a failed {@link Exact} into a type error. */
type MustBeTrue<T extends true> = T;

/**
 * `EM` reaches the error arm's `meta` while `M` stays on the data arm's, and
 * omitting `EM` leaves both sharing `M` — the behavior before it existed.
 */
type ErrorMetaIsSeparatelyTypeable = [
  MustBeTrue<Exact<UsersDocument['meta'], UserPageMeta | undefined>>,
  MustBeTrue<Exact<UsersErrorDocument['meta'], UserErrorMeta | undefined>>,
  MustBeTrue<Exact<ReactiveErrorDocument<User[], UserPageMeta, ApiError>['meta'], UserPageMeta | undefined>>,
];

const EXPECTED = [true, true, true] as const;

module('Integration | @warp-drive/json-api | error document meta', function () {
  test('an error response carries its own meta, typed by the `EM` param', async function (assert) {
    const assertions: ErrorMetaIsSeparatelyTypeable = [...EXPECTED];
    assert.deepEqual(assertions, [...EXPECTED], '`EM` reaches the error arm and defaults to `M`');

    const manager = new RequestManager();
    const store = new TestStore();

    manager.use([new MockServerHandler(this), Fetch]);
    manager.useCache(CacheHandler);
    store.requestManager = manager;

    await mock(this, () => ({
      url: 'users',
      status: 422,
      headers: {},
      method: 'GET',
      statusText: 'Unprocessable Entity',
      body: null,
      response: {
        errors: [
          {
            status: '422',
            title: 'Invalid Query Parameter',
            detail: 'The resource does not have a `nickname` attribute.',
            source: { parameter: 'sort' },
          },
        ],
        meta: { requestId: 'req-8f21c3' },
      },
    }));

    const url = buildBaseURL({ resourcePath: 'users' });
    const future = store.request<UsersDocument>({ url });
    const state = getRequestState<UsersDocument, UsersErrorDocument>(future);

    try {
      await future;
      assert.ok(false, 'the request should have rejected');
    } catch {
      // the rejection is the documented path; `state` is the typed one
    }

    assert.true(state.isError, 'the request state is errored');

    if (state.isError) {
      const content = state.reason.content;

      // `meta` survives onto the error document, and is typed by `EM`
      assert.equal(content?.meta?.requestId, 'req-8f21c3', 'the error meta is present and typed');

      // `errors` is typed by `E` on the same document
      assert.equal(content?.errors[0]?.status, '422', 'status is the {json:api} string, not a number');
      assert.equal(content?.errors[0]?.source?.parameter, 'sort', 'source.parameter is reachable without a pointer');
    }
  });
});
