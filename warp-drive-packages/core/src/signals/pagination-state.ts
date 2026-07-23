/**
 * @module @warp-drive/ember
 */
import { assert } from '@warp-drive/build-config/macros';

import type { RequestManager, Store } from '../index.ts';
import type { ReactiveDocument } from '../reactive.ts';
import type { Future } from '../request.ts';
import type { ContentItem, PageCache } from './page-cache.ts';
import { getHref } from './page-cache.ts';
import { getPaginationCache, type PaginationCache } from './pagination-cache.ts';
import { getPaginationLinks, type PaginationLink, type PaginationLinks } from './pagination-links.ts';
import { defineSignal, memoized } from './reactivity/signal.ts';

export type PaginationMode = 'infinite' | 'paged';

/**
 * The per-component, local pagination state. It houses the state that is unique
 * to a single component instance — the active page and navigation — while
 * referencing a shared {@link PaginationCache} for the page graph and data.
 *
 * This is the object yielded by the `<Paginate />` component.
 */
export class PaginationState<RT = unknown, E = unknown> {
  /** @internal */
  declare store: Store | RequestManager;
  declare mode: PaginationMode;
  /** @internal */
  declare request: Future<RT>;

  declare paginationCache: PaginationCache<RT, E> | null;
  declare activePage: Readonly<PageCache<RT, E>> | null;
  declare initialPage: Readonly<PageCache<RT, E>> | null;

  constructor(store: Store | RequestManager, request: Future<RT>, mode: PaginationMode = 'paged') {
    this.store = store;
    this.request = request;
    this.mode = mode;

    void this.setup();
  }

  @memoized
  get activePageRequest(): Future<RT> | null {
    return this.activePage?.request ?? null;
  }

  @memoized
  get totalPages(): number {
    return this.paginationCache?.totalPages ?? 0;
  }

  @memoized
  get pages(): Iterable<Readonly<PageCache<RT, E>>> {
    return this.paginationCache?.pages ?? [];
  }

  @memoized
  get data(): Iterable<ContentItem<RT>> {
    return this.paginationCache?.data ?? [];
  }

  @memoized
  get paginationLinks(): Readonly<PaginationLinks<RT, E>> {
    return getPaginationLinks<RT, E>(this);
  }

  @memoized
  get links(): ReadonlyArray<Readonly<PaginationLink>> {
    return this.paginationLinks.links;
  }

  async setup(): Promise<void> {
    const document = await this.request;
    const content = document.content as ReactiveDocument<unknown>;
    const selfLink = getHref(content.links?.self);
    const firstLink = getHref(content.links?.first);
    assert('Expected the initial document to have a self link', selfLink);

    const cacheKey = firstLink ?? selfLink ?? '';
    const cache = getPaginationCache<RT, E>(cacheKey);
    this.paginationCache = cache;
    cache.totalPages = cache.getTotalPages(content);
    this.activePage = this.initialPage = cache.loadPage(selfLink, this.request);
  }

  /**
   * Loads the prev page based on the active page's links.
   */
  loadPrev = async (): Promise<RT | null> => {
    const prevLink = this.activePage?.prevLink;
    if (prevLink) {
      return this.loadPage(prevLink);
    }

    return null;
  };

  /**
   * Loads the next page based on the active page's links.
   */
  loadNext = async (): Promise<RT | null> => {
    const nextLink = this.activePage?.nextLink;
    if (nextLink) {
      return this.loadPage(nextLink);
    }

    return null;
  };

  /**
   * Loads a specific page by its URL and makes it the active page.
   */
  loadPage = async (url: string): Promise<RT | null> => {
    const cache = this.paginationCache;
    assert('Expected the pagination cache to be set up before loading a page', cache);

    const page = cache.getPageCache(url);
    this.activePage = page;

    if (!page.isLoaded) {
      const request = this.store.request({ method: 'GET', url });
      cache.loadPage(url, request as Future<RT>);
      await page.request;
      return page.value;
    }

    return page.value;
  };
}

defineSignal(PaginationState.prototype, 'paginationCache', null);
defineSignal(PaginationState.prototype, 'activePage', null);
defineSignal(PaginationState.prototype, 'initialPage', null);

export class PagedState<RT = unknown, E = unknown> extends PaginationState<RT, E> {}

export class InfiniteState<RT = unknown, E = unknown> extends PaginationState<RT, E> {}

const PaginationStateCache = new WeakMap<Future<unknown>, PaginationState>();

/**
 * Get the {@link PaginationState} for a given request. Returns the same instance
 * for the same request future, so that repeated calls (e.g. in a template, or
 * alongside the `<Paginate />` component using the same request) share the same
 * local pagination state. Keyed by request identity, just like
 * {@link getRequestState}.
 *
 * @public
 * @static
 * @for @warp-drive/ember
 */
export function getPaginationState<RT, E>(
  store: Store | RequestManager,
  request: Future<RT>,
  mode: PaginationMode = 'paged'
): PaginationState<RT, E> {
  let state = PaginationStateCache.get(request);

  if (!state) {
    state =
      mode === 'infinite'
        ? new InfiniteState<RT, E>(store, request, mode)
        : new PagedState<RT, E>(store, request, mode);
    PaginationStateCache.set(request, state);
  }

  return state as PaginationState<RT, E>;
}
