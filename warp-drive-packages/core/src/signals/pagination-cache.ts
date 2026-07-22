/**
 * @module @warp-drive/ember
 */
import { assert } from '@warp-drive/build-config/macros';

import type { ReactiveDocument } from '../reactive.ts';
import type { Future } from '../request.ts';
import { PageCache } from './page-cache.ts';
import { memoized, signal } from './reactivity/signal';

const PaginationCacheMap = new Map<string, PaginationCache>();

/**
 * The global, shared cache for a paginated collection. Keyed by the collection's
 * `first` (or `self`) link, so that multiple components paging the same collection
 * share loaded pages, the page graph, and `totalPages`.
 *
 * This holds only shared, request-agnostic data. Per-component state (the active
 * page, navigation) lives on {@link PaginationState}.
 */
export class PaginationCache<RT = unknown, E = unknown> {
  @signal declare firstPage: Readonly<PageCache<RT, E>> | null;
  @signal declare totalPages: number;
  declare pagesCache: Map<string, PageCache>;

  constructor() {
    this.pagesCache = new Map<string, PageCache>();
    this.firstPage = null;
    this.totalPages = 0;
  }

  getPageCache(url: string): Readonly<PageCache<RT, E>> {
    let page = this.pagesCache.get(url);
    if (!page) {
      page = new PageCache<RT, E>(this, url);
      this.pagesCache.set(url, page);
    }

    return page as Readonly<PageCache<RT, E>>;
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
    if (!this.firstPage || this.firstPage.pageNumber > maybeFirstPage.pageNumber) {
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

/**
 * Get the shared {@link PaginationCache} for a given cache key (the collection's
 * `first` or `self` link). Returns the same instance for the same key for the
 * lifetime of the module.
 *
 * @public
 * @static
 * @for @warp-drive/ember
 */
export function getPaginationCache<RT, E>(key: string): PaginationCache<RT, E> {
  let cache = PaginationCacheMap.get(key);

  if (!cache) {
    cache = new PaginationCache<RT, E>();
    PaginationCacheMap.set(key, cache);
  }

  return cache as PaginationCache<RT, E>;
}

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
