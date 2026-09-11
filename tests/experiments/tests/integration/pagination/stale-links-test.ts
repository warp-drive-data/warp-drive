import { Fetch, RequestManager } from '@warp-drive/core';
import type { CacheHandler, Future, NextFn } from '@warp-drive/core/request';
import type { RequestContext, StructuredDataDocument } from '@warp-drive/core/types/request';
import type { CollectionResourceDataDocument } from '@warp-drive/core/types/spec/document';
import { module, test } from '@warp-drive/diagnostic';
import { clearPaginationCache, getPaginationState } from '@warp-drive/experiments/pagination';
import { MockServerHandler } from '@warp-drive/holodeck';
import { GET } from '@warp-drive/holodeck/mock';
import { buildBaseURL } from '@warp-drive/utilities';

type UserResource = {
  id: string;
  type: 'user';
  attributes: {
    name: string;
  };
};

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

module('Integration | Pagination | stale links', function (hooks) {
  hooks.beforeEach(function () {
    clearPaginationCache();
  });

  test('re-adopting a refreshed page clears a stale next link', async function (assert) {
    const manager = new RequestManager();
    manager.use([new MockServerHandler(this), Fetch]);
    manager.useCache(new SimpleCacheHandler());

    const url1 = buildBaseURL({ resourcePath: 'users/1' });
    const url2 = buildBaseURL({ resourcePath: 'users/2' });

    await GET(this, 'users/1', () => ({
      data: [{ id: '1', type: 'user', attributes: { name: 'Chris Thoburn' } }],
      links: {
        self: url1,
        next: url2,
      },
    }));

    await GET(this, 'users/1', () => ({
      data: [{ id: '1', type: 'user', attributes: { name: 'Chris Thoburn' } }],
      links: {
        self: url1,
        next: null,
      },
    }));

    await GET(this, 'users/2', () => ({
      data: [{ id: '2', type: 'user', attributes: { name: 'Leo Euclides' } }],
      links: {
        prev: url1,
        self: url2,
      },
    }));

    const request = manager.request<CollectionResourceDataDocument<UserResource>>({ url: url1, method: 'GET' });
    const paginationState = getPaginationState(request);

    await request;
    // Allow PageCache to process the resolved request and install its pagination links.
    await Promise.resolve();

    assert.true(paginationState.hasNext, 'the initial response exposes a next page');

    const reloadRequest = manager.request<CollectionResourceDataDocument<UserResource>>({
      url: url1,
      method: 'GET',
      cacheOptions: { reload: true },
    });

    await paginationState.adoptPage(reloadRequest);

    assert.false(paginationState.hasNext, 'the refreshed page clears the stale forward frontier');

    const result = await paginationState.loadNext();

    assert.equal(result, null, 'loadNext does not follow the stale next link');
    assert.equal(Array.from(paginationState.pages).length, 1, 'the frontier still contains exactly one page');
  });

  test('re-adopting a refreshed page clears a stale prev link', async function (assert) {
    const manager = new RequestManager();
    manager.use([new MockServerHandler(this), Fetch]);
    manager.useCache(new SimpleCacheHandler());

    const url1 = buildBaseURL({ resourcePath: 'users/1' });
    const url2 = buildBaseURL({ resourcePath: 'users/2' });

    await GET(this, 'users/1', () => ({
      data: [{ id: '1', type: 'user', attributes: { name: 'Chris Thoburn' } }],
      links: {
        self: url1,
        next: url2,
      },
    }));

    await GET(this, 'users/2', () => ({
      data: [{ id: '2', type: 'user', attributes: { name: 'Leo Euclides' } }],
      links: {
        prev: url1,
        self: url2,
      },
    }));

    await GET(this, 'users/2', () => ({
      data: [{ id: '2', type: 'user', attributes: { name: 'Leo Euclides' } }],
      links: {
        prev: null,
        self: url2,
      },
    }));

    const request = manager.request<CollectionResourceDataDocument<UserResource>>({ url: url2, method: 'GET' });
    const paginationState = getPaginationState(request);

    await request;
    // Allow PageCache to process the resolved request and install its pagination links.
    await Promise.resolve();

    assert.true(paginationState.hasPrevious, 'the initial response exposes a previous page');

    const reloadRequest = manager.request<CollectionResourceDataDocument<UserResource>>({
      url: url2,
      method: 'GET',
      cacheOptions: { reload: true },
    });

    await paginationState.adoptPage(reloadRequest);

    assert.false(paginationState.hasPrevious, 'the refreshed page clears the stale backward frontier');

    const result = await paginationState.loadPrev();

    assert.equal(result, null, 'loadPrev does not follow the stale prev link');
    assert.equal(Array.from(paginationState.pages).length, 1, 'the frontier still contains exactly one page');
  });
});
