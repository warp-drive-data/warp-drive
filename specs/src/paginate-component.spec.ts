import { Fetch, RequestManager } from '@warp-drive/core';
import { PRODUCTION } from '@warp-drive/core/build-config/env';
import {
  clearPaginationCache,
  getPaginationCache,
  getPaginationLinks,
  getPaginationState,
  type PageHints,
} from '@warp-drive/core/reactive';
import type { CacheHandler, Future, NextFn } from '@warp-drive/core/request';
import { signal } from '@warp-drive/core/signals/-leaked';
import type { RequestContext, StructuredDataDocument } from '@warp-drive/core/types/request';
import type { CollectionResourceDataDocument } from '@warp-drive/core/types/spec/document';
import { setupOnError } from '@warp-drive/diagnostic';
import { spec, type SpecTest, type SuiteBuilder } from '@warp-drive/diagnostic/spec';
import { mock, MockServerHandler } from '@warp-drive/holodeck';
import { GET } from '@warp-drive/holodeck/mock';
import { buildBaseURL } from '@warp-drive/utilities';

// our tests use a rendering test context and add manager to it
interface LocalTestContext {
  manager: RequestManager;
}

type UserResource = {
  id: string;
  type: 'user';
  attributes: {
    name: string;
  };
};

type CollectionRequest = Future<CollectionResourceDataDocument<UserResource>>;

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
      name: 'Chris Thoburn',
    },
  },
  {
    id: '2',
    type: 'user',
    attributes: {
      name: 'Leo Euclides',
    },
  },
  {
    id: '3',
    type: 'user',
    attributes: {
      name: 'Mehul Chaudhari',
    },
  },
  {
    id: '4',
    type: 'user',
    attributes: {
      name: 'Benedikt Deicke',
    },
  },
  {
    id: '5',
    type: 'user',
    attributes: {
      name: 'Jane Portman',
    },
  },
  {
    id: '6',
    type: 'user',
    attributes: {
      name: 'Mia Sinek',
    },
  },
];

function twoPageURLs(): [string, string] {
  return [buildBaseURL({ resourcePath: 'users/1' }), buildBaseURL({ resourcePath: 'users/2' })];
}

async function mockFirstPageSuccess(context: LocalTestContext): Promise<void> {
  const urls = twoPageURLs();
  await GET(context, 'users/1', () => ({
    data: [users[0]],
    links: {
      first: urls[0],
      prev: null,
      self: urls[0],
      next: urls[1],
      last: urls[1],
    },
    meta: {
      currentPage: 1,
      totalPages: 2,
    },
  }));
}

async function mockSecondPageSuccess(context: LocalTestContext): Promise<void> {
  const urls = twoPageURLs();
  await GET(context, 'users/2', () => ({
    data: [users[1]],
    links: {
      first: urls[0],
      prev: urls[0],
      self: urls[1],
      next: null,
      last: urls[1],
    },
    meta: {
      currentPage: 2,
      totalPages: 2,
    },
  }));
}

async function mockPageFailure(context: LocalTestContext, path: 'users/1' | 'users/2'): Promise<string> {
  const url = buildBaseURL({ resourcePath: path });
  await mock(context, () => ({
    url: path,
    status: 404,
    headers: {},
    method: 'GET',
    statusText: 'Not Found',
    body: null,
    response: {
      errors: [
        {
          status: '404',
          title: 'Not Found',
          detail: 'The resource does not exist.',
        },
      ],
    },
  }));

  return url;
}

export interface PaginateSpecSignature extends Record<string, SpecTest<LocalTestContext, object>> {
  'it handles paged pagination with complete data': SpecTest<
    LocalTestContext,
    {
      store: RequestManager;
      request: CollectionRequest;
      countFor: (result: unknown) => number;
    }
  >;
  'it handles paged pagination with incomplete data': SpecTest<
    LocalTestContext,
    {
      store: RequestManager;
      request: CollectionRequest;
      countFor: (result: unknown) => number;
    }
  >;
  'multiple paginate components have individual rendering states while sharing cached pages': SpecTest<
    LocalTestContext,
    {
      store: RequestManager;
      requestA: CollectionRequest;
      requestB: CollectionRequest;
      countFor: (result: unknown) => number;
    }
  >;
  'it derives pageNumber and totalPages from a custom pageHints fn': SpecTest<
    LocalTestContext,
    {
      store: RequestManager;
      request: CollectionRequest;
      pageHints: PageHints;
    }
  >;
  'it renders the full link set when entering on a middle page': SpecTest<
    LocalTestContext,
    {
      store: RequestManager;
      request: CollectionRequest;
    }
  >;
  'it supports cursor-based pagination in paged mode (no page numbers or total)': SpecTest<
    LocalTestContext,
    {
      store: RequestManager;
      request: CollectionRequest;
    }
  >;
  'it supports infinite pagination that accumulates loaded pages into a single set': SpecTest<
    LocalTestContext,
    {
      store: RequestManager;
      request: CollectionRequest;
    }
  >;
  'infinite pagination extends backwards from a deep-linked entry page': SpecTest<
    LocalTestContext,
    {
      store: RequestManager;
      request: CollectionRequest;
    }
  >;
  'it renders the default block as a fallback with pagination state and features': SpecTest<
    LocalTestContext,
    {
      store: RequestManager;
      request: CollectionRequest;
    }
  >;
  'it transitions to error state correctly': SpecTest<
    LocalTestContext,
    {
      store: RequestManager;
      request: CollectionRequest;
      countFor: (result: unknown) => number;
    }
  >;
  'we can retry from error state': SpecTest<
    LocalTestContext,
    {
      store: RequestManager;
      request: CollectionRequest;
      countFor: (result: unknown) => number;
      retry: (features: { retry: () => Promise<void> }) => void;
    }
  >;
  'it rethrows if error block is not present': SpecTest<
    LocalTestContext,
    {
      store: RequestManager;
      request: CollectionRequest;
      countFor: (result: unknown) => number;
    }
  >;
  'it transitions to cancelled state correctly': SpecTest<
    LocalTestContext,
    {
      store: RequestManager;
      request: CollectionRequest;
      countFor: (result: unknown) => number;
    }
  >;
  'we can retry from cancelled state': SpecTest<
    LocalTestContext,
    {
      store: RequestManager;
      request: CollectionRequest;
      countFor: (result: unknown) => number;
      retry: (features: { retry: () => Promise<void> }) => void;
    }
  >;
  'it transitions to error state if cancelled block is not present': SpecTest<
    LocalTestContext,
    {
      store: RequestManager;
      request: CollectionRequest;
      countFor: (result: unknown) => number;
    }
  >;
  'it does not rethrow for cancelled': SpecTest<
    LocalTestContext,
    {
      store: RequestManager;
      request: CollectionRequest;
      countFor: (result: unknown) => number;
    }
  >;
  'a failed page load renders the active page error and can be retried': SpecTest<
    LocalTestContext,
    {
      store: RequestManager;
      request: CollectionRequest;
    }
  >;
  'a failed loadNext renders the error and can be retried': SpecTest<
    LocalTestContext,
    {
      store: RequestManager;
      request: CollectionRequest;
    }
  >;
  'a changed @request that resolves to a page of the same collection is adopted as the active page': SpecTest<
    LocalTestContext,
    {
      store: RequestManager;
      source: { request: CollectionRequest };
    }
  >;
  'a changed @request that resolves to a different collection resets the pagination': SpecTest<
    LocalTestContext,
    {
      store: RequestManager;
      source: { request: CollectionRequest };
    }
  >;
  'adoptPage adopts same-collection requests and rejects foreign ones': SpecTest<
    LocalTestContext,
    {
      store: RequestManager;
      request: CollectionRequest;
    }
  >;
}

export const PaginateSpec: SuiteBuilder<LocalTestContext, PaginateSpecSignature> = spec<LocalTestContext>(
  '<Paginate />',
  function (hooks) {
    hooks.beforeEach(function () {
      clearPaginationCache();

      const manager = new RequestManager();
      manager.use([new MockServerHandler(this), Fetch]);
      manager.useCache(new SimpleCacheHandler());

      this.manager = manager;
    });
  }
)
  .for('it handles paged pagination with complete data')
  .use<{ store: RequestManager; request: CollectionRequest; countFor: (result: unknown) => number }>(
    async function (assert) {
      const urls = [
        buildBaseURL({ resourcePath: 'users/1' }),
        buildBaseURL({ resourcePath: 'users/2' }),
        buildBaseURL({ resourcePath: 'users/3' }),
        buildBaseURL({ resourcePath: 'users/4' }),
        buildBaseURL({ resourcePath: 'users/5' }),
        buildBaseURL({ resourcePath: 'users/6' }),
      ];

      await GET(this, 'users/2', () => ({
        data: [users[1]],
        links: {
          first: urls[0],
          prev: urls[0],
          self: urls[1],
          next: urls[2],
          last: urls[5],
        },
        meta: {
          currentPage: 2,
          totalPages: 6,
        },
      }));

      await GET(this, 'users/1', () => ({
        data: [users[0]],
        links: {
          first: urls[0],
          prev: null,
          self: urls[0],
          next: urls[1],
          last: urls[5],
        },
        meta: {
          currentPage: 1,
          totalPages: 6,
        },
      }));

      await GET(this, 'users/6', () => ({
        data: [users[5]],
        links: {
          first: urls[0],
          prev: urls[4],
          self: urls[5],
          next: urls[6],
          last: urls[5],
        },
        meta: {
          currentPage: 6,
          totalPages: 6,
        },
      }));

      await GET(this, 'users/5', () => ({
        data: [users[4]],
        links: {
          first: urls[0],
          prev: urls[3],
          self: urls[4],
          next: urls[5],
          last: urls[5],
        },
        meta: {
          currentPage: 5,
          totalPages: 6,
        },
      }));

      await GET(this, 'users/4', () => ({
        data: [users[3]],
        links: {
          first: urls[0],
          prev: urls[2],
          self: urls[3],
          next: urls[4],
          last: urls[5],
        },
        meta: {
          currentPage: 4,
          totalPages: 6,
        },
      }));

      await GET(this, 'users/3', () => ({
        data: [users[2]],
        links: {
          first: urls[0],
          prev: urls[1],
          self: urls[2],
          next: urls[3],
          last: urls[5],
        },
        meta: {
          currentPage: 3,
          totalPages: 6,
        },
      }));

      const request = this.manager.request<CollectionResourceDataDocument<UserResource>>({
        url: urls[1],
        method: 'GET',
      });
      const paginationState = getPaginationState(request);
      const paginationCache = getPaginationCache<CollectionResourceDataDocument<UserResource>, unknown>(urls[0]);
      const paginationLinks = getPaginationLinks(paginationState);

      let counter = 0;
      function countFor(_result: unknown) {
        return ++counter;
      }

      await this.render({
        store: this.manager,
        request,
        countFor,
      });

      let activePage = null;

      assert.equal(counter, 1);
      assert.equal(this.element.querySelector('[data-test-pending]')?.textContent.trim(), 'PendingCount: 1');
      assert.equal(Array.from(paginationState.data).length, 0, 'No data initially');
      assert.equal(Array.from(paginationCache.pages).length, 0, 'No pages in the graph initially');
      assert.deepEqual(paginationLinks.links.length, 0, '0 links initially');

      await request;
      await this.h.rerender();

      activePage = paginationState.activePage;

      assert.deepEqual(activePage?.data, [users[1]], 'Page data');
      assert.equal(Array.from(paginationCache.pages).length, 4, '4 pages known to the graph after the initial load');
      assert.deepEqual(activePage?.pageNumber, 2, 'Page number');
      assert.deepEqual(paginationState.totalPages, 6, 'Total pages');
      assert.deepEqual(paginationLinks.links.length, 5, '5 links');
      assert.deepEqual(
        paginationLinks.links.map((link) => (link.isReal ? `${link.index}` : '.')),
        ['1', '2', '3', '.', '6'],
        'Link names'
      );
      assert.equal(this.element.querySelectorAll('[data-test-prev]').length, 1, 'Prev link available on page 2');
      assert.equal(this.element.querySelectorAll('[data-test-next]').length, 1, 'Next link available on page 2');
      assert.equal(counter, 2);
      assert.equal(this.element.querySelector('[data-test-user-name]')?.textContent.trim(), 'Leo EuclidesCount: 2');
      assert.equal(this.element.querySelectorAll('[data-test-user-name]').length, 1, '1 user rendered');

      await this.h.click('[data-test-load-page="1"]');
      activePage = paginationState.activePage;
      assert.deepEqual(activePage?.data, [users[0]], 'Page data');
      assert.deepEqual(activePage?.pageNumber, 1, 'Page number');
      assert.deepEqual(paginationState.totalPages, 6, 'Total pages');
      assert.deepEqual(paginationLinks.links.length, 5, '5 links');
      assert.deepEqual(
        paginationLinks.links.map((link) => (link.isReal ? `${link.index}` : '.')),
        ['1', '2', '3', '.', '6'],
        'Link names'
      );
      assert.equal(this.element.querySelectorAll('[data-test-prev]').length, 0, 'No prev link on the first page');
      assert.equal(
        this.element.querySelectorAll('[data-test-next]').length,
        1,
        'Next link available on the first page'
      );
      assert.equal(counter, 4);
      assert.equal(this.element.querySelector('[data-test-user-name]')?.textContent.trim(), 'Chris ThoburnCount: 4');
      assert.equal(this.element.querySelectorAll('[data-test-user-name]').length, 1, '1 user rendered');

      await this.h.click('[data-test-load-page="6"]');
      activePage = paginationState.activePage;
      assert.deepEqual(activePage?.data, [users[5]], 'Page data');
      assert.deepEqual(activePage?.pageNumber, 6, 'Page number');
      assert.deepEqual(paginationState.totalPages, 6, 'Total pages');
      assert.deepEqual(paginationLinks.links.length, 6, '6 links');
      assert.deepEqual(
        paginationLinks.links.map((link) => (link.isReal ? `${link.index}` : '.')),
        ['1', '2', '3', '.', '5', '6'],
        'Link names'
      );
      assert.equal(this.element.querySelectorAll('[data-test-prev]').length, 1, 'Prev link available on the last page');
      assert.equal(this.element.querySelectorAll('[data-test-next]').length, 0, 'No next link on the last page');
      assert.equal(counter, 6);
      assert.equal(this.element.querySelector('[data-test-user-name]')?.textContent.trim(), 'Mia SinekCount: 6');
      assert.equal(this.element.querySelectorAll('[data-test-user-name]').length, 1, '1 user rendered');

      await this.h.click('[data-test-load-page="5"]');
      activePage = paginationState.activePage;
      assert.deepEqual(activePage?.data, [users[4]], 'Page data');
      assert.deepEqual(activePage?.pageNumber, 5, 'Page number');
      assert.deepEqual(paginationState.totalPages, 6, 'Total pages');
      assert.deepEqual(paginationLinks.links.length, 6, '6 links');
      assert.deepEqual(
        paginationLinks.links.map((link) => (link.isReal ? `${link.index}` : '.')),
        ['1', '2', '3', '4', '5', '6'],
        'Link names'
      );
      assert.equal(counter, 8);
      assert.equal(this.element.querySelector('[data-test-user-name]')?.textContent.trim(), 'Jane PortmanCount: 8');
      assert.equal(this.element.querySelectorAll('[data-test-user-name]').length, 1, '1 user rendered');

      await this.h.click('[data-test-load-page="4"]');
      activePage = paginationState.activePage;
      assert.deepEqual(activePage?.data, [users[3]], 'Page data');
      assert.deepEqual(activePage?.pageNumber, 4, 'Page number');
      assert.deepEqual(paginationState.totalPages, 6, 'Total pages');
      assert.deepEqual(paginationLinks.links.length, 6, '6 links');
      assert.deepEqual(
        paginationLinks.links.map((link) => (link.isReal ? `${link.index}` : '.')),
        ['1', '2', '3', '4', '5', '6'],
        'Link names'
      );
      assert.equal(counter, 10);
      assert.equal(this.element.querySelector('[data-test-user-name]')?.textContent.trim(), 'Benedikt DeickeCount: 10');
      assert.equal(this.element.querySelectorAll('[data-test-user-name]').length, 1, '1 user rendered');

      await this.h.click('[data-test-load-page="3"]');
      activePage = paginationState.activePage;
      assert.deepEqual(activePage?.data, [users[2]], 'Page data');
      assert.equal(Array.from(paginationCache.pages).length, 6, 'Whole graph holds all 6 pages after visiting them');
      assert.deepEqual(
        Array.from(paginationCache.data).map((user) => user.attributes.name),
        ['Chris Thoburn', 'Leo Euclides', 'Mehul Chaudhari', 'Benedikt Deicke', 'Jane Portman', 'Mia Sinek'],
        'Whole-graph data holds every loaded page in page order'
      );
      assert.deepEqual(activePage?.pageNumber, 3, 'Page number');
      assert.deepEqual(paginationState.totalPages, 6, 'Total pages');
      assert.deepEqual(paginationLinks.links.length, 6, '6 links');
      assert.deepEqual(
        paginationLinks.links.map((link) => (link.isReal ? `${link.index}` : '.')),
        ['1', '2', '3', '4', '5', '6'],
        'Link names'
      );
      assert.equal(counter, 12);
      assert.equal(this.element.querySelector('[data-test-user-name]')?.textContent.trim(), 'Mehul ChaudhariCount: 12');
      assert.equal(this.element.querySelectorAll('[data-test-user-name]').length, 1, '1 user rendered');

      // The relational next/prev buttons navigate too (currently on page 3).
      await this.h.click('[data-test-next]');
      activePage = paginationState.activePage;
      assert.deepEqual(activePage?.pageNumber, 4, 'Next button advances to page 4');
      assert.deepEqual(activePage?.data, [users[3]], 'Page data after next');
      assert.true(
        Boolean(this.element.querySelector('[data-test-user-name]')?.textContent?.includes('Benedikt Deicke')),
        'Page 4 rendered after next'
      );

      await this.h.click('[data-test-prev]');
      activePage = paginationState.activePage;
      assert.deepEqual(activePage?.pageNumber, 3, 'Prev button returns to page 3');
      assert.deepEqual(activePage?.data, [users[2]], 'Page data after prev');
      assert.true(
        Boolean(this.element.querySelector('[data-test-user-name]')?.textContent?.includes('Mehul Chaudhari')),
        'Page 3 rendered after prev'
      );
    }
  )

  .for('it handles paged pagination with incomplete data')
  .use<{ store: RequestManager; request: CollectionRequest; countFor: (result: unknown) => number }>(
    async function (assert) {
      const urls = [
        buildBaseURL({ resourcePath: 'users/1' }),
        buildBaseURL({ resourcePath: 'users/2' }),
        buildBaseURL({ resourcePath: 'users/3' }),
        buildBaseURL({ resourcePath: 'users/4' }),
        buildBaseURL({ resourcePath: 'users/5' }),
        buildBaseURL({ resourcePath: 'users/6' }),
      ];

      await GET(this, 'users/2', () => ({
        data: [users[1]],
        links: {
          prev: urls[0],
          self: urls[1],
          next: urls[2],
        },
        meta: {
          currentPage: 2,
          totalPages: 6,
        },
      }));

      await GET(this, 'users/1', () => ({
        data: [users[0]],
        links: {
          prev: null,
          self: urls[0],
          next: urls[1],
        },
        meta: {
          currentPage: 1,
          totalPages: 6,
        },
      }));

      await GET(this, 'users/3', () => ({
        data: [users[2]],
        links: {
          prev: urls[1],
          self: urls[2],
          next: urls[3],
        },
        meta: {
          currentPage: 3,
          totalPages: 6,
        },
      }));

      await GET(this, 'users/4', () => ({
        data: [users[3]],
        links: {
          prev: urls[2],
          self: urls[3],
          next: urls[4],
        },
        meta: {
          currentPage: 4,
          totalPages: 6,
        },
      }));

      await GET(this, 'users/5', () => ({
        data: [users[4]],
        links: {
          prev: urls[3],
          self: urls[4],
          next: urls[5],
        },
        meta: {
          currentPage: 5,
          totalPages: 6,
        },
      }));

      await GET(this, 'users/6', () => ({
        data: [users[5]],
        links: {
          prev: urls[4],
          self: urls[5],
          next: urls[6],
        },
        meta: {
          currentPage: 6,
          totalPages: 6,
        },
      }));

      const request = this.manager.request<CollectionResourceDataDocument<UserResource>>({
        url: urls[1],
        method: 'GET',
      });
      // the initial document exposes no `first` link, so the shared cache is
      // keyed by the entry page's `self` link
      const paginationCache = getPaginationCache(urls[1]);
      const paginationState = getPaginationState(request);
      const paginationLinks = getPaginationLinks(paginationState);

      let counter = 0;
      function countFor(_result: unknown) {
        return ++counter;
      }

      await this.render({
        store: this.manager,
        request,
        countFor,
      });

      let activePage = null;

      assert.equal(counter, 1);
      assert.equal(this.element.querySelector('[data-test-pending]')?.textContent.trim(), 'PendingCount: 1');
      assert.equal(Array.from(paginationState.data).length, 0, 'No data initially');
      assert.equal(Array.from(paginationCache.pages).length, 0, 'No pages in the graph initially');
      assert.deepEqual(paginationLinks.links.length, 0, '0 links initially');

      await request;
      await this.h.rerender();

      activePage = paginationState.activePage;

      assert.deepEqual(activePage?.data, [users[1]], 'Page data');
      assert.equal(Array.from(paginationCache.pages).length, 3, '3 pages known to the graph after the initial load');
      assert.deepEqual(activePage?.pageNumber, 2, 'Page number');
      assert.deepEqual(paginationState.totalPages, 6, 'Total pages');
      assert.deepEqual(paginationLinks.links.length, 4, '4 links');
      assert.deepEqual(
        paginationLinks.links.map((link) => (link.isReal ? `${link.index}` : '.')),
        ['1', '2', '3', '.'],
        'Link names'
      );
      assert.equal(counter, 2);
      assert.equal(this.element.querySelector('[data-test-user-name]')?.textContent.trim(), 'Leo EuclidesCount: 2');
      assert.equal(this.element.querySelectorAll('[data-test-user-name]').length, 1, '1 user rendered');

      await this.h.click('[data-test-load-page="1"]');
      activePage = paginationState.activePage;
      assert.deepEqual(activePage?.data, [users[0]], 'Page data');
      assert.deepEqual(activePage?.pageNumber, 1, 'Page number');
      assert.deepEqual(paginationState.totalPages, 6, 'Total pages');
      assert.deepEqual(paginationLinks.links.length, 4, '4 links');
      assert.deepEqual(
        paginationLinks.links.map((link) => (link.isReal ? `${link.index}` : '.')),
        ['1', '2', '3', '.'],
        'Link names'
      );
      assert.equal(counter, 4);
      assert.equal(this.element.querySelector('[data-test-user-name]')?.textContent.trim(), 'Chris ThoburnCount: 4');
      assert.equal(this.element.querySelectorAll('[data-test-user-name]').length, 1, '1 user rendered');

      await this.h.click('[data-test-load-page="3"]');
      activePage = paginationState.activePage;
      assert.deepEqual(activePage?.data, [users[2]], 'Page data');
      assert.deepEqual(activePage?.pageNumber, 3, 'Page number');
      assert.deepEqual(paginationState.totalPages, 6, 'Total pages');
      assert.deepEqual(paginationLinks.links.length, 5, '5 links');
      assert.deepEqual(
        paginationLinks.links.map((link) => (link.isReal ? `${link.index}` : '.')),
        ['1', '2', '3', '4', '.'],
        'Link names'
      );
      assert.equal(counter, 6);
      assert.equal(this.element.querySelector('[data-test-user-name]')?.textContent.trim(), 'Mehul ChaudhariCount: 6');
      assert.equal(this.element.querySelectorAll('[data-test-user-name]').length, 1, '1 user rendered');

      await this.h.click('[data-test-load-page="4"]');
      activePage = paginationState.activePage;
      assert.deepEqual(activePage?.data, [users[3]], 'Page data');
      assert.deepEqual(activePage?.pageNumber, 4, 'Page number');
      assert.deepEqual(paginationState.totalPages, 6, 'Total pages');
      assert.deepEqual(paginationLinks.links.length, 6, '6 links');
      assert.deepEqual(
        paginationLinks.links.map((link) => (link.isReal ? `${link.index}` : '.')),
        ['1', '2', '3', '4', '5', '.'],
        'Link names'
      );
      assert.equal(counter, 8);
      assert.equal(this.element.querySelector('[data-test-user-name]')?.textContent.trim(), 'Benedikt DeickeCount: 8');
      assert.equal(this.element.querySelectorAll('[data-test-user-name]').length, 1, '1 user rendered');

      await this.h.click('[data-test-load-page="5"]');
      activePage = paginationState.activePage;
      assert.deepEqual(activePage?.data, [users[4]], 'Page data');
      assert.deepEqual(activePage?.pageNumber, 5, 'Page number');
      assert.deepEqual(paginationState.totalPages, 6, 'Total pages');
      assert.deepEqual(paginationLinks.links.length, 6, '6 links');
      assert.deepEqual(
        paginationLinks.links.map((link) => (link.isReal ? `${link.index}` : '.')),
        ['1', '2', '3', '4', '5', '6'],
        'Link names'
      );
      assert.equal(counter, 10);
      assert.equal(this.element.querySelector('[data-test-user-name]')?.textContent.trim(), 'Jane PortmanCount: 10');
      assert.equal(this.element.querySelectorAll('[data-test-user-name]').length, 1, '1 user rendered');

      await this.h.click('[data-test-load-page="6"]');
      activePage = paginationState.activePage;
      assert.deepEqual(activePage?.data, [users[5]], 'Page data');
      assert.equal(Array.from(paginationCache.pages).length, 6, 'Whole graph holds all 6 pages after visiting them');
      assert.deepEqual(activePage?.pageNumber, 6, 'Page number');
      assert.deepEqual(paginationState.totalPages, 6, 'Total pages');
      assert.deepEqual(paginationLinks.links.length, 6, '6 links');
      assert.deepEqual(
        paginationLinks.links.map((link) => (link.isReal ? `${link.index}` : '.')),
        ['1', '2', '3', '4', '5', '6'],
        'Link names'
      );
      assert.equal(counter, 12);
      assert.equal(this.element.querySelector('[data-test-user-name]')?.textContent.trim(), 'Mia SinekCount: 12');
      assert.equal(this.element.querySelectorAll('[data-test-user-name]').length, 1, '1 user rendered');
    }
  )

  .for('multiple paginate components have individual rendering states while sharing cached pages')
  .use<{
    store: RequestManager;
    requestA: CollectionRequest;
    requestB: CollectionRequest;
    countFor: (result: unknown) => number;
  }>(async function (assert) {
    const urls = [
      buildBaseURL({ resourcePath: 'users/1' }),
      buildBaseURL({ resourcePath: 'users/2' }),
      buildBaseURL({ resourcePath: 'users/3' }),
      buildBaseURL({ resourcePath: 'users/4' }),
      buildBaseURL({ resourcePath: 'users/5' }),
      buildBaseURL({ resourcePath: 'users/6' }),
    ];

    await GET(this, 'users/2', () => ({
      data: [users[1]],
      links: {
        first: urls[0],
        prev: urls[0],
        self: urls[1],
        next: urls[2],
        last: urls[5],
      },
      meta: {
        currentPage: 2,
        totalPages: 6,
      },
    }));

    await GET(this, 'users/5', () => ({
      data: [users[4]],
      links: {
        first: urls[0],
        prev: urls[3],
        self: urls[4],
        next: urls[5],
        last: urls[5],
      },
      meta: {
        currentPage: 5,
        totalPages: 6,
      },
    }));

    await GET(this, 'users/1', () => ({
      data: [users[0]],
      links: {
        first: urls[0],
        prev: null,
        self: urls[0],
        next: urls[1],
        last: urls[5],
      },
      meta: {
        currentPage: 1,
        totalPages: 6,
      },
    }));

    await GET(this, 'users/6', () => ({
      data: [users[5]],
      links: {
        first: urls[0],
        prev: urls[4],
        self: urls[5],
        next: urls[6],
        last: urls[5],
      },
      meta: {
        currentPage: 6,
        totalPages: 6,
      },
    }));

    await GET(this, 'users/4', () => ({
      data: [users[3]],
      links: {
        first: urls[0],
        prev: urls[2],
        self: urls[3],
        next: urls[4],
        last: urls[5],
      },
      meta: {
        currentPage: 4,
        totalPages: 6,
      },
    }));

    await GET(this, 'users/3', () => ({
      data: [users[2]],
      links: {
        first: urls[0],
        prev: urls[1],
        self: urls[2],
        next: urls[3],
        last: urls[5],
      },
      meta: {
        currentPage: 3,
        totalPages: 6,
      },
    }));

    const requestA = this.manager.request<CollectionResourceDataDocument<UserResource>>({
      url: urls[1],
      method: 'GET',
    });
    const requestB = this.manager.request<CollectionResourceDataDocument<UserResource>>({
      url: urls[4],
      method: 'GET',
    });
    // Each request gets its own PaginationState (individual active page /
    // rendering state) while both share the underlying pagination cache.
    const paginationStateA = getPaginationState(requestA);
    const paginationStateB = getPaginationState(requestB);
    const paginationCache = getPaginationCache(urls[0]);
    const paginationLinksA = getPaginationLinks(paginationStateA);

    let counter = 0;
    function countFor(_result: unknown) {
      return ++counter;
    }

    await this.render({
      store: this.manager,
      requestA,
      requestB,
      countFor,
    });

    let activePageA = null;
    let activePageB = null;

    assert.equal(counter, 2);
    assert.equal(this.element.querySelector('[data-test-pending]')?.textContent.trim(), 'PendingCount: 1');
    assert.equal(Array.from(paginationStateA.data).length, 0, 'No data initially');
    assert.equal(Array.from(paginationCache.pages).length, 0, 'No pages in the graph initially');
    assert.deepEqual(paginationLinksA.links.length, 0, '0 links initially');

    await requestA;
    await requestB;
    await this.h.rerender();

    activePageA = paginationStateA.activePage;
    activePageB = paginationStateB.activePage;

    assert.deepEqual(activePageA?.data, [users[1]], 'Page data');
    assert.deepEqual(activePageA?.pageNumber, 2, 'Page number');
    assert.deepEqual(activePageB?.data, [users[4]], 'Page data');
    assert.equal(Array.from(paginationCache.pages).length, 6, 'Whole graph holds all 6 pages after both initial loads');
    assert.deepEqual(activePageB?.pageNumber, 5, 'Page number');
    assert.deepEqual(paginationStateA.totalPages, 6, 'Total pages');
    assert.deepEqual(paginationLinksA.links.length, 6, '6 links');
    assert.deepEqual(
      paginationLinksA.links.map((link) => (link.isReal ? `${link.index}` : '.')),
      ['1', '2', '3', '4', '5', '6'],
      'Link names'
    );
    assert.equal(counter, 4);
    assert.equal(
      this.element.querySelector('[data-test-pagination="a"] [data-test-user-name]')?.textContent.trim(),
      'Leo EuclidesCount: 3'
    );
    assert.equal(
      this.element.querySelectorAll('[data-test-pagination="a"] [data-test-user-name]').length,
      1,
      '1 user rendered'
    );
    assert.equal(
      this.element.querySelector('[data-test-pagination="b"] [data-test-user-name]')?.textContent.trim(),
      'Jane PortmanCount: 4'
    );
    assert.equal(
      this.element.querySelectorAll('[data-test-pagination="b"] [data-test-user-name]').length,
      1,
      '1 user rendered'
    );

    await this.h.click('[data-test-paginate="a"] [data-test-load-page="1"]');
    activePageA = paginationStateA.activePage;
    assert.deepEqual(activePageA?.data, [users[0]], 'Page data');
    assert.deepEqual(activePageA?.pageNumber, 1, 'Page number');
    assert.deepEqual(paginationLinksA.links.length, 6, '6 links');
    assert.equal(counter, 6);
    assert.equal(
      this.element.querySelector('[data-test-pagination="a"] [data-test-user-name]')?.textContent.trim(),
      'Chris ThoburnCount: 6'
    );
    assert.equal(
      this.element.querySelector('[data-test-pagination="b"] [data-test-user-name]')?.textContent.trim(),
      'Jane PortmanCount: 4',
      'Component B did not re-render'
    );

    await this.h.click('[data-test-paginate="b"] [data-test-load-page="6"]');
    activePageB = paginationStateB.activePage;
    assert.deepEqual(activePageB?.data, [users[5]], 'Page data');
    assert.deepEqual(activePageB?.pageNumber, 6, 'Page number');
    assert.deepEqual(paginationLinksA.links.length, 6, '6 links');
    assert.equal(counter, 8);
    assert.equal(
      this.element.querySelector('[data-test-pagination="a"] [data-test-user-name]')?.textContent.trim(),
      'Chris ThoburnCount: 6',
      'Component A did not re-render'
    );
    assert.equal(
      this.element.querySelector('[data-test-pagination="b"] [data-test-user-name]')?.textContent.trim(),
      'Mia SinekCount: 8'
    );

    await this.h.click('[data-test-paginate="a"] [data-test-load-page="4"]');
    activePageA = paginationStateA.activePage;
    assert.deepEqual(activePageA?.data, [users[3]], 'Page data');
    assert.equal(Array.from(paginationCache.pages).length, 6, 'Whole graph still holds all 6 pages');
    assert.deepEqual(activePageA?.pageNumber, 4, 'Page number');
    assert.deepEqual(paginationLinksA.links.length, 6, '6 links');
    assert.equal(counter, 10);
    assert.equal(
      this.element.querySelector('[data-test-pagination="a"] [data-test-user-name]')?.textContent.trim(),
      'Benedikt DeickeCount: 10'
    );
    assert.equal(
      this.element.querySelector('[data-test-pagination="b"] [data-test-user-name]')?.textContent.trim(),
      'Mia SinekCount: 8',
      'Component B did not re-render'
    );

    await this.h.click('[data-test-paginate="b"] [data-test-load-page="3"]');
    activePageB = paginationStateB.activePage;
    assert.deepEqual(activePageB?.data, [users[2]], 'Page data');
    assert.deepEqual(activePageB?.pageNumber, 3, 'Page number');
    assert.deepEqual(paginationLinksA.links.length, 6, '6 links');
    assert.equal(counter, 12);
    assert.equal(
      this.element.querySelector('[data-test-pagination="a"] [data-test-user-name]')?.textContent.trim(),
      'Benedikt DeickeCount: 10',
      'Component A did not re-render'
    );
    assert.equal(
      this.element.querySelector('[data-test-pagination="b"] [data-test-user-name]')?.textContent.trim(),
      'Mehul ChaudhariCount: 12'
    );
  })

  .for('it derives pageNumber and totalPages from a custom pageHints fn')
  .use<{ store: RequestManager; request: CollectionRequest; pageHints: PageHints }>(async function (assert) {
    const urls = [
      buildBaseURL({ resourcePath: 'users/1' }),
      buildBaseURL({ resourcePath: 'users/2' }),
      buildBaseURL({ resourcePath: 'users/3' }),
    ];

    await GET(this, 'users/2', () => ({
      data: [users[1]],
      links: {
        first: urls[0],
        prev: urls[0],
        self: urls[1],
        next: urls[2],
        last: urls[2],
      },
      meta: {
        pageInfo: { index: 2, count: 3 },
      },
    }));

    await GET(this, 'users/1', () => ({
      data: [users[0]],
      links: {
        first: urls[0],
        prev: null,
        self: urls[0],
        next: urls[1],
        last: urls[2],
      },
      meta: {
        pageInfo: { index: 1, count: 3 },
      },
    }));

    await GET(this, 'users/3', () => ({
      data: [users[2]],
      links: {
        first: urls[0],
        prev: urls[1],
        self: urls[2],
        next: urls[3],
        last: urls[2],
      },
      meta: {
        pageInfo: { index: 3, count: 3 },
      },
    }));

    const pageHints: PageHints = (result) => {
      const meta = result.meta as { pageInfo?: { index: number; count: number } } | undefined;
      return { currentPage: meta?.pageInfo?.index ?? 0, totalPages: meta?.pageInfo?.count ?? 0 };
    };

    const request = this.manager.request<CollectionResourceDataDocument<UserResource>>({ url: urls[1], method: 'GET' });
    const paginationState = getPaginationState(request, pageHints);
    const paginationLinks = getPaginationLinks(paginationState);

    await this.render({
      store: this.manager,
      request,
      pageHints,
    });

    await request;
    await this.h.rerender();

    let activePage = paginationState.activePage;

    assert.deepEqual(activePage?.pageNumber, 2, 'Active page number derived from pageHints');
    assert.deepEqual(paginationState.totalPages, 3, 'Total pages derived from pageHints');
    assert.deepEqual(activePage?.data, [users[1]], 'Page data');
    assert.deepEqual(paginationLinks.links.length, 3, '3 links');
    assert.deepEqual(
      paginationLinks.links.map((link) => (link.isReal ? `${link.index}` : '.')),
      ['1', '2', '3'],
      'Link names'
    );
    assert.equal(this.element.querySelector('[data-test-user-name]')?.textContent.trim(), 'Leo Euclides');

    await this.h.click('[data-test-load-page="1"]');
    activePage = paginationState.activePage;
    assert.deepEqual(activePage?.pageNumber, 1, 'Clicked page number derived from pageHints');
    assert.deepEqual(activePage?.data, [users[0]], 'Page data after navigation');
    assert.deepEqual(paginationState.totalPages, 3, 'Total pages still derived from pageHints');
    assert.equal(this.element.querySelector('[data-test-user-name]')?.textContent.trim(), 'Chris Thoburn');
  })

  .for('it renders the full link set when entering on a middle page')
  .use<{ store: RequestManager; request: CollectionRequest }>(async function (assert) {
    const urls = [
      buildBaseURL({ resourcePath: 'users/1' }),
      buildBaseURL({ resourcePath: 'users/4' }),
      buildBaseURL({ resourcePath: 'users/5' }),
      buildBaseURL({ resourcePath: 'users/6' }),
      buildBaseURL({ resourcePath: 'users/10' }),
    ];

    await GET(this, 'users/5', () => ({
      data: [users[4]],
      links: {
        first: urls[0],
        prev: urls[1],
        self: urls[2],
        next: urls[3],
        last: urls[4],
      },
      meta: {
        currentPage: 5,
        totalPages: 10,
      },
    }));

    const request = this.manager.request<CollectionResourceDataDocument<UserResource>>({ url: urls[2], method: 'GET' });
    const paginationState = getPaginationState(request);
    const paginationLinks = getPaginationLinks(paginationState);

    await this.render({
      store: this.manager,
      request,
    });

    await request;
    await this.h.rerender();

    assert.deepEqual(paginationState.activePage?.pageNumber, 5, 'Entry page is the active page');
    assert.deepEqual(paginationState.totalPages, 10, 'Total pages');
    assert.deepEqual(
      paginationLinks.links.map((link) => (link.isReal ? `${link.index}` : '.')),
      ['1', '.', '4', '5', '6', '.', '10'],
      'Full link set renders around the deep-linked entry page'
    );
    assert.deepEqual(
      paginationLinks.links.map((link) => link.distanceFromActiveIndex),
      [4, 2, 1, 0, 1, 2, 5],
      'Each link knows its distance from the active index'
    );
    assert.equal(this.element.querySelectorAll('[data-test-load-page]').length, 5, '5 numbered link buttons');
    assert.equal(this.element.querySelector('[data-test-user-name]')?.textContent.trim(), 'Jane Portman');
  })

  .for('it supports cursor-based pagination in paged mode (no page numbers or total)')
  .use<{ store: RequestManager; request: CollectionRequest }>(async function (assert) {
    const urls = [
      buildBaseURL({ resourcePath: 'users/cursor-start' }),
      buildBaseURL({ resourcePath: 'users/cursor-YWJjZA' }),
      buildBaseURL({ resourcePath: 'users/cursor-ZGVmZw' }),
    ];

    await GET(this, 'users/cursor-start', () => ({
      data: [users[0]],
      links: {
        self: urls[0],
        next: urls[1],
      },
      meta: {
        hasNextPage: true,
        hasPreviousPage: false,
      },
    }));

    await GET(this, 'users/cursor-YWJjZA', () => ({
      data: [users[1]],
      links: {
        prev: urls[0],
        self: urls[1],
        next: urls[2],
      },
      meta: {
        hasNextPage: true,
        hasPreviousPage: true,
      },
    }));

    await GET(this, 'users/cursor-ZGVmZw', () => ({
      data: [users[2]],
      links: {
        prev: urls[1],
        self: urls[2],
      },
      meta: {
        hasNextPage: false,
        hasPreviousPage: true,
      },
    }));

    const request = this.manager.request<CollectionResourceDataDocument<UserResource>>({ url: urls[0], method: 'GET' });
    const paginationState = getPaginationState(request);
    const paginationLinks = getPaginationLinks(paginationState);

    await this.render({
      store: this.manager,
      request,
    });

    await request;
    await this.h.rerender();

    assert.deepEqual(paginationState.activePage?.data, [users[0]], 'Active page is the first cursor page');
    assert.equal(paginationState.totalPages, 0, 'No total is known for a cursor collection');
    assert.equal(this.element.querySelector('[data-test-user-name]')?.textContent.trim(), 'Chris Thoburn');
    assert.equal(this.element.querySelectorAll('[data-test-user-name]').length, 1, '1 user rendered');

    assert.equal(paginationLinks.links.length, 0, 'No numbered links for a cursor collection');
    assert.equal(this.element.querySelectorAll('[data-test-load-page]').length, 0, 'No numbered link buttons');
    assert.equal(this.element.querySelectorAll('[data-test-prev]').length, 0, 'No prev link on the first page');
    assert.equal(this.element.querySelectorAll('[data-test-next]').length, 1, 'Next link available');

    await this.h.click('[data-test-next]');
    await this.h.rerender();

    assert.deepEqual(paginationState.activePage?.data, [users[1]], 'Active page advanced via next cursor');
    assert.equal(this.element.querySelector('[data-test-user-name]')?.textContent.trim(), 'Leo Euclides');
    assert.equal(this.element.querySelectorAll('[data-test-prev]').length, 1, 'Prev link available on a middle page');
    assert.equal(this.element.querySelectorAll('[data-test-next]').length, 1, 'Next link available on a middle page');

    await this.h.click('[data-test-next]');
    await this.h.rerender();

    assert.deepEqual(paginationState.activePage?.data, [users[2]], 'Active page advanced to the final cursor page');
    assert.equal(this.element.querySelector('[data-test-user-name]')?.textContent.trim(), 'Mehul Chaudhari');
    assert.equal(this.element.querySelectorAll('[data-test-next]').length, 0, 'No next link on the final page');
    assert.equal(this.element.querySelectorAll('[data-test-prev]').length, 1, 'Prev link available on the final page');

    await this.h.click('[data-test-prev]');
    await this.h.rerender();

    assert.deepEqual(paginationState.activePage?.data, [users[1]], 'Active page moved back via prev cursor');
    assert.equal(this.element.querySelector('[data-test-user-name]')?.textContent.trim(), 'Leo Euclides');

    await this.h.click('[data-test-prev]');
    await this.h.rerender();

    assert.deepEqual(paginationState.activePage?.data, [users[0]], 'Active page moved back to the first cursor page');
    assert.equal(this.element.querySelector('[data-test-user-name]')?.textContent.trim(), 'Chris Thoburn');
    assert.equal(this.element.querySelectorAll('[data-test-prev]').length, 0, 'No prev link back on the first page');
  })

  .for('it supports infinite pagination that accumulates loaded pages into a single set')
  .use<{ store: RequestManager; request: CollectionRequest }>(async function (assert) {
    const urls = [
      buildBaseURL({ resourcePath: 'users/1' }),
      buildBaseURL({ resourcePath: 'users/2' }),
      buildBaseURL({ resourcePath: 'users/3' }),
    ];

    await GET(this, 'users/1', () => ({
      data: [users[0]],
      links: {
        self: urls[0],
        next: urls[1],
      },
      meta: {
        hasNextPage: true,
        hasPreviousPage: false,
      },
    }));

    await GET(this, 'users/2', () => ({
      data: [users[1]],
      links: {
        prev: urls[0],
        self: urls[1],
        next: urls[2],
      },
      meta: {
        hasNextPage: true,
        hasPreviousPage: true,
      },
    }));

    await GET(this, 'users/3', () => ({
      data: [users[2]],
      links: {
        prev: urls[1],
        self: urls[2],
      },
      meta: {
        hasNextPage: false,
        hasPreviousPage: true,
      },
    }));

    const request = this.manager.request<CollectionResourceDataDocument<UserResource>>({ url: urls[0], method: 'GET' });
    const paginationState = getPaginationState(request);
    const paginationLinks = getPaginationLinks(paginationState);
    const paginationCache = getPaginationCache(urls[0]);

    await this.render({
      store: this.manager,
      request,
    });

    await request;
    await this.h.rerender();

    assert.deepEqual(
      Array.from(paginationState.data).map((user) => user.attributes.name),
      ['Chris Thoburn'],
      'Initial data holds only the first page'
    );
    assert.equal(Array.from(paginationState.pages).length, 1, '1 page in the frontier run');
    assert.equal(this.element.querySelectorAll('[data-test-user-name]').length, 1, '1 user rendered');
    assert.equal(paginationState.totalPages, 0, 'No total is known for a cursor collection');
    assert.equal(paginationLinks.links.length, 0, 'No numbered links for a cursor collection');

    assert.true(paginationState.hasNext, 'hasNext is true at the start');
    assert.false(paginationState.hasPrevious, 'hasPrevious is false at the start');
    assert.equal(this.element.querySelectorAll('[data-test-load-next]').length, 1, 'Next sentinel rendered (idle)');
    assert.equal(
      this.element.querySelectorAll('[data-test-load-prev]').length,
      0,
      'Prev sentinel hidden at the start (hasPrevious guards it)'
    );

    await this.h.click('[data-test-load-next]');
    await this.h.rerender();

    assert.deepEqual(
      Array.from(paginationState.data).map((user) => user.attributes.name),
      ['Chris Thoburn', 'Leo Euclides'],
      'Next page appended to the accumulated set'
    );
    assert.equal(Array.from(paginationState.pages).length, 2, '2 pages in the frontier run');
    assert.equal(this.element.querySelectorAll('[data-test-user-name]').length, 2, '2 users rendered');
    assert.true(paginationState.hasNext, 'hasNext still true in the middle');
    assert.false(
      paginationState.hasPrevious,
      'hasPrevious stays false: loadNext extends the forward frontier only, not the backward one'
    );

    await this.h.click('[data-test-load-next]');
    await this.h.rerender();

    assert.deepEqual(
      Array.from(paginationState.data).map((user) => user.attributes.name),
      ['Chris Thoburn', 'Leo Euclides', 'Mehul Chaudhari'],
      'Final page appended to the accumulated set'
    );
    assert.equal(Array.from(paginationState.pages).length, 3, '3 pages in the frontier run');
    assert.equal(Array.from(paginationCache.pages).length, 3, 'Whole graph holds all 3 pages');
    assert.equal(this.element.querySelectorAll('[data-test-user-name]').length, 3, '3 users rendered');
    assert.false(paginationState.hasNext, 'hasNext is false at end-of-list');
    assert.equal(this.element.querySelectorAll('[data-test-load-next]').length, 0, 'Next sentinel hidden at end');
    assert.equal(paginationState.nextRequest, null, 'nextRequest is null at end-of-list');
  })

  .for('infinite pagination extends backwards from a deep-linked entry page')
  .use<{ store: RequestManager; request: CollectionRequest }>(async function (assert) {
    const urls = [
      buildBaseURL({ resourcePath: 'users/1' }),
      buildBaseURL({ resourcePath: 'users/2' }),
      buildBaseURL({ resourcePath: 'users/3' }),
    ];

    await GET(this, 'users/1', () => ({
      data: [users[0]],
      links: {
        self: urls[0],
        next: urls[1],
      },
      meta: {
        hasNextPage: true,
        hasPreviousPage: false,
      },
    }));

    await GET(this, 'users/2', () => ({
      data: [users[1]],
      links: {
        prev: urls[0],
        self: urls[1],
        next: urls[2],
      },
      meta: {
        hasNextPage: true,
        hasPreviousPage: true,
      },
    }));

    await GET(this, 'users/3', () => ({
      data: [users[2]],
      links: {
        prev: urls[1],
        self: urls[2],
      },
      meta: {
        hasNextPage: false,
        hasPreviousPage: true,
      },
    }));

    const request = this.manager.request<CollectionResourceDataDocument<UserResource>>({ url: urls[1], method: 'GET' });
    const paginationState = getPaginationState(request);
    const paginationCache = getPaginationCache(urls[1]);

    await this.render({
      store: this.manager,
      request,
    });

    await request;
    await this.h.rerender();

    assert.deepEqual(
      Array.from(paginationState.data).map((user) => user.attributes.name),
      ['Leo Euclides'],
      'Initial data holds only the entry page'
    );
    assert.equal(Array.from(paginationState.pages).length, 1, '1 page in the frontier run');
    assert.true(paginationState.hasNext, 'hasNext true from the middle');
    assert.true(paginationState.hasPrevious, 'hasPrevious true from the middle');

    await this.h.click('[data-test-load-prev]');
    await this.h.rerender();

    assert.deepEqual(
      Array.from(paginationState.data).map((user) => user.attributes.name),
      ['Chris Thoburn', 'Leo Euclides'],
      'Previous page prepended to the accumulated set'
    );
    assert.equal(Array.from(paginationState.pages).length, 2, '2 pages in the frontier run after prepending');
    assert.equal(
      Array.from(paginationCache.pages).length,
      3,
      'Whole graph spans all 3 known pages: firstPage moved backward to the prepended page'
    );
    assert.false(paginationState.hasPrevious, 'hasPrevious false after reaching the first page');
    assert.equal(this.element.querySelectorAll('[data-test-load-prev]').length, 0, 'Prev sentinel hidden at the start');

    await this.h.click('[data-test-load-next]');
    await this.h.rerender();

    assert.deepEqual(
      Array.from(paginationState.data).map((user) => user.attributes.name),
      ['Chris Thoburn', 'Leo Euclides', 'Mehul Chaudhari'],
      'Forward frontier extended independently of the backward frontier'
    );
    assert.equal(Array.from(paginationState.pages).length, 3, '3 pages in the frontier run after appending');
    assert.equal(Array.from(paginationCache.pages).length, 3, 'Whole graph still spans all 3 pages');
    assert.false(paginationState.hasNext, 'hasNext false at end-of-list');
  })

  .for('it renders the default block as a fallback with pagination state and features')
  .use<{ store: RequestManager; request: CollectionRequest }>(async function (assert) {
    const urls = [buildBaseURL({ resourcePath: 'users/1' }), buildBaseURL({ resourcePath: 'users/2' })];

    await GET(this, 'users/1', () => ({
      data: [users[0]],
      links: {
        self: urls[0],
        next: urls[1],
      },
      meta: {
        hasNextPage: true,
        hasPreviousPage: false,
      },
    }));

    await GET(this, 'users/2', () => ({
      data: [users[1]],
      links: {
        prev: urls[0],
        self: urls[1],
      },
      meta: {
        hasNextPage: false,
        hasPreviousPage: true,
      },
    }));

    const request = this.manager.request<CollectionResourceDataDocument<UserResource>>({
      url: urls[0],
      method: 'GET',
    });
    const paginationState = getPaginationState(request);

    await this.render({
      store: this.manager,
      request,
    });

    // The default block renders regardless of the state of the initiating
    // request — state management is expected to occur elsewhere.
    assert.equal(this.element.querySelectorAll('[data-test-user-name]').length, 0, 'No users while loading');
    assert.equal(
      this.element.querySelectorAll('[data-test-load-next]').length,
      1,
      'Features are yielded while loading'
    );

    await request;
    await this.h.rerender();

    assert.deepEqual(
      Array.from(paginationState.data).map((user) => user.attributes.name),
      ['Chris Thoburn'],
      'Initial data holds the first page'
    );
    assert.equal(this.element.querySelectorAll('[data-test-user-name]').length, 1, '1 user rendered');

    await this.h.click('[data-test-load-next]');
    await this.h.rerender();

    assert.deepEqual(
      Array.from(paginationState.data).map((user) => user.attributes.name),
      ['Chris Thoburn', 'Leo Euclides'],
      'Next page appended via the yielded features'
    );
    assert.equal(this.element.querySelectorAll('[data-test-user-name]').length, 2, '2 users rendered');
  })

  .for('it transitions to error state correctly')
  .use<{ store: RequestManager; request: CollectionRequest; countFor: (result: unknown) => number }>(
    async function (assert) {
      const url = await mockPageFailure(this, 'users/1');
      const request = this.manager.request<CollectionResourceDataDocument<UserResource>>({ url, method: 'GET' });
      const paginationState = getPaginationState(request);

      let counter = 0;
      function countFor(_result: unknown) {
        return ++counter;
      }

      await this.render({
        store: this.manager,
        request,
        countFor,
      });

      assert.equal(counter, 1, 'counter is 1');
      assert.equal(this.element.querySelector('[data-test-pending]')?.textContent.trim(), 'PendingCount: 1');

      try {
        await request;
      } catch {
        // ignore the error
      }
      await this.h.rerender();

      assert.equal(counter, 2, 'counter is 2');
      assert.equal(
        this.element.querySelector('[data-test-error]')?.textContent.trim(),
        `[404 Not Found] GET (cors) - ${url}Count: 2`,
        'the error block renders the reason'
      );
      assert.equal(this.element.querySelectorAll('[data-test-user-name]').length, 0, 'the content block never renders');
      assert.equal(Array.from(paginationState.pages).length, 0, 'no pages after the initial request fails');
      assert.equal(paginationState.totalPages, 0, 'totalPages stays unknown');
    }
  )

  .for('we can retry from error state')
  .use<{
    store: RequestManager;
    request: CollectionRequest;
    countFor: (result: unknown) => number;
    retry: (features: { retry: () => Promise<void> }) => void;
  }>(async function (assert) {
    const url = await mockPageFailure(this, 'users/1');
    await mockFirstPageSuccess(this);
    await mockSecondPageSuccess(this);
    const request = this.manager.request<CollectionResourceDataDocument<UserResource>>({ url, method: 'GET' });

    let retryPromise: Promise<unknown> | null = null;
    let counter = 0;
    function countFor(_result: unknown) {
      return ++counter;
    }
    function retry(features: { retry: () => Promise<void> }) {
      assert.step('retry');
      retryPromise = features.retry();
      return retryPromise;
    }

    await this.render({
      store: this.manager,
      request,
      countFor,
      retry,
    });

    assert.equal(counter, 1, 'counter is 1');
    assert.equal(this.element.querySelector('[data-test-pending]')?.textContent.trim(), 'PendingCount: 1');

    try {
      await request;
    } catch {
      // ignore the error
    }
    await this.h.rerender();

    assert.equal(counter, 2, 'counter is 2');
    assert.equal(
      this.element.querySelector('[data-test-error]')?.textContent.trim(),
      `[404 Not Found] GET (cors) - ${url}Count: 2`,
      'the error block renders the reason'
    );

    await this.h.click('[test-id="retry-button"]');
    await retryPromise!;
    // the first rerender picks up the retried request and begins the new
    // pagination state's async setup; the second renders its result
    await this.h.rerender();
    await this.h.rerender();

    assert.verifySteps(['retry'], 'we called retry');
    assert.equal(counter, 4, 'counter is 4');
    assert.equal(
      this.element.querySelector('[data-test-user-name]')?.textContent.trim(),
      'Chris ThoburnCount: 4',
      'the first page renders after retry'
    );
    assert.equal(
      this.element.querySelector('[data-test-total-pages]')?.textContent.trim(),
      '2',
      'totalPages recovers after retry'
    );
    assert.equal(this.element.querySelectorAll('[data-test-load-page]').length, 2, 'both page links render');

    // pagination is fully functional after the retry: navigate to page 2
    await this.h.click('[data-test-load-page="2"]');

    assert.equal(
      this.element.querySelector('[data-test-user-name]')?.textContent.trim(),
      'Leo EuclidesCount: 5',
      'navigation works after retry'
    );
  })

  .for('it rethrows if error block is not present')
  .use<{ store: RequestManager; request: CollectionRequest; countFor: (result: unknown) => number }>(
    async function (assert) {
      const url = await mockPageFailure(this, 'users/1');
      const request = this.manager.request<CollectionResourceDataDocument<UserResource>>({ url, method: 'GET' });

      let counter = 0;
      function countFor(_result: unknown) {
        return ++counter;
      }

      await this.render({
        store: this.manager,
        request,
        countFor,
      });

      assert.equal(counter, 1, 'counter is 1');
      assert.equal(this.element.querySelector('[data-test-pending]')?.textContent.trim(), 'PendingCount: 1');

      const cleanup = setupOnError((error) => {
        assert.step('render-error');
        const message = error instanceof Error ? error.message : error;
        const matches =
          typeof message === 'string' &&
          // ember
          ((PRODUCTION
            ? message.startsWith('[404 Not Found] GET (cors) - ')
            : message.startsWith('\n\nError occurred:\n\n- While rendering:')) ||
            // react
            message.startsWith('[404 Not Found] GET (cors) - '));
        assert.true(matches, 'error message is correct');
        if (!matches) {
          throw new Error(`Unmatched Error Encountered`, { cause: message });
        }
      });
      try {
        await request;
      } catch {
        // ignore the error
      }
      if (PRODUCTION) {
        // for whatever reason the rethrow isn't immediate in production
        // and is hard to capture
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      await this.h.rerender();
      cleanup();

      assert.verifySteps(['render-error']);
      assert.equal(counter, 1, 'counter is still 1');
      assert.equal(this.element.textContent?.trim(), '', 'nothing is rendered');
    }
  )

  .for('it transitions to cancelled state correctly')
  .use<{ store: RequestManager; request: CollectionRequest; countFor: (result: unknown) => number }>(
    async function (assert) {
      const url = await mockPageFailure(this, 'users/1');
      const request = this.manager.request<CollectionResourceDataDocument<UserResource>>({ url, method: 'GET' });

      let counter = 0;
      function countFor(_result: unknown) {
        return ++counter;
      }

      await this.render({
        store: this.manager,
        request,
        countFor,
      });

      assert.equal(counter, 1, 'counter is 1');
      assert.equal(this.element.querySelector('[data-test-pending]')?.textContent.trim(), 'PendingCount: 1');

      request.abort();

      try {
        await request;
      } catch {
        // ignore the error
      }
      await this.h.rerender();

      assert.equal(counter, 2, 'counter is 2');
      assert.equal(
        this.element.querySelector('[data-test-cancelled]')?.textContent.trim(),
        'Cancelled The user aborted a request.Count: 2',
        'the cancelled block renders, not the error block'
      );
      assert.equal(this.element.querySelectorAll('[data-test-error]').length, 0, 'the error block does not render');
    }
  )

  .for('we can retry from cancelled state')
  .use<{
    store: RequestManager;
    request: CollectionRequest;
    countFor: (result: unknown) => number;
    retry: (features: { retry: () => Promise<void> }) => void;
  }>(async function (assert) {
    const url = await mockPageFailure(this, 'users/1');
    await mockFirstPageSuccess(this);
    const request = this.manager.request<CollectionResourceDataDocument<UserResource>>({ url, method: 'GET' });

    let retryPromise: Promise<unknown> | null = null;
    let counter = 0;
    function countFor(_result: unknown) {
      return ++counter;
    }
    function retry(features: { retry: () => Promise<void> }) {
      assert.step('retry');
      retryPromise = features.retry();
      return retryPromise;
    }

    await this.render({
      store: this.manager,
      request,
      countFor,
      retry,
    });

    assert.equal(counter, 1, 'counter is 1');
    assert.equal(this.element.querySelector('[data-test-pending]')?.textContent.trim(), 'PendingCount: 1');

    request.abort();

    try {
      await request;
    } catch {
      // ignore the error
    }
    await this.h.rerender();

    assert.equal(counter, 2, 'counter is 2');
    assert.equal(
      this.element.querySelector('[data-test-cancelled]')?.textContent.trim(),
      'Cancelled The user aborted a request.Count: 2',
      'the cancelled block renders'
    );

    await this.h.click('[test-id="retry-button"]');
    await retryPromise!;
    // the first rerender picks up the retried request and begins the new
    // pagination state's async setup; the second renders its result
    await this.h.rerender();
    await this.h.rerender();

    assert.verifySteps(['retry'], 'we called retry');
    assert.equal(counter, 4, 'counter is 4');
    assert.equal(
      this.element.querySelector('[data-test-user-name]')?.textContent.trim(),
      'Chris ThoburnCount: 4',
      'the first page renders after retry'
    );
    assert.equal(
      this.element.querySelector('[data-test-total-pages]')?.textContent.trim(),
      '2',
      'totalPages recovers after retry'
    );
    assert.equal(this.element.querySelectorAll('[data-test-load-page]').length, 2, 'both page links render');
  })

  .for('it transitions to error state if cancelled block is not present')
  .use<{ store: RequestManager; request: CollectionRequest; countFor: (result: unknown) => number }>(
    async function (assert) {
      const url = await mockPageFailure(this, 'users/1');
      const request = this.manager.request<CollectionResourceDataDocument<UserResource>>({ url, method: 'GET' });

      let counter = 0;
      function countFor(_result: unknown) {
        return ++counter;
      }

      await this.render({
        store: this.manager,
        request,
        countFor,
      });

      assert.equal(counter, 1, 'counter is 1');
      assert.equal(this.element.querySelector('[data-test-pending]')?.textContent.trim(), 'PendingCount: 1');

      request.abort();

      try {
        await request;
      } catch {
        // ignore the error
      }
      await this.h.rerender();

      assert.equal(counter, 2, 'counter is 2');
      assert.equal(
        this.element.querySelector('[data-test-error]')?.textContent.trim(),
        'The user aborted a request.Count: 2',
        'the abort reason falls through to the error block'
      );
    }
  )

  .for('it does not rethrow for cancelled')
  .use<{ store: RequestManager; request: CollectionRequest; countFor: (result: unknown) => number }>(
    async function (assert) {
      const url = await mockPageFailure(this, 'users/1');
      const request = this.manager.request<CollectionResourceDataDocument<UserResource>>({ url, method: 'GET' });

      let counter = 0;
      function countFor(_result: unknown) {
        return ++counter;
      }

      await this.render({
        store: this.manager,
        request,
        countFor,
      });

      assert.equal(counter, 1, 'counter is 1');
      assert.equal(this.element.querySelector('[data-test-pending]')?.textContent.trim(), 'PendingCount: 1');

      const cleanup = setupOnError(() => {
        assert.step('render-error');
      });

      request.abort();
      try {
        await request;
      } catch {
        // ignore the error
      }
      await this.h.rerender();
      cleanup();

      assert.equal(counter, 1, 'counter is still 1');
      assert.equal(this.element.textContent?.trim(), '', 'nothing is rendered');
      assert.verifySteps([], 'no error should be thrown');
    }
  )

  .for('a failed page load renders the active page error and can be retried')
  .use<{ store: RequestManager; request: CollectionRequest }>(async function (assert) {
    const urls = twoPageURLs();
    await mockFirstPageSuccess(this);
    await mockPageFailure(this, 'users/2');
    const request = this.manager.request<CollectionResourceDataDocument<UserResource>>({
      url: urls[0],
      method: 'GET',
    });
    const paginationState = getPaginationState(request);

    await this.render({
      store: this.manager,
      request,
    });

    await request;
    await this.h.rerender();

    assert.equal(
      this.element.querySelector('[data-test-user-name]')?.textContent.trim(),
      'Chris Thoburn',
      'the first page renders'
    );
    assert.equal(this.element.querySelectorAll('[data-test-load-page]').length, 2, 'both page links render');

    await this.h.click('[data-test-load-page="2"]');

    assert.equal(
      this.element.querySelector('[data-test-page-error]')?.textContent.trim(),
      `[404 Not Found] GET (cors) - ${urls[1]}`,
      'the active page renders its error'
    );
    assert.equal(this.element.querySelectorAll('[data-test-user-name]').length, 0, 'no page content renders');
    assert.true(Boolean(paginationState.activePage?.isError), 'the active page is in error state');
    assert.equal(paginationState.totalPages, 2, 'totalPages is unaffected by the failed page');
    assert.equal(this.element.querySelectorAll('[data-test-load-page]').length, 2, 'the links are unaffected');

    // clicking the link again is the retry: it must issue a fresh request
    // (bypassing the cached error response) instead of replaying the failure
    await mockSecondPageSuccess(this);
    await this.h.click('[data-test-load-page="2"]');

    assert.equal(
      this.element.querySelector('[data-test-user-name]')?.textContent.trim(),
      'Leo Euclides',
      'the page renders after the retried load succeeds'
    );
    assert.equal(this.element.querySelectorAll('[data-test-page-error]').length, 0, 'the error is gone');
    assert.true(Boolean(paginationState.activePage?.isSuccess), 'the active page recovered');
  })

  .for('a failed loadNext renders the error and can be retried')
  .use<{ store: RequestManager; request: CollectionRequest }>(async function (assert) {
    const urls = twoPageURLs();
    await mockFirstPageSuccess(this);
    await mockPageFailure(this, 'users/2');
    const request = this.manager.request<CollectionResourceDataDocument<UserResource>>({
      url: urls[0],
      method: 'GET',
    });
    const paginationState = getPaginationState(request);

    await this.render({
      store: this.manager,
      request,
    });

    await request;
    await this.h.rerender();

    assert.deepEqual(
      Array.from(paginationState.data).map((user) => user.attributes.name),
      ['Chris Thoburn'],
      'the first page loads'
    );
    assert.equal(this.element.querySelectorAll('[data-test-load-next]').length, 1, 'the load-next sentinel renders');

    await this.h.click('[data-test-load-next]');

    assert.equal(
      this.element.querySelector('[data-test-next-error]')?.textContent.trim(),
      `[404 Not Found] GET (cors) - ${urls[1]}`,
      'the failed next page renders its error'
    );
    assert.deepEqual(
      Array.from(paginationState.data).map((user) => user.attributes.name),
      ['Chris Thoburn'],
      'the accumulated data is unaffected by the failure'
    );
    assert.equal(Array.from(paginationState.pages).length, 1, 'the frontier does not advance onto the failed page');
    assert.true(paginationState.hasNext, 'hasNext remains true');

    // clicking load-next again is the retry: it must issue a fresh request
    // (bypassing the cached error response) instead of replaying the failure
    await mockSecondPageSuccess(this);
    await this.h.click('[data-test-load-next]');

    assert.deepEqual(
      Array.from(paginationState.data).map((user) => user.attributes.name),
      ['Chris Thoburn', 'Leo Euclides'],
      'the retried page is appended to the accumulated data'
    );
    assert.equal(Array.from(paginationState.pages).length, 2, 'the frontier advances after the retried load succeeds');
    assert.equal(this.element.querySelectorAll('[data-test-next-error]').length, 0, 'the error is gone');
    assert.false(paginationState.hasNext, 'hasNext is false at end-of-list');
  })

  .for('a changed @request that resolves to a page of the same collection is adopted as the active page')
  .use<{ store: RequestManager; source: { request: CollectionRequest } }>(async function (assert) {
    const urls = [
      buildBaseURL({ resourcePath: 'users/1' }),
      buildBaseURL({ resourcePath: 'users/2' }),
      buildBaseURL({ resourcePath: 'users/3' }),
    ];

    await GET(this, 'users/2', () => ({
      data: [users[1]],
      links: {
        first: urls[0],
        prev: urls[0],
        self: urls[1],
        next: urls[2],
        last: urls[2],
      },
      meta: {
        currentPage: 2,
        totalPages: 3,
      },
    }));

    await GET(this, 'users/3', () => ({
      data: [users[2]],
      links: {
        first: urls[0],
        prev: urls[1],
        self: urls[2],
        next: null,
        last: urls[2],
      },
      meta: {
        currentPage: 3,
        totalPages: 3,
      },
    }));

    const initialRequest = this.manager.request<CollectionResourceDataDocument<UserResource>>({
      url: urls[1],
      method: 'GET',
    });

    class RequestSource {
      @signal request: CollectionRequest = initialRequest;
    }
    const source = new RequestSource();
    const paginationState = getPaginationState(initialRequest);

    await this.render({ store: this.manager, source });
    await initialRequest;
    await this.h.rerender();

    assert.dom('[data-test-user-name]').hasText('Leo Euclides', 'the entry page renders');
    assert.equal(paginationState.activePage?.pageNumber, 2, 'the entry page is the active page');
    assert.dom('[data-test-navigating]').doesNotExist('not navigating initially');

    // a route-driven navigation (e.g. browser back button): the arg swaps to a
    // new request that is a page of the same collection
    const nextRequest = this.manager.request<CollectionResourceDataDocument<UserResource>>({
      url: urls[2],
      method: 'GET',
    });
    source.request = nextRequest;
    await this.h.rerender();

    assert.dom('[data-test-pending]').doesNotExist('no blocking loading state while the navigation resolves');
    assert.dom('[data-test-user-name]').hasText('Leo Euclides', 'the existing content stays rendered');
    assert.dom('[data-test-navigating]').exists('isNavigating is true while the navigation resolves');

    await nextRequest;
    await this.h.rerender();
    await this.h.rerender();

    assert.equal(getPaginationState(initialRequest), paginationState, 'the PaginationState reference is unchanged');
    assert.equal(paginationState.activePage?.pageNumber, 3, 'the navigated page was adopted as the active page');
    assert.dom('[data-test-user-name]').hasText('Mehul Chaudhari', 'the adopted page renders');
    assert.dom('[data-test-navigating]').doesNotExist('navigation has settled');
    assert.equal(paginationState.totalPages, 3, 'the collection total is intact');
    assert.deepEqual(
      Array.from(paginationState.data).map((user) => user.attributes.name),
      ['Leo Euclides', 'Mehul Chaudhari'],
      'the adjacent adopted page extended the frontier'
    );
  })

  .for('a changed @request that resolves to a different collection resets the pagination')
  .use<{ store: RequestManager; source: { request: CollectionRequest } }>(async function (assert) {
    const userUrls = [buildBaseURL({ resourcePath: 'users/1' }), buildBaseURL({ resourcePath: 'users/2' })];
    const adminUrl = buildBaseURL({ resourcePath: 'admins/1' });

    await GET(this, 'users/1', () => ({
      data: [users[0]],
      links: {
        first: userUrls[0],
        prev: null,
        self: userUrls[0],
        next: userUrls[1],
        last: userUrls[1],
      },
      meta: {
        currentPage: 1,
        totalPages: 2,
      },
    }));

    await GET(this, 'admins/1', () => ({
      data: [users[4]],
      links: {
        first: adminUrl,
        prev: null,
        self: adminUrl,
        next: null,
        last: adminUrl,
      },
      meta: {
        currentPage: 1,
        totalPages: 1,
      },
    }));

    const initialRequest = this.manager.request<CollectionResourceDataDocument<UserResource>>({
      url: userUrls[0],
      method: 'GET',
    });

    class RequestSource {
      @signal request: CollectionRequest = initialRequest;
    }
    const source = new RequestSource();
    const paginationState = getPaginationState(initialRequest);

    await this.render({ store: this.manager, source });
    await initialRequest;
    await this.h.rerender();

    assert.dom('[data-test-user-name]').hasText('Chris Thoburn', 'the initial collection renders');
    assert.equal(paginationState.totalPages, 2, 'the initial collection total');

    // the arg swaps to a request belonging to a different collection
    const adminRequest = this.manager.request<CollectionResourceDataDocument<UserResource>>({
      url: adminUrl,
      method: 'GET',
    });
    source.request = adminRequest;
    await this.h.rerender();

    assert.dom('[data-test-user-name]').hasText('Chris Thoburn', 'the existing content stays while the request resolves');
    assert.dom('[data-test-navigating]').exists('isNavigating is true while the request resolves');

    await adminRequest;
    await this.h.rerender();
    await this.h.rerender();

    const newState = getPaginationState(adminRequest);
    assert.notEqual(newState, paginationState, 'a fresh PaginationState took over');
    assert.dom('[data-test-user-name]').hasText('Jane Portman', 'the new collection renders');
    assert.equal(newState.totalPages, 1, 'the new collection total');
    assert.equal(newState.activePage?.pageNumber, 1, 'the new collection entry page is active');
    assert.equal(paginationState.activePage?.pageNumber, 1, 'the old state is left untouched');
  })

  .for('adoptPage adopts same-collection requests and rejects foreign ones')
  .use<{ store: RequestManager; request: CollectionRequest }>(async function (assert) {
    const userUrls = [buildBaseURL({ resourcePath: 'users/1' }), buildBaseURL({ resourcePath: 'users/2' })];
    const adminUrl = buildBaseURL({ resourcePath: 'admins/1' });

    await GET(this, 'users/1', () => ({
      data: [users[0]],
      links: {
        first: userUrls[0],
        prev: null,
        self: userUrls[0],
        next: userUrls[1],
        last: userUrls[1],
      },
      meta: {
        currentPage: 1,
        totalPages: 2,
      },
    }));

    await GET(this, 'users/2', () => ({
      data: [users[1]],
      links: {
        first: userUrls[0],
        prev: userUrls[0],
        self: userUrls[1],
        next: null,
        last: userUrls[1],
      },
      meta: {
        currentPage: 2,
        totalPages: 2,
      },
    }));

    await GET(this, 'admins/1', () => ({
      data: [users[4]],
      links: {
        first: adminUrl,
        prev: null,
        self: adminUrl,
        next: null,
        last: adminUrl,
      },
      meta: {
        currentPage: 1,
        totalPages: 1,
      },
    }));

    const request = this.manager.request<CollectionResourceDataDocument<UserResource>>({
      url: userUrls[0],
      method: 'GET',
    });
    const paginationState = getPaginationState(request);

    await this.render({ store: this.manager, request });
    await request;
    await this.h.rerender();

    assert.dom('[data-test-user-name]').hasText('Chris Thoburn', 'the entry page renders');
    assert.equal(paginationState.activePage?.pageNumber, 1, 'the entry page is the active page');

    // programmatic adoption of a same-collection request
    const pageTwoRequest = this.manager.request<CollectionResourceDataDocument<UserResource>>({
      url: userUrls[1],
      method: 'GET',
    });
    const adopted = await paginationState.adoptPage(pageTwoRequest);

    assert.deepEqual(adopted?.data, [users[1]], 'adoptPage resolves to the adopted page document');
    assert.equal(paginationState.activePage?.pageNumber, 2, 'the adopted page is the active page');
    assert.deepEqual(
      Array.from(paginationState.data).map((user) => user.attributes.name),
      ['Chris Thoburn', 'Leo Euclides'],
      'the adjacent adopted page extended the frontier'
    );

    await this.h.rerender();
    assert.dom('[data-test-user-name]').hasText('Leo Euclides', 'a component sharing the state renders the adopted page');

    // a request from a different collection is rejected
    const foreignRequest = this.manager.request<CollectionResourceDataDocument<UserResource>>({
      url: adminUrl,
      method: 'GET',
    });
    const rejected = await paginationState.adoptPage(foreignRequest);

    assert.equal(rejected, null, 'adoptPage resolves to null for a foreign-collection request');
    assert.equal(paginationState.activePage?.pageNumber, 2, 'the active page is untouched');
    assert.equal(paginationState.totalPages, 2, 'the collection total is untouched');
    assert.equal(Array.from(paginationState.pages).length, 2, 'the frontier is untouched');
  })
  .build();
