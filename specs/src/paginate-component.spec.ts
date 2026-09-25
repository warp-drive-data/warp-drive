import { Fetch, RequestManager } from '@warp-drive/core';
import { PRODUCTION } from '@warp-drive/core/build-config/env';
import type { CacheHandler, Future, NextFn } from '@warp-drive/core/request';
import { signal } from '@warp-drive/core/signals/-leaked';
import type { RequestContext, StructuredDataDocument } from '@warp-drive/core/types/request';
import type { CollectionResourceDataDocument } from '@warp-drive/core/types/spec/document';
import { setupOnError } from '@warp-drive/diagnostic';
import { spec, type SpecTest, type SuiteBuilder } from '@warp-drive/diagnostic/spec';
import {
  clearPaginationCache,
  getPaginationCache,
  getPaginationLinks,
  getPaginationState,
  type PageHints,
} from '@warp-drive/experiments/pagination';
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

export type CollectionRequest = Future<CollectionResourceDataDocument<UserResource>>;

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

function pageUrls(count: number): string[] {
  return Array.from({ length: count }, (_, index) => buildBaseURL({ resourcePath: `users/${index + 1}` }));
}

/**
 * A page of a numbered collection: full `first`/`prev`/`self`/`next`/`last`
 * links and `meta` page hints, for a collection of `totalPages` pages.
 */
function numberedPage(urls: string[], index: number, totalPages: number, data = [users[index]]) {
  return {
    data,
    links: {
      first: urls[0],
      prev: index === 0 ? null : urls[index - 1],
      self: urls[index],
      next: index === totalPages - 1 ? null : urls[index + 1],
      last: urls[totalPages - 1],
    },
    meta: {
      currentPage: index + 1,
      totalPages,
    },
  };
}

/** A forced re-request of a page, bypassing the cache handler. */
function reloadRequest(manager: RequestManager, url: string): CollectionRequest {
  return manager.request<CollectionResourceDataDocument<UserResource>>({
    url,
    method: 'GET',
    cacheOptions: { reload: true },
  });
}

/** The numbered links as rendered: a page number per real link, `.` per gap. */
function numberedLinks(paginationLinks: { links: ReadonlyArray<{ isReal: boolean; index?: number }> }): string[] {
  return paginationLinks.links.map((link) => (link.isReal ? `${link.index}` : '.'));
}

/**
 * The page numbers of the shared page graph, in order. Bounded: a graph that
 * loops back on itself reports `'cycle'` instead of hanging the test run.
 */
function graphPageNumbers(cache: { pages: Iterable<{ pageNumber: number }> }, limit = 10): Array<number | 'cycle'> {
  const numbers: Array<number | 'cycle'> = [];
  for (const page of cache.pages) {
    if (numbers.length === limit) {
      numbers.push('cycle');
      break;
    }
    numbers.push(page.pageNumber);
  }
  return numbers;
}

function renderedNames(root: Element): string[] {
  return Array.from(root.querySelectorAll('[data-test-user-name]')).map((element) => element.textContent?.trim() ?? '');
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
      countForA: (result: unknown) => number;
      countForB: (result: unknown) => number;
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
  'concurrent adoptPage calls resolve to the latest call': SpecTest<
    LocalTestContext,
    {
      store: RequestManager;
      request: CollectionRequest;
    }
  >;
  're-requesting a loaded page updates the page graph with its new links and total': SpecTest<
    LocalTestContext,
    {
      store: RequestManager;
      request: CollectionRequest;
    }
  >;
  'reloading the first page after the collection grows by one page links the new last page': SpecTest<
    LocalTestContext,
    {
      store: RequestManager;
      request: CollectionRequest;
    }
  >;
  'reloading a middle page after the collection grows keeps the pages around it in order': SpecTest<
    LocalTestContext,
    {
      store: RequestManager;
      request: CollectionRequest;
    }
  >;
  'reloading the last page after the collection grows gives it a next page': SpecTest<
    LocalTestContext,
    {
      store: RequestManager;
      request: CollectionRequest;
    }
  >;
  'reloading the first page after the collection grows by several pages renders a gap before the new last page': SpecTest<
    LocalTestContext,
    {
      store: RequestManager;
      request: CollectionRequest;
    }
  >;
  'reloading a page with an unchanged document leaves the page graph as it was': SpecTest<
    LocalTestContext,
    {
      store: RequestManager;
      request: CollectionRequest;
    }
  >;
  'a changed @request that reloads the active page swaps in its document without a loading state': SpecTest<
    LocalTestContext,
    {
      store: RequestManager;
      source: { request: CollectionRequest };
    }
  >;
  'a failed reload leaves the loaded page untouched': SpecTest<
    LocalTestContext,
    {
      store: RequestManager;
      request: CollectionRequest;
    }
  >;
  'a reload that omits links keeps the links recorded from the earlier load': SpecTest<
    LocalTestContext,
    {
      store: RequestManager;
      request: CollectionRequest;
    }
  >;
  'concurrent reloads of the same page resolve to the latest request': SpecTest<
    LocalTestContext,
    {
      store: RequestManager;
      request: CollectionRequest;
    }
  >;
  'a reload through one component updates the links of another component sharing the collection': SpecTest<
    LocalTestContext,
    {
      store: RequestManager;
      requestA: CollectionRequest;
      requestB: CollectionRequest;
    }
  >;
  'a new pagination over an already-loaded page adopts the newer request for everyone sharing the page': SpecTest<
    LocalTestContext,
    {
      store: RequestManager;
      requestA: CollectionRequest;
      source: { requestB: CollectionRequest | null };
    }
  >;
  'reloading a page in an infinite run replaces its items in place': SpecTest<
    LocalTestContext,
    {
      store: RequestManager;
      request: CollectionRequest;
    }
  >;
  'reloading the last page of an infinite run that gained a next page extends the run': SpecTest<
    LocalTestContext,
    {
      store: RequestManager;
      request: CollectionRequest;
    }
  >;
  'reloading a page in an infinite run whose next page is gone drops the pages after it': SpecTest<
    LocalTestContext,
    {
      store: RequestManager;
      request: CollectionRequest;
    }
  >;
  'reloading the entry page of an infinite run whose previous page is gone drops the pages before it': SpecTest<
    LocalTestContext,
    {
      store: RequestManager;
      request: CollectionRequest;
    }
  >;
  'reloading a page whose next cursor changed drops the stale branch and follows the new one': SpecTest<
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

      assert.equal(counter, 1);
      assert.equal(this.element.querySelector('[data-test-pending]')?.textContent.trim(), 'PendingCount: 1');
      assert.equal(Array.from(paginationState.data).length, 0, 'No data initially');
      assert.equal(Array.from(paginationCache.pages).length, 0, 'No pages in the graph initially');
      assert.deepEqual(paginationLinks.links.length, 0, '0 links initially');

      await request;
      await this.h.rerender();

      let activePage = paginationState.activePage;

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
      assert.equal(paginationLinks.first?.url, urls[0], 'First link targets page 1');
      assert.false(!!paginationLinks.first?.isCurrent, 'First link is not current on page 2');
      assert.equal(paginationLinks.last?.url, urls[5], 'Last link targets page 6');
      assert.false(!!paginationLinks.last?.isCurrent, 'Last link is not current on page 2');
      assert.equal(this.element.querySelectorAll('[data-test-first]').length, 1, 'First link rendered on page 2');
      assert.equal(this.element.querySelectorAll('[data-test-last]').length, 1, 'Last link rendered on page 2');
      assert.false(
        !!this.element.querySelector('[data-test-first]')?.hasAttribute('disabled'),
        'First link enabled on page 2'
      );
      assert.equal(counter, 2);
      assert.equal(this.element.querySelector('[data-test-user-name]')?.textContent.trim(), 'Leo EuclidesCount: 2');
      assert.equal(this.element.querySelectorAll('[data-test-user-name]').length, 1, '1 user rendered');

      await this.h.click('[data-test-load-page="1"]');
      await paginationState.activePage?.request;
      await this.h.rerender();
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
      assert.true(!!paginationLinks.first?.isCurrent, 'First link is current on the first page');
      assert.false(!!paginationLinks.last?.isCurrent, 'Last link is not current on the first page');
      assert.true(
        !!this.element.querySelector('[data-test-first]')?.hasAttribute('disabled'),
        'First link disabled on the first page'
      );
      assert.false(
        !!this.element.querySelector('[data-test-last]')?.hasAttribute('disabled'),
        'Last link enabled on the first page'
      );
      assert.equal(counter, 4);
      assert.equal(this.element.querySelector('[data-test-user-name]')?.textContent.trim(), 'Chris ThoburnCount: 4');
      assert.equal(this.element.querySelectorAll('[data-test-user-name]').length, 1, '1 user rendered');

      await this.h.click('[data-test-load-page="6"]');
      await paginationState.activePage?.request;
      await this.h.rerender();
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
      assert.true(!!paginationLinks.last?.isCurrent, 'Last link is current on the last page');
      assert.false(!!paginationLinks.first?.isCurrent, 'First link is not current on the last page');
      assert.true(
        !!this.element.querySelector('[data-test-last]')?.hasAttribute('disabled'),
        'Last link disabled on the last page'
      );
      assert.equal(counter, 6);
      assert.equal(this.element.querySelector('[data-test-user-name]')?.textContent.trim(), 'Mia SinekCount: 6');
      assert.equal(this.element.querySelectorAll('[data-test-user-name]').length, 1, '1 user rendered');

      await this.h.click('[data-test-load-page="5"]');
      await paginationState.activePage?.request;
      await this.h.rerender();
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
      await paginationState.activePage?.request;
      await this.h.rerender();
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
      await paginationState.activePage?.request;
      await this.h.rerender();
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
      await paginationState.activePage?.request;
      await this.h.rerender();
      activePage = paginationState.activePage;
      assert.deepEqual(activePage?.pageNumber, 4, 'Next button advances to page 4');
      assert.deepEqual(activePage?.data, [users[3]], 'Page data after next');
      assert.true(
        Boolean(this.element.querySelector('[data-test-user-name]')?.textContent?.includes('Benedikt Deicke')),
        'Page 4 rendered after next'
      );

      await this.h.click('[data-test-prev]');
      await paginationState.activePage?.request;
      await this.h.rerender();
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

      assert.equal(counter, 1);
      assert.equal(this.element.querySelector('[data-test-pending]')?.textContent.trim(), 'PendingCount: 1');
      assert.equal(Array.from(paginationState.data).length, 0, 'No data initially');
      assert.equal(Array.from(paginationCache.pages).length, 0, 'No pages in the graph initially');
      assert.deepEqual(paginationLinks.links.length, 0, '0 links initially');

      await request;
      await this.h.rerender();

      let activePage = paginationState.activePage;

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
      await paginationState.activePage?.request;
      await this.h.rerender();
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
      await paginationState.activePage?.request;
      await this.h.rerender();
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
      await paginationState.activePage?.request;
      await this.h.rerender();
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
      await paginationState.activePage?.request;
      await this.h.rerender();
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
      await paginationState.activePage?.request;
      await this.h.rerender();
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
    countForA: (result: unknown) => number;
    countForB: (result: unknown) => number;
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

    // One counter per component, never a shared one. A shared counter makes
    // every expected value a function of the order the two components happen
    // to render in, so an unrelated scheduling difference fails an assertion
    // whose message claims something else entirely.
    let counterA = 0;
    let counterB = 0;
    function countForA(_result: unknown) {
      return ++counterA;
    }
    function countForB(_result: unknown) {
      return ++counterB;
    }

    await this.render({
      store: this.manager,
      requestA,
      requestB,
      countForA,
      countForB,
    });

    assert.equal(counterA, 1, 'A rendered once');
    assert.equal(counterB, 1, 'B rendered once');
    assert.equal(this.element.querySelector('[data-test-pending]')?.textContent.trim(), 'PendingCount: 1');
    assert.equal(Array.from(paginationStateA.data).length, 0, 'No data initially');
    assert.equal(Array.from(paginationCache.pages).length, 0, 'No pages in the graph initially');
    assert.deepEqual(paginationLinksA.links.length, 0, '0 links initially');

    await requestA;
    await requestB;
    await this.h.rerender();

    let activePageA = paginationStateA.activePage;
    let activePageB = paginationStateB.activePage;

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
    assert.equal(counterA, 2, 'A rendered its page');
    assert.equal(counterB, 2, 'B rendered its page');
    assert.equal(
      this.element.querySelector('[data-test-pagination="a"] [data-test-user-name]')?.textContent.trim(),
      'Leo EuclidesCount: 2'
    );
    assert.equal(
      this.element.querySelectorAll('[data-test-pagination="a"] [data-test-user-name]').length,
      1,
      '1 user rendered'
    );
    assert.equal(
      this.element.querySelector('[data-test-pagination="b"] [data-test-user-name]')?.textContent.trim(),
      'Jane PortmanCount: 2'
    );
    assert.equal(
      this.element.querySelectorAll('[data-test-pagination="b"] [data-test-user-name]').length,
      1,
      '1 user rendered'
    );

    await this.h.click('[data-test-paginate="a"] [data-test-load-page="1"]');
    await paginationStateA.activePage?.request;
    await this.h.rerender();
    activePageA = paginationStateA.activePage;
    assert.deepEqual(activePageA?.data, [users[0]], 'Page data');
    assert.deepEqual(activePageA?.pageNumber, 1, 'Page number');
    assert.deepEqual(paginationLinksA.links.length, 6, '6 links');
    assert.equal(counterA, 4, 'A re-rendered for its own navigation');
    assert.equal(counterB, 2, 'Component B did not re-render');
    assert.equal(
      this.element.querySelector('[data-test-pagination="a"] [data-test-user-name]')?.textContent.trim(),
      'Chris ThoburnCount: 4'
    );
    assert.equal(
      this.element.querySelector('[data-test-pagination="b"] [data-test-user-name]')?.textContent.trim(),
      'Jane PortmanCount: 2',
      'Component B did not re-render'
    );

    await this.h.click('[data-test-paginate="b"] [data-test-load-page="6"]');
    await paginationStateB.activePage?.request;
    await this.h.rerender();
    activePageB = paginationStateB.activePage;
    assert.deepEqual(activePageB?.data, [users[5]], 'Page data');
    assert.deepEqual(activePageB?.pageNumber, 6, 'Page number');
    assert.deepEqual(paginationLinksA.links.length, 6, '6 links');
    assert.equal(counterA, 4, 'Component A did not re-render');
    assert.equal(counterB, 4, 'B re-rendered for its own navigation');
    assert.equal(
      this.element.querySelector('[data-test-pagination="a"] [data-test-user-name]')?.textContent.trim(),
      'Chris ThoburnCount: 4',
      'Component A did not re-render'
    );
    assert.equal(
      this.element.querySelector('[data-test-pagination="b"] [data-test-user-name]')?.textContent.trim(),
      'Mia SinekCount: 4'
    );

    await this.h.click('[data-test-paginate="a"] [data-test-load-page="4"]');
    await paginationStateA.activePage?.request;
    await this.h.rerender();
    activePageA = paginationStateA.activePage;
    assert.deepEqual(activePageA?.data, [users[3]], 'Page data');
    assert.equal(Array.from(paginationCache.pages).length, 6, 'Whole graph still holds all 6 pages');
    assert.deepEqual(activePageA?.pageNumber, 4, 'Page number');
    assert.deepEqual(paginationLinksA.links.length, 6, '6 links');
    assert.equal(counterA, 6, 'A re-rendered for its own navigation');
    assert.equal(counterB, 4, 'Component B did not re-render');
    assert.equal(
      this.element.querySelector('[data-test-pagination="a"] [data-test-user-name]')?.textContent.trim(),
      'Benedikt DeickeCount: 6'
    );
    assert.equal(
      this.element.querySelector('[data-test-pagination="b"] [data-test-user-name]')?.textContent.trim(),
      'Mia SinekCount: 4',
      'Component B did not re-render'
    );

    await this.h.click('[data-test-paginate="b"] [data-test-load-page="3"]');
    await paginationStateB.activePage?.request;
    await this.h.rerender();
    activePageB = paginationStateB.activePage;
    assert.deepEqual(activePageB?.data, [users[2]], 'Page data');
    assert.deepEqual(activePageB?.pageNumber, 3, 'Page number');
    assert.deepEqual(paginationLinksA.links.length, 6, '6 links');
    assert.equal(counterA, 6, 'Component A did not re-render');
    assert.equal(counterB, 6, 'B re-rendered for its own navigation');
    assert.equal(
      this.element.querySelector('[data-test-pagination="a"] [data-test-user-name]')?.textContent.trim(),
      'Benedikt DeickeCount: 6',
      'Component A did not re-render'
    );
    assert.equal(
      this.element.querySelector('[data-test-pagination="b"] [data-test-user-name]')?.textContent.trim(),
      'Mehul ChaudhariCount: 6'
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
    await paginationState.activePage?.request;
    await this.h.rerender();
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
    await paginationState.activePage?.request;
    await this.h.rerender();

    assert.deepEqual(paginationState.activePage?.data, [users[1]], 'Active page advanced via next cursor');
    assert.equal(this.element.querySelector('[data-test-user-name]')?.textContent.trim(), 'Leo Euclides');
    assert.equal(this.element.querySelectorAll('[data-test-prev]').length, 1, 'Prev link available on a middle page');
    assert.equal(this.element.querySelectorAll('[data-test-next]').length, 1, 'Next link available on a middle page');

    await this.h.click('[data-test-next]');
    await paginationState.activePage?.request;
    await this.h.rerender();

    assert.deepEqual(paginationState.activePage?.data, [users[2]], 'Active page advanced to the final cursor page');
    assert.equal(this.element.querySelector('[data-test-user-name]')?.textContent.trim(), 'Mehul Chaudhari');
    assert.equal(this.element.querySelectorAll('[data-test-next]').length, 0, 'No next link on the final page');
    assert.equal(this.element.querySelectorAll('[data-test-prev]').length, 1, 'Prev link available on the final page');

    await this.h.click('[data-test-prev]');
    await paginationState.activePage?.request;
    await this.h.rerender();

    assert.deepEqual(paginationState.activePage?.data, [users[1]], 'Active page moved back via prev cursor');
    assert.equal(this.element.querySelector('[data-test-user-name]')?.textContent.trim(), 'Leo Euclides');

    await this.h.click('[data-test-prev]');
    await paginationState.activePage?.request;
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
    await paginationState.nextRequest;
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
    await paginationState.nextRequest;
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
    await paginationState.previousRequest;
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
    await paginationState.nextRequest;
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
    await paginationState.nextRequest;
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

    await this.h.click('[data-test-id="retry-button"]');
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
    const paginationCache = getPaginationCache(twoPageURLs()[0]);
    await this.h.click('[data-test-load-page="2"]');
    const pageTwo = Array.from(paginationCache.pages).find((page) => page.selfLink === twoPageURLs()[1]);
    await pageTwo?.request;
    await this.h.rerender();

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

    await this.h.click('[data-test-id="retry-button"]');
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
    try {
      await paginationState.activePage?.request;
    } catch {
      // the failed page load is asserted below
    }
    await this.h.rerender();

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
    await paginationState.activePage?.request;
    await this.h.rerender();

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
    try {
      await paginationState.nextRequest;
    } catch {
      // the failed page load is asserted below
    }
    await this.h.rerender();

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
    await paginationState.nextRequest;
    await this.h.rerender();

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

    assert
      .dom('[data-test-user-name]')
      .hasText('Chris Thoburn', 'the existing content stays while the request resolves');
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
    assert
      .dom('[data-test-user-name]')
      .hasText('Leo Euclides', 'a component sharing the state renders the adopted page');

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

  .for('concurrent adoptPage calls resolve to the latest call')
  .use<{ store: RequestManager; request: CollectionRequest }>(async function (assert) {
    const urls = [
      buildBaseURL({ resourcePath: 'users/1' }),
      buildBaseURL({ resourcePath: 'users/2' }),
      buildBaseURL({ resourcePath: 'users/3' }),
    ];
    const page = (index: number) => ({
      data: [users[index]],
      links: {
        first: urls[0],
        prev: index === 0 ? null : urls[index - 1],
        self: urls[index],
        next: index === 2 ? null : urls[index + 1],
        last: urls[2],
      },
      meta: {
        currentPage: index + 1,
        totalPages: 3,
      },
    });

    await GET(this, 'users/1', () => page(0));
    await GET(this, 'users/2', () => page(1));
    await GET(this, 'users/3', () => page(2));

    const request = this.manager.request<CollectionResourceDataDocument<UserResource>>({
      url: urls[0],
      method: 'GET',
    });
    const paginationState = getPaginationState(request);

    await this.render({ store: this.manager, request });
    await request;
    await this.h.rerender();

    assert.equal(paginationState.activePage?.pageNumber, 1, 'the entry page is active');

    // move the active page off the run's page so the race outcomes are distinct
    await paginationState.loadPage(urls[1]);
    await this.h.rerender();
    assert.equal(paginationState.activePage?.pageNumber, 2, 'page 2 is active before the race');

    // two racing adoptions: A (page 3, not yet loaded) is immediately
    // superseded by B (page 1, already loaded) — the latest call wins no
    // matter which request settles first
    const requestA = this.manager.request<CollectionResourceDataDocument<UserResource>>({
      url: urls[2],
      method: 'GET',
    });
    const requestB = this.manager.request<CollectionResourceDataDocument<UserResource>>({
      url: urls[0],
      method: 'GET',
    });
    const promiseA = paginationState.adoptPage(requestA);
    const promiseB = paginationState.adoptPage(requestB);
    const [a, b] = await Promise.all([promiseA, promiseB]);

    assert.equal(a, null, 'the superseded adoption resolves to null');
    assert.deepEqual(b?.data, [users[0]], 'the latest adoption resolves to its page document');
    assert.equal(paginationState.activePage?.pageNumber, 1, 'the latest adoption won the race');

    await this.h.rerender();
    assert.dom('[data-test-user-name]').hasText('Chris Thoburn', 'the winning page renders');

    // an explicit loadPage navigation supersedes an in-flight adoption
    const requestC = this.manager.request<CollectionResourceDataDocument<UserResource>>({
      url: urls[2],
      method: 'GET',
    });
    const promiseC = paginationState.adoptPage(requestC);
    const loading = paginationState.loadPage(urls[1]);
    const [c] = await Promise.all([promiseC, loading]);

    assert.equal(c, null, 'the adoption superseded by loadPage resolves to null');
    assert.equal(paginationState.activePage?.pageNumber, 2, 'the explicit navigation won');

    // with the races settled, a clean adoption commits
    const requestD = this.manager.request<CollectionResourceDataDocument<UserResource>>({
      url: urls[2],
      method: 'GET',
    });
    const d = await paginationState.adoptPage(requestD);

    assert.deepEqual(d?.data, [users[2]], 'a clean adoption resolves to its page document');
    assert.equal(paginationState.activePage?.pageNumber, 3, 'the adopted page is active');
    assert.equal(
      Array.from(paginationState.pages).length,
      1,
      'the disjoint adopted page reset the run (jump semantics)'
    );

    await this.h.rerender();
    assert.dom('[data-test-user-name]').hasText('Mehul Chaudhari', 'the adopted page renders');
  })

  .for('re-requesting a loaded page updates the page graph with its new links and total')
  .use<{ store: RequestManager; request: CollectionRequest }>(async function (assert) {
    const urls = [
      buildBaseURL({ resourcePath: 'users/1' }),
      buildBaseURL({ resourcePath: 'users/2' }),
      buildBaseURL({ resourcePath: 'users/3' }),
    ];
    // the collection before and after it shrinks from 3 pages to 2
    const page = (index: number, totalPages: number) => ({
      data: [users[index]],
      links: {
        first: urls[0],
        prev: index === 0 ? null : urls[index - 1],
        self: urls[index],
        next: index === totalPages - 1 ? null : urls[index + 1],
        last: urls[totalPages - 1],
      },
      meta: {
        currentPage: index + 1,
        totalPages,
      },
    });

    // repeated requests to the same url replay these in order
    await GET(this, 'users/1', () => page(0, 3));
    await GET(this, 'users/2', () => page(1, 3));
    await GET(this, 'users/3', () => page(2, 3));
    await GET(this, 'users/1', () => page(0, 2));
    await GET(this, 'users/2', () => page(1, 2));

    const request = this.manager.request<CollectionResourceDataDocument<UserResource>>({
      url: urls[0],
      method: 'GET',
    });
    const paginationState = getPaginationState(request);
    const paginationLinks = getPaginationLinks(paginationState);
    const numbered = () => paginationLinks.links.map((link) => (link.isReal ? `${link.index}` : '.'));

    await this.render({ store: this.manager, request });
    await request;
    await this.h.rerender();

    // visit every page, then return to the first
    await paginationState.loadPage(urls[1]);
    await paginationState.loadPage(urls[2]);
    await paginationState.loadPage(urls[0]);
    await this.h.rerender();

    assert.equal(paginationState.totalPages, 3, 'the collection starts with 3 pages');
    assert.deepEqual(numbered(), ['1', '2', '3'], 'all 3 pages are linked');

    // the collection shrinks to 2 pages; the first page is re-requested
    const refreshedFirst = this.manager.request<CollectionResourceDataDocument<UserResource>>({
      url: urls[0],
      method: 'GET',
      cacheOptions: { reload: true },
    });
    assert.equal((await refreshedFirst).content.meta?.totalPages, 2, 'the server now reports 2 pages');
    await paginationState.adoptPage(refreshedFirst);
    await this.h.rerender();

    assert.equal(paginationState.totalPages, 2, 'the total reflects the re-requested document');
    assert.equal(paginationState.activePage?.lastLink, urls[1], 'the last link reflects the re-requested document');
    assert.deepEqual(numbered(), ['1', '2'], 'the page after the new last page is no longer linked');
    assert.equal(paginationState.activePageRequest, refreshedFirst, 'the re-requested page tracks its new request');

    // the second page is re-requested and is now the end of the collection
    const refreshedSecond = this.manager.request<CollectionResourceDataDocument<UserResource>>({
      url: urls[1],
      method: 'GET',
      cacheOptions: { reload: true },
    });
    await paginationState.adoptPage(refreshedSecond);
    await this.h.rerender();

    assert.equal(paginationState.activePage?.pageNumber, 2, 'the re-requested page is active');
    assert.equal(paginationState.activePage?.nextLink, null, 'the next link reflects the re-requested document');
    assert.equal(paginationLinks.next, null, 'there is no next link');
    assert.equal(paginationState.totalPages, 2, 'the total is still 2');
    assert.deepEqual(numbered(), ['1', '2'], 'only 2 pages are linked');
    assert.equal(this.element.querySelectorAll('[data-test-load-page]').length, 2, '2 numbered link buttons');
    assert.dom('[data-test-next]').doesNotExist('no next button renders');
    assert.equal(paginationState.activePageRequest, refreshedSecond, 'the re-requested page tracks its new request');
  })
  .for('reloading the first page after the collection grows by one page links the new last page')
  .use<{ store: RequestManager; request: CollectionRequest }>(async function (assert) {
    const urls = pageUrls(3);

    // repeated requests to the same url replay these in order
    await GET(this, 'users/1', () => numberedPage(urls, 0, 2));
    await GET(this, 'users/2', () => numberedPage(urls, 1, 2));
    await GET(this, 'users/1', () => numberedPage(urls, 0, 3));
    await GET(this, 'users/3', () => numberedPage(urls, 2, 3));

    const request = this.manager.request<CollectionResourceDataDocument<UserResource>>({
      url: urls[0],
      method: 'GET',
    });
    const paginationState = getPaginationState(request);
    const paginationLinks = getPaginationLinks(paginationState);
    const paginationCache = getPaginationCache(urls[0]);

    await request;
    await paginationState.loadPage(urls[1]);
    await paginationState.loadPage(urls[0]);

    assert.equal(paginationState.totalPages, 2, 'the collection starts with 2 pages');
    assert.deepEqual(numberedLinks(paginationLinks), ['1', '2'], 'both pages are linked');
    assert.equal(paginationLinks.last?.url, urls[1], 'the second page is the last page');

    // a page was appended to the collection; the first page is re-requested
    // and now points at a new last page
    const refreshed = reloadRequest(this.manager, urls[0]);
    await paginationState.adoptPage(refreshed);

    const graph = graphPageNumbers(paginationCache);
    assert.deepEqual(graph, [1, 2, 3], 'the new last page is appended after the pages already in the graph');
    if (graph.includes('cycle')) {
      // iterating a cyclic graph never terminates: rendering the links would hang the tab
      return;
    }

    // render only once the graph is known to terminate: the links iterate it
    await this.render({ store: this.manager, request });
    await request;
    await this.h.rerender();

    assert.equal(paginationState.totalPages, 3, 'the total reflects the re-requested document');
    assert.equal(paginationLinks.last?.url, urls[2], 'the last link points at the new page');
    assert.deepEqual(numberedLinks(paginationLinks), ['1', '2', '3'], 'the new page is numbered');
    assert.equal(paginationState.activePageRequest, refreshed, 'the re-requested page tracks its new request');

    await this.h.click('[data-test-load-page="3"]');
    await paginationState.activePageRequest;
    await this.h.rerender();

    assert.equal(paginationState.activePage?.pageNumber, 3, 'the new page loads and becomes active');
    assert.dom('[data-test-user-name]').hasText('Mehul Chaudhari', 'the new page renders');
    assert.equal(paginationState.activePage?.prevLink, urls[1], 'the new page links back to the page before it');
    assert.dom('[data-test-next]').doesNotExist('the new page is the end of the collection');
    assert.deepEqual(
      graphPageNumbers(paginationCache),
      [1, 2, 3],
      'the graph order is intact after loading the new page'
    );
  })

  .for('reloading a middle page after the collection grows keeps the pages around it in order')
  .use<{ store: RequestManager; request: CollectionRequest }>(async function (assert) {
    const urls = pageUrls(4);

    await GET(this, 'users/1', () => numberedPage(urls, 0, 3));
    await GET(this, 'users/2', () => numberedPage(urls, 1, 3));
    await GET(this, 'users/3', () => numberedPage(urls, 2, 3));
    await GET(this, 'users/2', () => numberedPage(urls, 1, 4));
    await GET(this, 'users/4', () => numberedPage(urls, 3, 4));

    const request = this.manager.request<CollectionResourceDataDocument<UserResource>>({
      url: urls[0],
      method: 'GET',
    });
    const paginationState = getPaginationState(request);
    const paginationLinks = getPaginationLinks(paginationState);
    const paginationCache = getPaginationCache(urls[0]);

    // visit every page, then settle on the middle one
    await request;
    await paginationState.loadPage(urls[1]);
    await paginationState.loadPage(urls[2]);
    await paginationState.loadPage(urls[1]);

    assert.equal(paginationState.totalPages, 3, 'the collection starts with 3 pages');
    assert.deepEqual(numberedLinks(paginationLinks), ['1', '2', '3'], 'all 3 pages are linked');
    assert.equal(paginationState.activePage?.pageNumber, 2, 'the middle page is active');

    // a page was appended to the collection; the middle page is re-requested
    const refreshed = reloadRequest(this.manager, urls[1]);
    await paginationState.adoptPage(refreshed);

    const graph = graphPageNumbers(paginationCache);
    assert.deepEqual(graph, [1, 2, 3, 4], 'the new last page is appended after the pages already in the graph');
    if (graph.includes('cycle')) {
      // iterating a cyclic graph never terminates: rendering the links would hang the tab
      return;
    }

    // render only once the graph is known to terminate: the links iterate it
    await this.render({ store: this.manager, request });
    await request;
    await this.h.rerender();

    assert.equal(paginationState.totalPages, 4, 'the total reflects the re-requested document');
    assert.deepEqual(numberedLinks(paginationLinks), ['1', '2', '3', '4'], 'the new page is numbered');
    assert.equal(paginationState.activePage?.pageNumber, 2, 'the re-requested page stays active');
    assert.dom('[data-test-user-name]').hasText('Leo Euclides', 'the re-requested page still renders');
    assert.true(
      Boolean(paginationState.activePage?.next?.isSuccess),
      'the page after the re-requested one stays loaded'
    );
    assert.deepEqual(paginationState.activePage?.next?.data, [users[2]], 'its data is intact');

    await this.h.click('[data-test-load-page="4"]');
    await paginationState.activePageRequest;
    await this.h.rerender();

    assert.equal(paginationState.activePage?.pageNumber, 4, 'the new page loads and becomes active');
    assert.dom('[data-test-user-name]').hasText('Benedikt Deicke', 'the new page renders');
    assert.equal(paginationState.activePage?.prevLink, urls[2], 'the new page links back to the page before it');
    assert.dom('[data-test-next]').doesNotExist('the new page is the end of the collection');
    assert.deepEqual(
      graphPageNumbers(paginationCache),
      [1, 2, 3, 4],
      'the graph order is intact after loading the new page'
    );
  })

  .for('reloading the last page after the collection grows gives it a next page')
  .use<{ store: RequestManager; request: CollectionRequest }>(async function (assert) {
    const urls = pageUrls(3);

    await GET(this, 'users/1', () => numberedPage(urls, 0, 2));
    await GET(this, 'users/2', () => numberedPage(urls, 1, 2));
    await GET(this, 'users/2', () => numberedPage(urls, 1, 3));
    await GET(this, 'users/3', () => numberedPage(urls, 2, 3));

    const request = this.manager.request<CollectionResourceDataDocument<UserResource>>({
      url: urls[0],
      method: 'GET',
    });
    const paginationState = getPaginationState(request);
    const paginationLinks = getPaginationLinks(paginationState);
    const paginationCache = getPaginationCache(urls[0]);

    await this.render({ store: this.manager, request });
    await request;
    await this.h.rerender();

    await paginationState.loadPage(urls[1]);
    await this.h.rerender();

    assert.equal(paginationState.activePage?.pageNumber, 2, 'the last page is active');
    assert.equal(paginationLinks.next, null, 'the last page has no next link');
    assert.dom('[data-test-next]').doesNotExist('no next button renders on the last page');
    assert.deepEqual(numberedLinks(paginationLinks), ['1', '2'], 'both pages are linked');

    // a page was appended to the collection; the (former) last page is
    // re-requested and now has a next page
    const refreshed = reloadRequest(this.manager, urls[1]);
    await paginationState.adoptPage(refreshed);
    await this.h.rerender();

    assert.equal(paginationState.activePage?.nextLink, urls[2], 'the next link reflects the re-requested document');
    assert.equal(paginationLinks.next?.url, urls[2], 'the next link points at the new page');
    assert.dom('[data-test-next]').exists('a next button renders');
    assert.equal(paginationState.totalPages, 3, 'the total reflects the re-requested document');
    assert.equal(paginationLinks.last?.url, urls[2], 'the last link points at the new page');
    assert.deepEqual(numberedLinks(paginationLinks), ['1', '2', '3'], 'the new page is numbered');
    assert.deepEqual(graphPageNumbers(paginationCache), [1, 2, 3], 'the new page is appended to the graph');

    await this.h.click('[data-test-next]');
    await paginationState.activePageRequest;
    await this.h.rerender();

    assert.equal(paginationState.activePage?.pageNumber, 3, 'the new page loads and becomes active');
    assert.dom('[data-test-user-name]').hasText('Mehul Chaudhari', 'the new page renders');
    assert.dom('[data-test-next]').doesNotExist('the new page is the end of the collection');
    assert.deepEqual(
      graphPageNumbers(paginationCache),
      [1, 2, 3],
      'the graph order is intact after loading the new page'
    );
  })

  .for('reloading the first page after the collection grows by several pages renders a gap before the new last page')
  .use<{ store: RequestManager; request: CollectionRequest }>(async function (assert) {
    const urls = pageUrls(5);

    await GET(this, 'users/1', () => numberedPage(urls, 0, 2));
    await GET(this, 'users/2', () => numberedPage(urls, 1, 2));
    await GET(this, 'users/1', () => numberedPage(urls, 0, 5));
    await GET(this, 'users/5', () => numberedPage(urls, 4, 5));

    const request = this.manager.request<CollectionResourceDataDocument<UserResource>>({
      url: urls[0],
      method: 'GET',
    });
    const paginationState = getPaginationState(request);
    const paginationLinks = getPaginationLinks(paginationState);
    const paginationCache = getPaginationCache(urls[0]);

    await request;
    await paginationState.loadPage(urls[1]);
    await paginationState.loadPage(urls[0]);

    assert.deepEqual(numberedLinks(paginationLinks), ['1', '2'], 'both pages are linked');

    // three pages were appended to the collection; the first page is
    // re-requested and now points at a last page that is not adjacent to
    // anything loaded
    const refreshed = reloadRequest(this.manager, urls[0]);
    await paginationState.adoptPage(refreshed);

    const graph = graphPageNumbers(paginationCache);
    assert.deepEqual(graph, [1, 2, 5], 'the new last page is appended after the pages already in the graph');
    if (graph.includes('cycle')) {
      // iterating a cyclic graph never terminates: rendering the links would hang the tab
      return;
    }

    // render only once the graph is known to terminate: the links iterate it
    await this.render({ store: this.manager, request });
    await request;
    await this.h.rerender();

    assert.equal(paginationState.totalPages, 5, 'the total reflects the re-requested document');
    assert.deepEqual(numberedLinks(paginationLinks), ['1', '2', '.', '5'], 'a gap separates the new last page');
    const gap = paginationLinks.links[2];
    assert.deepEqual(
      gap && !gap.isReal ? gap.indexRange : null,
      [3, 4],
      'the gap covers the pages known only by count'
    );
    assert.equal(this.element.querySelectorAll('[data-test-gap]').length, 1, 'one gap renders');

    await this.h.click('[data-test-load-page="5"]');
    await paginationState.activePageRequest;
    await this.h.rerender();

    assert.equal(paginationState.activePage?.pageNumber, 5, 'the new last page loads and becomes active');
    assert.dom('[data-test-user-name]').hasText('Jane Portman', 'the new last page renders');
    assert.equal(paginationState.activePage?.prevLink, urls[3], 'the new last page links back to the page before it');
    assert.deepEqual(numberedLinks(paginationLinks), ['1', '2', '.', '4', '5'], 'the page before it is now known');
    assert.deepEqual(graphPageNumbers(paginationCache), [1, 2, 4, 5], 'the graph order is intact');
  })

  .for('reloading a page with an unchanged document leaves the page graph as it was')
  .use<{ store: RequestManager; request: CollectionRequest }>(async function (assert) {
    const urls = pageUrls(2);

    await GET(this, 'users/1', () => numberedPage(urls, 0, 2));
    await GET(this, 'users/2', () => numberedPage(urls, 1, 2));
    await GET(this, 'users/1', () => numberedPage(urls, 0, 2));

    const request = this.manager.request<CollectionResourceDataDocument<UserResource>>({
      url: urls[0],
      method: 'GET',
    });
    const paginationState = getPaginationState(request);
    const paginationLinks = getPaginationLinks(paginationState);
    const paginationCache = getPaginationCache(urls[0]);

    await this.render({ store: this.manager, request });
    await request;
    await this.h.rerender();

    await paginationState.loadPage(urls[1]);
    await paginationState.loadPage(urls[0]);
    await this.h.rerender();

    const activePage = paginationState.activePage;
    assert.deepEqual(numberedLinks(paginationLinks), ['1', '2'], 'both pages are linked');

    // nothing changed server-side; the first page is re-requested
    const refreshed = reloadRequest(this.manager, urls[0]);
    const adopted = await paginationState.adoptPage(refreshed);
    await this.h.rerender();

    assert.deepEqual(adopted?.data, [users[0]], 'adoptPage resolves to the re-requested document');
    assert.equal(paginationState.activePage, activePage, 'the page is the same shared page');
    assert.equal(paginationState.activePageRequest, refreshed, 'the page tracks its new request');
    assert.equal(paginationState.activePage?.pageNumber, 1, 'the page number is unchanged');
    assert.equal(paginationState.totalPages, 2, 'the total is unchanged');
    assert.deepEqual(numberedLinks(paginationLinks), ['1', '2'], 'the numbered links are unchanged');
    assert.equal(paginationLinks.next?.url, urls[1], 'the next link is unchanged');
    assert.equal(paginationLinks.last?.url, urls[1], 'the last link is unchanged');
    assert.deepEqual(graphPageNumbers(paginationCache), [1, 2], 'the graph is unchanged');
    assert.dom('[data-test-user-name]').hasText('Chris Thoburn', 'the page still renders');
    assert.dom('[data-test-loading-page]').doesNotExist('no loading state was shown');
  })

  .for('a changed @request that reloads the active page swaps in its document without a loading state')
  .use<{ store: RequestManager; source: { request: CollectionRequest } }>(async function (assert) {
    const urls = pageUrls(2);

    await GET(this, 'users/1', () => numberedPage(urls, 0, 2));
    // the same page, with an item that changed since the first load
    await GET(this, 'users/1', () => numberedPage(urls, 0, 2, [users[3]]));

    const initialRequest = this.manager.request<CollectionResourceDataDocument<UserResource>>({
      url: urls[0],
      method: 'GET',
    });

    class RequestSource {
      @signal request: CollectionRequest = initialRequest;
    }
    const source = new RequestSource();
    const paginationState = getPaginationState(initialRequest);
    const paginationLinks = getPaginationLinks(paginationState);

    await this.render({ store: this.manager, source });
    await initialRequest;
    await this.h.rerender();

    assert.dom('[data-test-user-name]').hasText('Chris Thoburn', 'the page renders');
    assert.equal(paginationState.activePage?.pageNumber, 1, 'the page is active');

    // a route-driven refresh: the arg swaps to a forced re-request of the same page
    const reloaded = reloadRequest(this.manager, urls[0]);
    source.request = reloaded;
    await this.h.rerender();

    assert.dom('[data-test-pending]').doesNotExist('no blocking loading state while the reload resolves');
    assert.dom('[data-test-loading-page]').doesNotExist('no page loading state while the reload resolves');
    assert.dom('[data-test-user-name]').hasText('Chris Thoburn', 'the existing content stays rendered');
    assert.dom('[data-test-navigating]').exists('isNavigating is true while the reload resolves');

    await reloaded;
    await this.h.rerender();
    await this.h.rerender();

    assert.equal(getPaginationState(initialRequest), paginationState, 'the PaginationState reference is unchanged');
    assert.dom('[data-test-user-name]').hasText('Benedikt Deicke', 'the re-requested document renders');
    assert.deepEqual(paginationState.activePage?.data, [users[3]], 'the page holds the re-requested data');
    assert.equal(paginationState.activePageRequest, reloaded, 'the page tracks its new request');
    assert.equal(paginationState.activePage?.pageNumber, 1, 'the same page is active');
    assert.dom('[data-test-navigating]').doesNotExist('the reload has settled');
    assert.equal(paginationState.totalPages, 2, 'the collection total is intact');
    assert.deepEqual(numberedLinks(paginationLinks), ['1', '2'], 'the numbered links are intact');
  })

  .for('a failed reload leaves the loaded page untouched')
  .use<{ store: RequestManager; request: CollectionRequest }>(async function (assert) {
    const urls = pageUrls(2);

    await GET(this, 'users/1', () => numberedPage(urls, 0, 2));
    await mockPageFailure(this, 'users/1');

    const request = this.manager.request<CollectionResourceDataDocument<UserResource>>({
      url: urls[0],
      method: 'GET',
    });
    const paginationState = getPaginationState(request);
    const paginationLinks = getPaginationLinks(paginationState);

    await this.render({ store: this.manager, request });
    await request;
    await this.h.rerender();

    assert.dom('[data-test-user-name]').hasText('Chris Thoburn', 'the page renders');

    // the re-request fails (e.g. the server is briefly unavailable)
    const refreshed = reloadRequest(this.manager, urls[0]);
    const adopted = await paginationState.adoptPage(refreshed);
    await this.h.rerender();

    assert.equal(adopted, null, 'adoptPage resolves to null for a failed re-request');
    assert.equal(paginationState.activePageRequest, request, 'the page keeps the request that loaded it');
    assert.true(Boolean(paginationState.activePage?.isSuccess), 'the page is still loaded');
    assert.false(Boolean(paginationState.activePage?.isError), 'the page is not in error');
    assert.dom('[data-test-user-name]').hasText('Chris Thoburn', 'the loaded page still renders');
    assert.dom('[data-test-error]').doesNotExist('no error renders');
    assert.equal(paginationState.totalPages, 2, 'the total is untouched');
    assert.deepEqual(numberedLinks(paginationLinks), ['1', '2'], 'the numbered links are untouched');
  })

  .for('a reload that omits links keeps the links recorded from the earlier load')
  .use<{ store: RequestManager; request: CollectionRequest }>(async function (assert) {
    const urls = pageUrls(3);

    await GET(this, 'users/1', () => numberedPage(urls, 0, 3));
    await GET(this, 'users/2', () => numberedPage(urls, 1, 3));
    // the same page from an endpoint that only identifies the collection and
    // the page itself, leaving its neighbors unstated
    await GET(this, 'users/2', () => ({
      data: [users[4]],
      links: {
        first: urls[0],
        self: urls[1],
      },
      meta: {
        currentPage: 2,
        totalPages: 3,
      },
    }));

    const request = this.manager.request<CollectionResourceDataDocument<UserResource>>({
      url: urls[0],
      method: 'GET',
    });
    const paginationState = getPaginationState(request);
    const paginationLinks = getPaginationLinks(paginationState);
    const paginationCache = getPaginationCache(urls[0]);

    await this.render({ store: this.manager, request });
    await request;
    await this.h.rerender();

    await paginationState.loadPage(urls[1]);
    await this.h.rerender();

    assert.equal(paginationState.activePage?.pageNumber, 2, 'the middle page is active');
    assert.dom('[data-test-prev]').exists('a prev button renders');
    assert.dom('[data-test-next]').exists('a next button renders');

    const refreshed = reloadRequest(this.manager, urls[1]);
    await paginationState.adoptPage(refreshed);
    await this.h.rerender();

    assert.dom('[data-test-user-name]').hasText('Jane Portman', 'the re-requested document renders');
    assert.equal(paginationState.activePage?.prevLink, urls[0], 'the recorded prev link is kept');
    assert.equal(paginationState.activePage?.nextLink, urls[2], 'the recorded next link is kept');
    assert.equal(paginationState.activePage?.lastLink, urls[2], 'the recorded last link is kept');
    assert.dom('[data-test-prev]').exists('the prev button still renders');
    assert.dom('[data-test-next]').exists('the next button still renders');
    assert.equal(paginationState.totalPages, 3, 'the total is intact');
    assert.deepEqual(numberedLinks(paginationLinks), ['1', '2', '3'], 'the numbered links are intact');
    assert.deepEqual(graphPageNumbers(paginationCache), [1, 2, 3], 'the graph is intact');
  })

  .for('concurrent reloads of the same page resolve to the latest request')
  .use<{ store: RequestManager; request: CollectionRequest }>(async function (assert) {
    const urls = pageUrls(2);

    await GET(this, 'users/1', () => numberedPage(urls, 0, 2));
    await GET(this, 'users/1', () => numberedPage(urls, 0, 2, [users[3]]));
    await GET(this, 'users/1', () => numberedPage(urls, 0, 2, [users[4]]));

    const request = this.manager.request<CollectionResourceDataDocument<UserResource>>({
      url: urls[0],
      method: 'GET',
    });
    const paginationState = getPaginationState(request);
    const paginationCache = getPaginationCache(urls[0]);

    await this.render({ store: this.manager, request });
    await request;
    await this.h.rerender();

    // two re-requests of the same page in flight at once: the latest wins
    const requestA = reloadRequest(this.manager, urls[0]);
    const requestB = reloadRequest(this.manager, urls[0]);
    const [a, b] = await Promise.all([paginationState.adoptPage(requestA), paginationState.adoptPage(requestB)]);
    await this.h.rerender();

    assert.equal(a, null, 'the superseded re-request commits nothing');
    assert.deepEqual(b?.data, [users[4]], 'the latest re-request commits its document');
    assert.equal(paginationState.activePageRequest, requestB, 'the page tracks the latest request');
    assert.deepEqual(paginationState.activePage?.data, [users[4]], 'the page holds the latest data');
    assert.dom('[data-test-user-name]').hasText('Jane Portman', 'the latest document renders');
    assert.equal(paginationState.totalPages, 2, 'the total is intact');
    assert.deepEqual(graphPageNumbers(paginationCache), [1, 2], 'the graph is intact');
  })

  .for('a reload through one component updates the links of another component sharing the collection')
  .use<{ store: RequestManager; requestA: CollectionRequest; requestB: CollectionRequest }>(async function (assert) {
    const urls = pageUrls(3);

    await GET(this, 'users/1', () => numberedPage(urls, 0, 3));
    await GET(this, 'users/3', () => numberedPage(urls, 2, 3));
    // the collection shrinks to 2 pages
    await GET(this, 'users/1', () => numberedPage(urls, 0, 2));
    await GET(this, 'users/2', () => numberedPage(urls, 1, 2));

    const requestA = this.manager.request<CollectionResourceDataDocument<UserResource>>({
      url: urls[0],
      method: 'GET',
    });
    const requestB = this.manager.request<CollectionResourceDataDocument<UserResource>>({
      url: urls[2],
      method: 'GET',
    });
    const stateA = getPaginationState(requestA);
    const stateB = getPaginationState(requestB);
    const linksA = getPaginationLinks(stateA);
    const linksB = getPaginationLinks(stateB);
    const paginationCache = getPaginationCache(urls[0]);

    await this.render({ store: this.manager, requestA, requestB });
    await requestA;
    await requestB;
    await this.h.rerender();

    const componentB = this.element.querySelector('[data-test-paginate="b"]')!;

    assert.deepEqual(numberedLinks(linksA), ['1', '2', '3'], 'component A links all 3 pages');
    assert.deepEqual(numberedLinks(linksB), ['1', '2', '3'], 'component B links all 3 pages');
    assert.equal(stateB.activePage?.pageNumber, 3, 'component B is on the last page');

    // component A re-requests the first page, which now says the collection
    // ends at page 2
    const refreshed = reloadRequest(this.manager, urls[0]);
    await stateA.adoptPage(refreshed);
    await this.h.rerender();

    assert.equal(stateA.totalPages, 2, 'component A sees the new total');
    assert.equal(stateB.totalPages, 2, 'component B sees the new total');
    assert.deepEqual(numberedLinks(linksA), ['1', '2'], 'component A no longer links the dropped page');
    assert.deepEqual(numberedLinks(linksB), ['1', '2'], 'component B no longer links the dropped page');
    assert.deepEqual(graphPageNumbers(paginationCache), [1, 2], 'the shared graph ends at the new last page');
    assert.equal(stateB.activePage?.pageNumber, 3, 'component B stays on the page it was viewing');
    assert.deepEqual(renderedNames(componentB), ['Mehul Chaudhari'], 'component B still renders that page');
    assert.equal(componentB.querySelectorAll('[data-test-next]').length, 0, 'component B has no next page');

    // component B navigates to the new last page
    await stateB.loadPage(urls[1]);
    await this.h.rerender();

    assert.equal(stateB.activePage?.pageNumber, 2, 'component B moved to the new last page');
    assert.deepEqual(renderedNames(componentB), ['Leo Euclides'], 'component B renders the new last page');
    assert.equal(componentB.querySelectorAll('[data-test-next]').length, 0, 'the new last page has no next page');
    assert.deepEqual(numberedLinks(linksB), ['1', '2'], 'component B links the 2 remaining pages');
  })

  .for('a new pagination over an already-loaded page adopts the newer request for everyone sharing the page')
  .use<{ store: RequestManager; requestA: CollectionRequest; source: { requestB: CollectionRequest | null } }>(
    async function (assert) {
      const urls = pageUrls(2);

      await GET(this, 'users/1', () => numberedPage(urls, 0, 2));
      await GET(this, 'users/1', () => numberedPage(urls, 0, 2, [users[3]]));

      const requestA = this.manager.request<CollectionResourceDataDocument<UserResource>>({
        url: urls[0],
        method: 'GET',
      });
      const stateA = getPaginationState(requestA);

      class RequestSource {
        @signal requestB: CollectionRequest | null = null;
      }
      const source = new RequestSource();

      await this.render({ store: this.manager, requestA, source });
      await requestA;
      await this.h.rerender();

      const componentA = this.element.querySelector('[data-test-paginate="a"]')!;
      assert.deepEqual(renderedNames(componentA), ['Chris Thoburn'], 'component A renders the page');
      assert.equal(stateA.activePageRequest, requestA, 'the page tracks the request that loaded it');

      // a second component mounts over a forced re-request of the same page
      const requestB = reloadRequest(this.manager, urls[0]);
      const stateB = getPaginationState(requestB);
      source.requestB = requestB;
      await requestB;
      await this.h.rerender();
      await this.h.rerender();

      const componentB = this.element.querySelector('[data-test-paginate="b"]')!;
      assert.equal(stateB.activePage, stateA.activePage, 'both paginations share the page');
      assert.equal(stateB.activePageRequest, requestB, 'the new pagination tracks its own request');
      assert.equal(
        stateA.activePageRequest,
        requestB,
        'the shared page tracks the newer request for the first pagination too'
      );
      assert.deepEqual(renderedNames(componentB), ['Benedikt Deicke'], 'component B renders the re-requested document');
      assert.deepEqual(renderedNames(componentA), ['Benedikt Deicke'], 'component A renders the re-requested document');
      assert.equal(stateB.totalPages, 2, 'the new pagination knows the total');
      assert.deepEqual(numberedLinks(getPaginationLinks(stateB)), ['1', '2'], 'the new pagination links both pages');
    }
  )

  .for('reloading a page in an infinite run replaces its items in place')
  .use<{ store: RequestManager; request: CollectionRequest }>(async function (assert) {
    const urls = pageUrls(3);

    await GET(this, 'users/1', () => ({
      data: [users[0]],
      links: { first: urls[0], self: urls[0], next: urls[1] },
    }));
    await GET(this, 'users/2', () => ({
      data: [users[1]],
      links: { first: urls[0], prev: urls[0], self: urls[1], next: urls[2] },
    }));
    await GET(this, 'users/3', () => ({
      data: [users[2]],
      links: { first: urls[0], prev: urls[1], self: urls[2] },
    }));
    // the middle page, with an item that changed since the first load
    await GET(this, 'users/2', () => ({
      data: [users[4]],
      links: { first: urls[0], prev: urls[0], self: urls[1], next: urls[2] },
    }));

    const request = this.manager.request<CollectionResourceDataDocument<UserResource>>({
      url: urls[0],
      method: 'GET',
    });
    const paginationState = getPaginationState(request);

    await this.render({ store: this.manager, request });
    await request;
    await this.h.rerender();

    await this.h.click('[data-test-load-next]');
    await paginationState.nextRequest;
    await this.h.rerender();
    await this.h.click('[data-test-load-next]');
    await paginationState.nextRequest;
    await this.h.rerender();

    assert.deepEqual(
      renderedNames(this.element),
      ['Chris Thoburn', 'Leo Euclides', 'Mehul Chaudhari'],
      'all 3 pages render'
    );

    const refreshed = reloadRequest(this.manager, urls[1]);
    await paginationState.adoptPage(refreshed);
    await this.h.rerender();

    assert.deepEqual(
      Array.from(paginationState.data).map((user) => user.attributes.name),
      ['Chris Thoburn', 'Jane Portman', 'Mehul Chaudhari'],
      'the re-requested items replace the old ones at the same position'
    );
    assert.deepEqual(
      renderedNames(this.element),
      ['Chris Thoburn', 'Jane Portman', 'Mehul Chaudhari'],
      'the run renders the new items in place'
    );
    assert.equal(Array.from(paginationState.pages).length, 3, 'the run still holds 3 pages');
    assert.false(paginationState.hasNext, 'the end of the run is unchanged');
    assert.false(paginationState.hasPrevious, 'the start of the run is unchanged');
    assert.equal(paginationState.activePageRequest, refreshed, 'the re-requested page tracks its new request');
  })

  .for('reloading the last page of an infinite run that gained a next page extends the run')
  .use<{ store: RequestManager; request: CollectionRequest }>(async function (assert) {
    const urls = pageUrls(3);

    await GET(this, 'users/1', () => ({
      data: [users[0]],
      links: { first: urls[0], self: urls[0], next: urls[1] },
    }));
    await GET(this, 'users/2', () => ({
      data: [users[1]],
      links: { first: urls[0], prev: urls[0], self: urls[1] },
    }));
    // a page was appended: the (former) last page now has a next link
    await GET(this, 'users/2', () => ({
      data: [users[1]],
      links: { first: urls[0], prev: urls[0], self: urls[1], next: urls[2] },
    }));
    await GET(this, 'users/3', () => ({
      data: [users[2]],
      links: { first: urls[0], prev: urls[1], self: urls[2] },
    }));

    const request = this.manager.request<CollectionResourceDataDocument<UserResource>>({
      url: urls[0],
      method: 'GET',
    });
    const paginationState = getPaginationState(request);

    await this.render({ store: this.manager, request });
    await request;
    await this.h.rerender();

    await this.h.click('[data-test-load-next]');
    await paginationState.nextRequest;
    await this.h.rerender();

    assert.deepEqual(renderedNames(this.element), ['Chris Thoburn', 'Leo Euclides'], 'both pages render');
    assert.false(paginationState.hasNext, 'the run ends at the second page');
    assert.dom('[data-test-load-next]').doesNotExist('no next sentinel renders at the end');

    const refreshed = reloadRequest(this.manager, urls[1]);
    await paginationState.adoptPage(refreshed);
    await this.h.rerender();

    assert.true(paginationState.hasNext, 'the re-requested document extends the collection');
    assert.equal(paginationState.nextRequest, null, 'the next page is not requested until loadNext fires');
    assert.dom('[data-test-load-next]').exists('the next sentinel renders again');
    assert.deepEqual(
      renderedNames(this.element),
      ['Chris Thoburn', 'Leo Euclides'],
      'the run is unchanged until the next page loads'
    );

    await this.h.click('[data-test-load-next]');
    await paginationState.nextRequest;
    await this.h.rerender();

    assert.deepEqual(
      renderedNames(this.element),
      ['Chris Thoburn', 'Leo Euclides', 'Mehul Chaudhari'],
      'the new page is appended to the run'
    );
    assert.equal(Array.from(paginationState.pages).length, 3, 'the run holds 3 pages');
    assert.false(paginationState.hasNext, 'the run ends at the new page');
  })

  .for('reloading a page in an infinite run whose next page is gone drops the pages after it')
  .use<{ store: RequestManager; request: CollectionRequest }>(async function (assert) {
    const urls = pageUrls(3);

    await GET(this, 'users/1', () => ({
      data: [users[0]],
      links: { first: urls[0], self: urls[0], next: urls[1] },
    }));
    await GET(this, 'users/2', () => ({
      data: [users[1]],
      links: { first: urls[0], prev: urls[0], self: urls[1], next: urls[2] },
    }));
    await GET(this, 'users/3', () => ({
      data: [users[2]],
      links: { first: urls[0], prev: urls[1], self: urls[2] },
    }));
    // the last page was removed: the middle page is now the end of the collection
    await GET(this, 'users/2', () => ({
      data: [users[1]],
      links: { first: urls[0], prev: urls[0], self: urls[1], next: null },
    }));

    const request = this.manager.request<CollectionResourceDataDocument<UserResource>>({
      url: urls[0],
      method: 'GET',
    });
    const paginationState = getPaginationState(request);

    await this.render({ store: this.manager, request });
    await request;
    await this.h.rerender();

    await this.h.click('[data-test-load-next]');
    await paginationState.nextRequest;
    await this.h.rerender();
    await this.h.click('[data-test-load-next]');
    await paginationState.nextRequest;
    await this.h.rerender();

    assert.deepEqual(
      renderedNames(this.element),
      ['Chris Thoburn', 'Leo Euclides', 'Mehul Chaudhari'],
      'all 3 pages render'
    );

    const refreshed = reloadRequest(this.manager, urls[1]);
    await paginationState.adoptPage(refreshed);
    await this.h.rerender();

    assert.deepEqual(
      Array.from(paginationState.data).map((user) => user.attributes.name),
      ['Chris Thoburn', 'Leo Euclides'],
      'the page after the re-requested one drops out of the run'
    );
    assert.deepEqual(
      renderedNames(this.element),
      ['Chris Thoburn', 'Leo Euclides'],
      'the dropped page no longer renders'
    );
    assert.equal(Array.from(paginationState.pages).length, 2, 'the run holds 2 pages');
    assert.false(paginationState.hasNext, 'the run ends at the re-requested page');
    assert.equal(paginationState.nextRequest, null, 'there is no next page to request');
    assert.dom('[data-test-load-next]').doesNotExist('no next sentinel renders');
  })

  .for('reloading the entry page of an infinite run whose previous page is gone drops the pages before it')
  .use<{ store: RequestManager; request: CollectionRequest }>(async function (assert) {
    const urls = pageUrls(2);

    await GET(this, 'users/2', () => ({
      data: [users[1]],
      links: { prev: urls[0], self: urls[1] },
    }));
    await GET(this, 'users/1', () => ({
      data: [users[0]],
      links: { self: urls[0], next: urls[1] },
    }));
    // the page before was removed: the entry page is now the start of the collection
    await GET(this, 'users/2', () => ({
      data: [users[1]],
      links: { prev: null, self: urls[1] },
    }));

    const request = this.manager.request<CollectionResourceDataDocument<UserResource>>({
      url: urls[1],
      method: 'GET',
    });
    const paginationState = getPaginationState(request);

    await this.render({ store: this.manager, request });
    await request;
    await this.h.rerender();

    assert.true(paginationState.hasPrevious, 'the entry page has a previous page');

    await this.h.click('[data-test-load-prev]');
    await paginationState.previousRequest;
    await this.h.rerender();

    assert.deepEqual(renderedNames(this.element), ['Chris Thoburn', 'Leo Euclides'], 'the previous page is prepended');
    assert.false(paginationState.hasPrevious, 'the run starts at the first page');

    const refreshed = reloadRequest(this.manager, urls[1]);
    await paginationState.adoptPage(refreshed);
    await this.h.rerender();

    assert.deepEqual(
      Array.from(paginationState.data).map((user) => user.attributes.name),
      ['Leo Euclides'],
      'the page before the re-requested one drops out of the run'
    );
    assert.deepEqual(renderedNames(this.element), ['Leo Euclides'], 'the dropped page no longer renders');
    assert.equal(Array.from(paginationState.pages).length, 1, 'the run holds 1 page');
    assert.false(paginationState.hasPrevious, 'the run starts at the re-requested page');
    assert.equal(paginationState.previousRequest, null, 'there is no previous page to request');
    assert.dom('[data-test-load-prev]').doesNotExist('no previous sentinel renders');
    assert.equal(paginationState.activePageRequest, refreshed, 'the re-requested page tracks its new request');
  })

  .for('reloading a page whose next cursor changed drops the stale branch and follows the new one')
  .use<{ store: RequestManager; request: CollectionRequest }>(async function (assert) {
    const start = buildBaseURL({ resourcePath: 'users/1' });
    const staleCursor = buildBaseURL({ resourcePath: 'users/cursor-stale' });
    const freshCursor = buildBaseURL({ resourcePath: 'users/cursor-fresh' });

    await GET(this, 'users/1', () => ({
      data: [users[0]],
      links: { self: start, next: staleCursor },
    }));
    await GET(this, 'users/cursor-stale', () => ({
      data: [users[1]],
      links: { prev: start, self: staleCursor },
    }));
    // the collection changed underneath the cursor: the first page now
    // continues at a different cursor
    await GET(this, 'users/1', () => ({
      data: [users[0]],
      links: { self: start, next: freshCursor },
    }));
    await GET(this, 'users/cursor-fresh', () => ({
      data: [users[2]],
      links: { prev: start, self: freshCursor },
    }));

    const request = this.manager.request<CollectionResourceDataDocument<UserResource>>({
      url: start,
      method: 'GET',
    });
    const paginationState = getPaginationState(request);

    await this.render({ store: this.manager, request });
    await request;
    await this.h.rerender();

    await this.h.click('[data-test-load-next]');
    await paginationState.nextRequest;
    await this.h.rerender();

    assert.deepEqual(
      renderedNames(this.element),
      ['Chris Thoburn', 'Leo Euclides'],
      'the stale cursor page is in the run'
    );
    assert.false(paginationState.hasNext, 'the run ends at the stale cursor page');

    const refreshed = reloadRequest(this.manager, start);
    await paginationState.adoptPage(refreshed);
    await this.h.rerender();

    assert.equal(paginationState.activePage?.nextLink, freshCursor, 'the next link follows the re-requested document');
    assert.deepEqual(
      Array.from(paginationState.data).map((user) => user.attributes.name),
      ['Chris Thoburn'],
      'the stale cursor page drops out of the run'
    );
    assert.deepEqual(renderedNames(this.element), ['Chris Thoburn'], 'the stale cursor page no longer renders');
    assert.equal(Array.from(paginationState.pages).length, 1, 'the run holds 1 page');
    assert.true(paginationState.hasNext, 'the fresh cursor page can be loaded');
    assert.dom('[data-test-load-next]').exists('the next sentinel renders');

    await this.h.click('[data-test-load-next]');
    await paginationState.nextRequest;
    await this.h.rerender();

    assert.deepEqual(
      renderedNames(this.element),
      ['Chris Thoburn', 'Mehul Chaudhari'],
      'the fresh cursor page is appended to the run'
    );
    assert.equal(Array.from(paginationState.pages).length, 2, 'the run holds 2 pages');
    assert.false(paginationState.hasNext, 'the run ends at the fresh cursor page');
  })

  .build();
