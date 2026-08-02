/**
 * @module @warp-drive/ember
 */
import { assert } from '@warp-drive/build-config/macros';

import type { RequestManager, Store } from '../index.ts';
import type { ReactiveDocument } from '../reactive.ts';
import type { Future } from '../request.ts';
import type { ContentItem, PageCache } from './page-cache.ts';
import { getHref } from './page-cache.ts';
import { getPaginationCache, type PageHints, type PaginationCache } from './pagination-cache.ts';
import { defineSignal, memoized } from './reactivity/signal.ts';

/**
 * The per-component, local pagination state. It houses the state that is unique
 * to a single component instance — the active page and navigation — while
 * referencing a shared {@link PaginationCache} for the page graph and data.
 *
 * This is the object yielded by the `<Paginate />` component.
 *
 * It exposes two navigation surfaces over the same shared page graph, and the
 * consumer picks one by which properties it renders — there is no mode flag:
 *
 * - **Paged** (single-page view): render {@link activePageRequest}, navigate with
 *   {@link loadPage} (what the numbered/relational links call). Reads
 *   {@link activePage}.
 * - **Infinite** (accumulated view): render {@link data}, wrap
 *   {@link nextRequest}/{@link previousRequest} in `<Request>` for loading state,
 *   and grow the view with {@link loadNext}/{@link loadPrev}.
 */
export class PaginationState<RT = unknown, E = unknown> {
  /** @internal */
  declare store: Store | RequestManager;
  /** @internal */
  declare request: Future<RT>;
  /** @internal */
  declare pageHints: PageHints | undefined;

  /** The shared page graph and data this component reads from. */
  declare paginationCache: PaginationCache<RT, E> | null;

  /**
   * The page the paged surface is currently showing. Starts at
   * {@link initialPage} and moves whenever {@link loadPage} runs (for example a
   * numbered link is clicked).
   */
  declare activePage: Readonly<PageCache<RT, E>> | null;

  /** The page this component first loaded, used to seed the active page and frontier. */
  declare initialPage: Readonly<PageCache<RT, E>> | null;

  /**
   * The first and last loaded pages of the contiguous run this component is
   * viewing. Drives the infinite surface — {@link data} walks from
   * `frontierStart` to `frontierEnd`, and {@link loadPrev}/{@link loadNext} extend
   * them backward/forward. Both seed to {@link initialPage}; a purely paged
   * consumer never extends them, so they stay put and are effectively unused.
   */
  declare frontierStart: Readonly<PageCache<RT, E>> | null;
  declare frontierEnd: Readonly<PageCache<RT, E>> | null;

  constructor(request: Future<RT>, pageHints?: PageHints) {
    this.store = request.requester;
    this.request = request;
    this.pageHints = pageHints;

    void this.setup();
  }

  /**
   * The request for the {@link activePage}, for the paged surface to render. This
   * is what a single-page view wraps in a `<Request>` to show the active page's
   * loading, error, and content states.
   */
  @memoized
  get activePageRequest(): Future<RT> | null {
    return this.activePage?.request ?? null;
  }

  /**
   * The total number of pages in the collection, or `0` when it is unknown (for
   * example a cursor-based collection that reports no total).
   */
  @memoized
  get totalPages(): number {
    return this.paginationCache?.totalPages ?? 0;
  }

  /**
   * Every page loaded into the shared cache, in order. This is the whole graph
   * across all components sharing the collection, not just this component's
   * frontier; for the accumulated items of an infinite view use {@link data}.
   */
  @memoized
  get pages(): Iterable<Readonly<PageCache<RT, E>>> {
    return this.paginationCache?.pages ?? [];
  }

  /**
   * The accumulated items across the loaded run, from {@link frontierStart} to
   * {@link frontierEnd} inclusive — the single set an infinite collection renders.
   * Grows as {@link loadNext}/{@link loadPrev} extend the frontier. Scoped to this
   * component's frontier (not the shared cache), so components paging the same
   * collection to different extents each see only what they have scrolled through.
   */
  @memoized
  get data(): Iterable<ContentItem<RT>> {
    const start = this.frontierStart;
    const end = this.frontierEnd;
    return {
      *[Symbol.iterator]() {
        let page: Readonly<PageCache<RT, E>> | null = start;
        while (page) {
          if (page.data) {
            for (const item of page.data as ContentItem<RT>[]) {
              yield item;
            }
          }
          if (page === end) {
            break;
          }
          page = page.after;
        }
      },
    };
  }

  /**
   * Whether a page exists after the forward frontier — i.e. there is more to load
   * going forward. Use to hide the trailing load-more sentinel at end-of-list.
   */
  @memoized
  get hasNext(): boolean {
    return Boolean(this.frontierEnd?.nextLink);
  }

  /**
   * Whether a page exists before the backward frontier.
   */
  @memoized
  get hasPrevious(): boolean {
    return Boolean(this.frontierStart?.prevLink);
  }

  /**
   * The request for the page just after the forward frontier, for the infinite
   * surface. `null` until {@link loadNext} fires it (so a `<Request>` wrapping it
   * renders its idle block), the in-flight `Future` while that page loads, then
   * `null` again once the frontier advances onto it. Also `null` at end-of-list.
   */
  @memoized
  get nextRequest(): Future<RT> | null {
    const url = this.frontierEnd?.nextLink;
    if (!url) {
      return null;
    }
    return this.paginationCache?.getPageCache(url).request ?? null;
  }

  /**
   * The request for the page just before the backward frontier. Mirror of
   * {@link nextRequest} for {@link loadPrev}.
   */
  @memoized
  get previousRequest(): Future<RT> | null {
    const url = this.frontierStart?.prevLink;
    if (!url) {
      return null;
    }
    return this.paginationCache?.getPageCache(url).request ?? null;
  }

  async setup(): Promise<void> {
    const document = await this.request;
    const content = document.content as ReactiveDocument<unknown>;
    const selfLink = getHref(content.links?.self);
    const firstLink = getHref(content.links?.first);
    assert('Expected the initial document to have a self link', selfLink);

    const cacheKey = firstLink ?? selfLink ?? '';
    const cache = getPaginationCache<RT, E>(cacheKey);
    cache.installPageHints(this.pageHints);
    this.paginationCache = cache;
    cache.totalPages = cache.getTotalPages(content);
    this.activePage = this.initialPage = cache.loadPage(selfLink, this.request);
    this.frontierStart = this.frontierEnd = this.initialPage;
  }

  /**
   * Extends the backward frontier by one page, prepending it to {@link data}.
   * The frontier advances only once the page has loaded, so
   * {@link previousRequest} tracks the in-flight page meanwhile. Returns the
   * loaded value, or `null` when there is no previous page.
   */
  loadPrev = async (): Promise<RT | null> => {
    return this._extend('prev');
  };

  /**
   * Extends the forward frontier by one page, appending it to {@link data}.
   * Mirror of {@link loadPrev}.
   */
  loadNext = async (): Promise<RT | null> => {
    return this._extend('next');
  };

  /** @internal */
  _extend = async (dir: 'prev' | 'next'): Promise<RT | null> => {
    const cache = this.paginationCache;
    assert('Expected the pagination cache to be set up before loading a page', cache);

    const frontier = dir === 'next' ? this.frontierEnd : this.frontierStart;
    const url = dir === 'next' ? frontier?.nextLink : frontier?.prevLink;
    if (!url) {
      return null;
    }

    const page = cache.getPageCache(url);
    if (!page.isRequested) {
      const request = this.store.request({ method: 'GET', url });
      cache.loadPage(url, request as Future<RT>);
    }

    await page.request;

    // Advance the frontier only after the load resolves. While loading, the
    // frontier still points at the previous page, so `nextRequest`/`prevRequest`
    // resolves to this in-flight page and a wrapping `<Request>` shows loading.
    if (dir === 'next') {
      this.frontierEnd = page;
    } else {
      this.frontierStart = page;
    }

    return page.value;
  };

  /**
   * Loads a specific page by its URL and makes it the {@link activePage},
   * requesting it first if it is not already loaded. This is the paged surface's
   * navigation entry point, called by the numbered and relational links.
   *
   * It is a stable reference, so it can be passed directly as a click handler.
   * Returns the page's value, or `null` if it has none.
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
defineSignal(PaginationState.prototype, 'frontierStart', null);
defineSignal(PaginationState.prototype, 'frontierEnd', null);

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
export function getPaginationState<RT, E>(request: Future<RT>, pageHints?: PageHints): PaginationState<RT, E> {
  let state = PaginationStateCache.get(request);

  if (!state) {
    state = new PaginationState<RT, E>(request, pageHints);
    PaginationStateCache.set(request, state);
  }

  return state as PaginationState<RT, E>;
}
