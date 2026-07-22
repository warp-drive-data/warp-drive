import { Fetch, RequestManager } from '@warp-drive/core';
import type { CacheHandler, Future, NextFn } from '@warp-drive/core/request';
import type { RequestContext, StructuredDataDocument } from '@warp-drive/core/types/request';
import type { RenderingTestContext } from '@warp-drive/diagnostic/ember';
import { module, setupRenderingTest, test as _test } from '@warp-drive/diagnostic/ember';
import { getPaginationCache } from '@warp-drive/ember';
import { MockServerHandler } from '@warp-drive/holodeck';
import { GET } from '@warp-drive/holodeck/mock';
import { buildBaseURL } from '@warp-drive/utilities';

type PaginationCache<T, RT, E> = ReturnType<typeof getPaginationCache<RT, T, E>>;
type UserResource = {
  data: {
    id: string;
    type: 'user';
    attributes: {
      name: string;
    };
  };
};

type PaginatedUserResource = {
  data: Array<UserResource['data']>;
  links?: {
    next?: string;
    prev?: string;
    first?: string;
    last?: string;
  };
  meta?: {
    total: number;
    page: number;
    size: number;
  };
};

interface LocalTestContext extends RenderingTestContext {
  manager: RequestManager;
}
type DiagnosticTest = Parameters<typeof _test<LocalTestContext>>[1];
function test(name: string, callback: DiagnosticTest): void {
  return _test<LocalTestContext>(name, callback);
}

class SimpleCacheHandler implements CacheHandler {
  _cache: Map<string, unknown> = new Map();
  request<T = unknown>(
    context: RequestContext,
    next: NextFn<T>
  ): T | Promise<T | StructuredDataDocument<T>> | Future<T> {
    const { url, method, cacheOptions } = context.request;
    if (url && method === 'GET' && this._cache.has(url) && cacheOptions?.reload !== true) {
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

const users = [
  {
    id: '1',
    type: 'user',
    attributes: {
      name: 'User 1',
    },
  },
  {
    id: '2',
    type: 'user',
    attributes: {
      name: 'User 2',
    },
  },
  {
    id: '3',
    type: 'user',
    attributes: {
      name: 'User 3',
    },
  },
  {
    id: '4',
    type: 'user',
    attributes: {
      name: 'User 4',
    },
  },
  {
    id: '5',
    type: 'user',
    attributes: {
      name: 'User 5',
    },
  },
  {
    id: '6',
    type: 'user',
    attributes: {
      name: 'User 6',
    },
  },
  {
    id: '7',
    type: 'user',
    attributes: {
      name: 'User 7',
    },
  },
  {
    id: '8',
    type: 'user',
    attributes: {
      name: 'User 8',
    },
  },
  {
    id: '9',
    type: 'user',
    attributes: {
      name: 'User 9',
    },
  },
  {
    id: '10',
    type: 'user',
    attributes: {
      name: 'User 10',
    },
  },
];

async function mockGETSuccess(context: LocalTestContext): Promise<string> {
  const url = buildBaseURL({ resourcePath: 'users/1' });

  await GET(context, 'users/1', () => ({
    data: users.slice(0, 10),
    links: {
      prev: null,
      self: url,
      next: null,
    },
  }));

  return url;
}

async function mockPaginatedGETFailure(context: LocalTestContext): Promise<string> {
  const url = buildBaseURL({ resourcePath: 'users/1' });

  await GET(
    context,
    'users/1',
    () => ({
      errors: [
        {
          status: '404',
          title: 'Not Found',
          detail: 'Page not found.',
        },
      ],
      links: {
        self: url,
      },
    }),
    {
      status: 404,
      statusText: 'Not Found',
    }
  );

  return url;
}

module<LocalTestContext>('Integration | get-pagination-cache', function (hooks) {
  setupRenderingTest(hooks);

  hooks.beforeEach(function () {
    const manager = new RequestManager();
    manager.use([new MockServerHandler(this), Fetch]);
    manager.useCache(new SimpleCacheHandler());

    this.manager = manager;
  });

  test('It returns a pagination state that updates on success', async function (assert) {
    const url = await mockGETSuccess(this);

    const request = this.manager.request<PaginatedUserResource>({ url, method: 'GET' });
    const paginationCache = getPaginationCache(request);

    // Initial state checks
    assert.true(paginationCache.isLoading, 'The pagination state is loading');
    assert.false(paginationCache.isSuccess, 'The pagination state is not successful');
    assert.false(paginationCache.isError, 'The pagination state is not an error');
    assert.equal(Array.from(paginationCache.data).length, 0, 'No data loaded yet');

    await request;

    // After completion state checks
    assert.true(paginationCache.isSuccess, 'The pagination state is successful');
    assert.false(paginationCache.isLoading, 'The pagination state is no longer loading');
    assert.false(paginationCache.isError, 'The pagination state is not an error');
    assert.equal(Array.from(paginationCache.data).length, 10, 'Data contains 10 items');
    assert.equal(Array.from(paginationCache.pages).length, 1, '1 page exist after load');
  });

  test('It returns a pagination state that manages pages correctly', async function (assert) {
    const url = await mockGETSuccess(this);

    const request = this.manager.request<PaginatedUserResource>({ url, method: 'GET' });
    const paginationCache: PaginationCache = getPaginationCache(request);

    await request;

    assert.equal(paginationCache.initialPage, paginationCache.activePage, 'Initial page is the active page');
    assert.ok(paginationCache.initialPage.isSuccess, 'Initial page is successful');
    assert.notOk(paginationCache.initialPage.isLoading, 'Initial page is not loading');
    assert.notOk(paginationCache.initialPage.isError, 'Initial page is not an error');
  });

  test('It returns a pagination state that updates on failure', async function (assert) {
    const url = await mockPaginatedGETFailure(this);
    const request = this.manager.request<PaginatedUserResource>({ url, method: 'GET' });
    const paginationCache = getPaginationCache(request);

    assert.true(paginationCache.isLoading, 'The pagination state is loading');
    assert.false(paginationCache.isSuccess, 'The pagination state is not successful');
    assert.false(paginationCache.isError, 'The pagination state is not an error');
    assert.equal(Array.from(paginationCache.pages).length, 1, 'Initial page exists');
    assert.equal(Array.from(paginationCache.data).length, 0, 'No data loaded yet');

    try {
      await request;
    } catch {
      // ignoring error
    }

    assert.false(paginationCache.isSuccess, 'The pagination state is not successful');
    assert.false(paginationCache.isLoading, 'The pagination state is no longer loading');
    assert.true(paginationCache.isError, 'The pagination state is an error');
    assert.equal(Array.from(paginationCache.pages).length, 1, 'Page still exists after error');
    assert.equal(Array.from(paginationCache.data).length, 0, 'No data after error');
    assert.true(paginationCache.initialPage.isError, 'Initial page is in error state');
  });

  test('It handles next page navigation correctly', async function (assert) {
    const url1 = buildBaseURL({ resourcePath: 'users/1' });
    const url2 = buildBaseURL({ resourcePath: 'users/2' });

    await GET(this, 'users/1', () => ({
      data: users.slice(0, 3),
      links: {
        prev: null,
        self: url1,
        next: url2,
      },
    }));

    await GET(this, 'users/2', () => ({
      data: users.slice(3, 6),
      links: {
        prev: url1,
        self: url2,
        next: null,
      },
    }));

    const request = this.manager.request<PaginatedUserResource>({ url: url1, method: 'GET' });
    const paginationCache = getPaginationCache(request);

    await request;

    assert.equal(Array.from(paginationCache.pages).length, 2, '2 pages loaded');
    assert.equal(Array.from(paginationCache.data).length, 3, '3 items loaded');

    const activePage = paginationCache.activePage;
    const nextLink = activePage.nextLink;
    assert.ok(nextLink, 'Next link exists');

    const nextPageCache = paginationCache.getPageCache(nextLink);
    assert.ok(nextPageCache, 'Next page state can be created');

    const nextRequest = this.manager.request<PaginatedUserResource>({ url: nextLink, method: 'GET' });
    const nextPage = nextPageCache.load(nextRequest);

    paginationCache.activatePage(nextPageCache);

    await nextPage;

    // After loading next page
    assert.equal(Array.from(paginationCache.pages).length, 2, '2 pages are loaded');
    assert.equal(Array.from(paginationCache.data).length, 6, '6 items loaded');
    assert.true(paginationCache.isSuccess, 'Still in success state');
    assert.false(paginationCache.isLoading, 'Not in loading state');
    assert.false(paginationCache.isError, 'Not in error state');
  });

  test('It handles pagination when no next page exists', async function (assert) {
    const url = await mockGETSuccess(this);

    const request = this.manager.request<PaginatedUserResource>({ url, method: 'GET' });
    const paginationCache = getPaginationCache(request);

    await request;

    const activePage = paginationCache.activePage;
    assert.equal(activePage.nextLink, null, 'Has no next link when on last page');
    assert.equal(activePage.next, null, 'Has no next page state when on last page');

    const hasNextPage = Boolean(activePage.nextLink);
    assert.false(hasNextPage, 'Has no next page available when on last page');
  });

  test('It returns correct navigation helpers', async function (assert) {
    const url = buildBaseURL({ resourcePath: 'users/2' });

    await GET(this, 'users/2', () => ({
      data: users.slice(3, 3),
      links: {
        prev: buildBaseURL({ resourcePath: 'users/1' }),
        self: url,
        next: buildBaseURL({ resourcePath: 'users/3' }),
      },
    }));

    await GET(this, 'users/1', () => ({
      data: users.slice(0, 3),
      links: {
        prev: null,
        self: buildBaseURL({ resourcePath: 'users/1' }),
        next: url,
      },
    }));

    await GET(this, 'users/3', () => ({
      data: users.slice(6, 3),
      links: {
        prev: url,
        self: buildBaseURL({ resourcePath: 'users/3' }),
        next: null,
      },
    }));

    const request = this.manager.request<PaginatedUserResource>({ url, method: 'GET' });
    const paginationCache = getPaginationCache(request);

    await request;

    const activePage = paginationCache.activePage;
    assert.ok(activePage.nextLink, 'Has next link when not on last page');
    assert.ok(activePage.prevLink, 'Has prev link when not on first page');

    const prevLink = activePage.prevLink;
    const prevPageCache = paginationCache.getPageCache(prevLink);
    const prevRequest = this.manager.request<PaginatedUserResource>({ url: prevLink, method: 'GET' });
    const prevPage = prevPageCache.load(prevRequest);

    const nextLink = activePage.nextLink;
    const nextPageCache = paginationCache.getPageCache(nextLink);
    const nextReq = this.manager.request<PaginatedUserResource>({ url: nextLink, method: 'GET' });
    const nextPage = nextPageCache.load(nextReq);

    assert.ok(paginationCache.prevRequest, 'Has prev request when not on first page');
    assert.ok(prevPage, 'Prev page');
    assert.ok(paginationCache.nextRequest, 'Has next request when not on last page');
    assert.ok(nextPage, 'Next page');
  });

  test('It handles abort correctly', async function (assert) {
    const url = await mockGETSuccess(this);

    const request = this.manager.request<PaginatedUserResource>({ url, method: 'GET' });
    const paginationCache = getPaginationCache(request);

    assert.true(paginationCache.isLoading, 'The pagination state is loading');
    assert.false(paginationCache.isSuccess, 'The pagination state is not successful');
    assert.false(paginationCache.isError, 'The pagination state is not an error');

    request.abort();

    try {
      await request;
    } catch {
      // ignore error
    }

    // After abort state checks
    assert.false(paginationCache.isSuccess, 'The pagination state is not successful');
    assert.false(paginationCache.isLoading, 'The pagination state is no longer loading');
    assert.true(paginationCache.isError, 'The pagination state is an error');
    assert.equal(Array.from(paginationCache.pages).length, 1, 'Page still exists after abort');
    assert.equal(Array.from(paginationCache.data).length, 0, 'No data after abort');
  });
});
