/**
 * @module @warp-drive/ember
 */
import { assert } from '@warp-drive/build-config/macros';

import type { ReactiveDocument } from '../reactive.ts';
import type { Future } from '../request.ts';
import { PageState } from './page-state.ts';
import { memoized, signal } from './reactivity/signal';

const PaginationCache = new Map<string, PaginationState>();

export class PaginationState<RT = unknown, E = unknown> {
  @signal declare initialPage: Readonly<PageState<RT, E>> | null;
  @signal declare firstPage: Readonly<PageState<RT, E>> | null;
  @signal declare totalPages: number;
  declare pagesCache: Map<string, PageState>;

  constructor() {
    this.pagesCache = new Map<string, PageState>();
    this.totalPages = 0;
  }

  start(url: string, request: Future<RT>): Readonly<PageState<RT, E>> {
    this.initialPage = this.loadPage(url, request);
    return this.initialPage;
  }

  getPageState(url: string): Readonly<PageState<RT, E>> {
    let state = this.pagesCache.get(url);
    if (!state) {
      state = new PageState<RT, E>(this, url);
      this.pagesCache.set(url, state);
    }

    return state as Readonly<PageState<RT, E>>;
  }

  loadPage(url: string, request: Future<RT> | null): Readonly<PageState<RT, E>> {
    const page = this.getPageState(url);
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

  updateFirstPage(page: Readonly<PageState<RT, E>>): void {
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

export class PagedState<RT = unknown, E = unknown> extends PaginationState<RT, E> {
  @memoized
  get pages(): Iterable<Readonly<PageState<RT, E>>> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    return {
      *[Symbol.iterator]() {
        let page: Readonly<PageState<RT, E>> | null = self.firstPage;
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
        let page: Readonly<PageState<RT, E>> | null = self.firstPage;
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
export class InfiniteCollectionState<RT = unknown, E = unknown> extends PaginationState<RT, E> {
  @memoized
  get prev(): string | null {
    return this.firstPage.selfLink;
  }

  @memoized
  get next(): string | null {
    return this.lastPage.selfLink;
  }

  activatePage = (page: Readonly<PageState>): void => {
    this.activePage = page as Readonly<PageState<RT, E>>;
  };

  @memoized
  get pages(): Iterable<Readonly<PageState<RT, E>>> {
    const self = this;
    return {
      *[Symbol.iterator]() {
        let page: Readonly<PageState<RT, E>> | null = self.startingPage;
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
        let page: Readonly<PageState<RT, E>> | null = self.startingPage;
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
 * PaginationState instance for the same request, even if the future is
 * a different instance based on the cache identity of the request.
 *
 * ```ts
 * import { getPaginationState } from '@warp-drive/ember';
 *
 * const future = store.request(query('user', { page: { size: 10 } }));
 * const state = getPaginationState(future);
 * ```
 *
 * @public
 * @static
 * @for @warp-drive/ember
 * @param future
 * @return {PaginationState}
 */
/**
 * Clears the module-level pagination cache used by {@link getPaginationState}.
 * Primarily intended for test isolation, since the cache is keyed by url and
 * otherwise persists for the lifetime of the module.
 *
 * @public
 * @static
 * @for @warp-drive/ember
 */
export function clearPaginationCache(): void {
  PaginationCache.clear();
}

export function getPaginationState<RT, E>(
  key: string,
  mode: 'paged' | 'infinite' = 'paged'
): Readonly<PaginationState<RT, E>> {
  let state = PaginationCache.get(key);

  if (!state) {
    state = new PagedState<RT, E>();
    PaginationCache.set(key, state);
  }

  return state as PaginationState<RT, E>;
}
