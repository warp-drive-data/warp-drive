/**
 * @module @warp-drive/ember
 */
import { assert } from '@warp-drive/build-config/macros';

import type { ReactiveDocument } from '../reactive.ts';
import type { Future } from '../request.ts';
import type { ContentItem } from './page-cache.ts';
import { PageCache } from './page-cache.ts';
import { memoized, signal } from './reactivity/signal';

const PaginationCacheMap = new Map<string, PaginationCache>();

/**
 * A hint function for extracting the `currentPage` and `totalPages` from a loaded
 * document. Provided by the consumer via `<Paginate @pageHints={{...}} />` when the
 * response does not expose these values through the default `meta` locations.
 *
 * Since these values are attached to the shared {@link PaginationCache}, the hint is
 * a property of the *collection*, not the component. Every `<Paginate />` sharing a
 * collection must provide the same function reference — define it once at module
 * scope and import it everywhere.
 *
 * @public
 */
export interface PageHints {
  (document: ReactiveDocument<unknown>): { currentPage: number; totalPages: number };
}

/**
 * The default {@link PageHints}. Reads `currentPage`/`page` and `totalPages` from the
 * document `meta`, matching the behavior used before `pageHints` was configurable.
 * Used whenever the consumer does not provide a `pageHints` function.
 *
 * @public
 */
export const defaultPageHints: PageHints = (document) => {
  const currentPage = (document.meta?.page ?? document.meta?.currentPage ?? 0) as number;
  const totalPages = (document.meta?.totalPages ?? 0) as number;
  return { currentPage, totalPages };
};

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
  /**
   * Whether this collection has server-known page numbers. Stays `false` for
   * cursor-based collections (opaque `prev`/`next`, no index/total), which drives
   * whether numbered links are produced. Set once a {@link PageHints} yields a real
   * `currentPage`/`totalPages`.
   */
  @signal declare isNumbered: boolean;
  declare pagesCache: Map<string, PageCache>;
  pageHints: PageHints = defaultPageHints;

  constructor() {
    this.pagesCache = new Map<string, PageCache>();
    this.firstPage = null;
    this.totalPages = 0;
    this.isNumbered = false;
  }

  /**
   * Installs the consumer-provided {@link PageHints} onto the shared cache. The first
   * explicit hint wins; passing `undefined` (no hint) is a no-op that preserves the
   * default. In dev, asserts that components sharing a collection do not provide
   * diverging hint functions.
   */
  installPageHints(pageHints: PageHints | undefined): void {
    if (!pageHints) {
      return;
    }
    if (this.pageHints === defaultPageHints) {
      this.pageHints = pageHints;
      return;
    }
    assert(
      'Received diverging `pageHints` functions for the same paginated collection. Provide the same function reference to every <Paginate /> sharing a collection (define it once at module scope).',
      this.pageHints === pageHints
    );
  }

  /**
   * Runs the active {@link PageHints} against a document.
   *
   * Both values are *hints*, not requirements. A value of `0` means "unknown" —
   * the response did not expose it and no `pageHints` function derived it. When a
   * value is present (`> 0`) it is relied upon (numbered links, total, sparse
   * placement of jumped-to pages); when absent the page graph falls back to pure
   * `prev`/`next` adjacency (as in cursor/infinite streams).
   */
  readPageHints(document: ReactiveDocument<unknown>): { currentPage: number; totalPages: number } {
    const { currentPage, totalPages } = this.pageHints(document);
    if (currentPage > 0 || totalPages > 0) {
      this.isNumbered = true;
    }
    return { currentPage, totalPages };
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
    return this.readPageHints(document).totalPages;
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
  get data(): Iterable<ContentItem<RT>> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    return {
      *[Symbol.iterator]() {
        let page: Readonly<PageCache<RT, E>> | null = self.firstPage;
        while (page) {
          if (page.data) {
            for (const item of page.data as ContentItem<RT>[]) {
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
