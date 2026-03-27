/**
 * @module @warp-drive/ember
 */
import { assert } from '@warp-drive/build-config/macros';

import type { ReactiveDocument } from '../reactive.ts';
import type { Future } from '../request.ts';
import type { StructuredErrorDocument } from '../types/request.ts';
import { PageState } from './page-state.ts';
import { memoized, signal } from './reactivity/signal';

const PaginationCache = new Map<string, PaginationState>();

export class PaginationState<RT = unknown, E = unknown> {
  @signal declare initialPage: Readonly<PageState<RT, E>>;
  @signal declare totalPages: number;
  declare pagesCache: Map<string, PageState>;

  constructor(request: Future<RT>) {
    this.pagesCache = new Map<string, PageState>();
    this.initialPage = this.getPageState(request);
    this.totalPages = 0;
  }

  getPageState(futureOrLink: Future<unknown> | string): Readonly<PageState<RT, E>> {
    const url = typeof futureOrLink === 'string' ? futureOrLink : futureOrLink.toString();
    let state = this.pagesCache.get(url);

    if (!state) {
      state = new PageState<RT, E>(this, futureOrLink as Future<RT>);
      this.pagesCache.set(url, state);
    }

    return state as Readonly<PageState<RT, E>>;
  }

  async loadPage(page: PageState<RT, E>, request: Future<RT> | null): Promise<ReactiveDocument<RT[]> | null> {
    if (!page.isLoaded && request) {
      assert('Expected a request to a load a page', request);
      const document = await page.load(request);
      if (document) {
        this.totalPages = this.getTotalPages(document);
      }
      return document;
    }

    return null;
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
  @signal declare firstPage: Readonly<PageState<RT, E>>;
  @signal declare lastPage: Readonly<PageState<RT, E>>;

  constructor(request: Future<RT>) {
    super(request);

    assert('Expected the initial page to have a first link', this.initialPage.firstLink);
    this.firstPage = this.getPageState(this.initialPage.firstLink);
    assert('Expected the initial page to have a last link', this.initialPage.lastLink);
    this.lastPage = this.getPageState(this.initialPage.lastLink);
  }

  @memoized
  get pages(): Iterable<Readonly<PageState<RT, E>>> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    return {
      *[Symbol.iterator]() {
        let page: Readonly<PageState<RT, E>> | null = self.firstPage;
        while (page) {
          yield page;
          page = page.next;
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
            for (const item of page.data) {
              yield item;
            }
          }
          page = page.next;
        }
      },
    };
  }

  async loadPage(page: Readonly<PageState<RT, E>>, request: Future<RT> | null): Promise<ReactiveDocument<RT[]> | null> {
    const document = await super.loadPage(page, request);
    return document;
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
export function getPaginationState<RT, E>(
  key: string,
  future: Future<RT>,
  mode: 'paged' | 'infinite' = 'paged'
): Readonly<PaginationState<RT, StructuredErrorDocument<E>>> {
  let state = PaginationCache.get(key);

  if (!state) {
    state = new PagedState<RT, E>(future);
    PaginationCache.set(key, state);
  }

  return state as Readonly<PaginationState<RT, StructuredErrorDocument<E>>>;
}
