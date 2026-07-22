/**
 * @module @warp-drive/ember
 */
import { assert } from '@warp-drive/build-config/macros';

import type { ReactiveDocument } from '../reactive.ts';
import type { Future } from '../request.ts';
import { PageCache } from './page-cache.ts';
import { memoized, signal } from './reactivity/signal';

const PaginationCacheMap = new Map<string, PaginationCache>();

export class PaginationCache<RT = unknown, E = unknown> {
  @signal declare initialPage: Readonly<PageCache<RT, E>> | null;
  @signal declare firstPage: Readonly<PageCache<RT, E>> | null;
  @signal declare totalPages: number;
  declare pagesCache: Map<string, PageCache>;

  constructor() {
    this.pagesCache = new Map<string, PageCache>();
    this.totalPages = 0;
  }

  start(url: string, request: Future<RT>): Readonly<PageCache<RT, E>> {
    this.initialPage = this.loadPage(url, request);
    return this.initialPage;
  }

  getPageCache(url: string): Readonly<PageCache<RT, E>> {
    let state = this.pagesCache.get(url);
    if (!state) {
      state = new PageCache<RT, E>(this, url);
      this.pagesCache.set(url, state);
    }

    return state as Readonly<PageCache<RT, E>>;
  }

  loadPage(url: string, request: Future<RT> | null): Readonly<PageCache<RT, E>> {
    const page = this.getPageCache(url);
    if (!page.isLoaded && request) {
      assert('Expected a request to a load a page', request);
      void page.load(request).then((document) => {
        this.updateFirstPage(page);
        if (document) {
          this.totalPages = this.getTotalPages(document);
        }
      });
    }
    return page;
  }

  updateFirstPage(page: Readonly<PageCache<RT, E>>): void {
    const maybeFirstPage = page.before ?? page;
    if (!this.firstPage || this.firstPage?.pageNumber > maybeFirstPage.pageNumber) {
      this.firstPage = maybeFirstPage;
    }
  }

  getTotalPages(document: ReactiveDocument<unknown>): number {
    const totalPages = (document.meta?.totalPages ?? 0) as number;
    assert(
      'Could not determine the total pages from the document meta. Make sure to include a `totalPages` property.',
      totalPages > 0
    );
    return totalPages;
  }
}

export class PagedCache<RT = unknown, E = unknown> extends PaginationCache<RT, E> {
  @memoized
  get pages(): Iterable<Readonly<PageCache<RT, E>>> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    return {
      *[Symbol.iterator]() {
        let page: Readonly<PageCache<RT, E>> | null = self.firstPage;
        while (page) {
          yield page;
          page = page.after;
        }
      },
    };
  }

  @memoized
  get data(): Iterable<RT> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    return {
      *[Symbol.iterator]() {
        let page: Readonly<PageCache<RT, E>> | null = self.firstPage;
        while (page) {
          if (page.data) {
            for (const item of page.data as []) {
              yield item;
            }
          }
          page = page.after;
        }
      },
    };
  }
}
/*
export class InfiniteCollectionState<RT = unknown, E = unknown> extends PaginationCache<RT, E> {
  @memoized
  get prev(): string | null {
    return this.firstPage.selfLink;
  }

  @memoized
  get next(): string | null {
    return this.lastPage.selfLink;
  }

  activatePage = (page: Readonly<PageCache>): void => {
    this.activePage = page as Readonly<PageCache<RT, E>>;
  };

  @memoized
  get pages(): Iterable<Readonly<PageCache<RT, E>>> {
    const self = this;
    return {
      *[Symbol.iterator]() {
        let page: Readonly<PageCache<RT, E>> | null = self.startingPage;
        while (page) {
          yield page;
          page = page.next;
        }
      },
    };
  }

  @memoized
  get data(): Iterable<RT> {
    const self = this;
    return {
      *[Symbol.iterator]() {
        let page: Readonly<PageCache<RT, E>> | null = self.startingPage;
        while (page) {
          if (page.data) {
            for (const item of page.data) {
              yield item;
            }
          }
          page = page.next;
        }
      },
    };
  }
}
*/
/**
 * Get the pagination state for a given request, this will return the same
 * PaginationCache instance for the same request, even if the future is
 * a different instance based on the cache identity of the request.
 *
 * ```ts
 * import { getPaginationCache } from '@warp-drive/ember';
 *
 * const future = store.request(query('user', { page: { size: 10 } }));
 * const state = getPaginationCache(future);
 * ```
 *
 * @public
 * @static
 * @for @warp-drive/ember
 * @param future
 * @return {PaginationCache}
 */
/**
 * Clears the module-level pagination cache used by {@link getPaginationCache}.
 * Primarily intended for test isolation, since the cache is keyed by url and
 * otherwise persists for the lifetime of the module.
 *
 * @public
 * @static
 * @for @warp-drive/ember
 */
export function clearPaginationCache(): void {
  PaginationCacheMap.clear();
}

export function getPaginationCache<RT, E>(
  key: string,
  mode: 'paged' | 'infinite' = 'paged'
): Readonly<PaginationCache<RT, E>> {
  let state = PaginationCacheMap.get(key);

  if (!state) {
    state = new PagedCache<RT, E>();
    PaginationCacheMap.set(key, state);
  }

  return state as PaginationCache<RT, E>;
}
