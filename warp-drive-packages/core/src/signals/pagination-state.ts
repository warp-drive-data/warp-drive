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
 * The two navigation surfaces a `<Paginate />` component can drive. Selecting
 * one (via the component's `@mode` arg) narrows the yielded state so the two
 * APIs cannot be mixed:
 *
 * - `'paged'` — single-page view, see {@link PagedPaginationState}.
 * - `'infinite'` — accumulated view, see {@link InfinitePaginationState}.
 */
export type PaginateMode = 'paged' | 'infinite';

/**
 * The part of a {@link PaginationState} available to both navigation surfaces.
 */
export interface SharedPaginationState<RT = unknown, E = unknown> {
  /** See {@link PaginationState.totalPages}. */
  readonly totalPages: number;
  /** See {@link PaginationState.adoptPage}. */
  adoptPage(request: Future<RT>): Promise<RT | null>;
  /**
   * The shared page graph and data this component reads from.
   *
   * @internal
   */
  readonly paginationCache: PaginationCache<RT, E> | null;
}

/**
 * The paged (single-page view) surface of a {@link PaginationState}: render
 * {@link PaginationState.activePageRequest | activePageRequest}, navigate with
 * {@link PaginationState.loadPage | loadPage}. This is what the `<Paginate />`
 * component yields in `'paged'` mode (the default).
 */
export interface PagedPaginationState<RT = unknown, E = unknown> extends SharedPaginationState<RT, E> {
  /** See {@link PaginationState.activePage}. */
  readonly activePage: Readonly<PageCache<RT, E>> | null;
  /** See {@link PaginationState.activePageRequest}. */
  readonly activePageRequest: Future<RT> | null;
  /** See {@link PaginationState.loadPage}. */
  loadPage: (url: string) => Promise<RT | null>;
}

/**
 * The infinite (accumulated view) surface of a {@link PaginationState}: render
 * {@link PaginationState.data | data}, grow it with
 * {@link PaginationState.loadNext | loadNext}/{@link PaginationState.loadPrev | loadPrev}.
 * This is what the `<Paginate />` component yields in `'infinite'` mode.
 */
export interface InfinitePaginationState<RT = unknown, E = unknown> extends SharedPaginationState<RT, E> {
  /** See {@link PaginationState.data}. */
  readonly data: Iterable<ContentItem<RT>>;
  /** See {@link PaginationState.pages}. */
  readonly pages: Iterable<Readonly<PageCache<RT, E>>>;
  /** See {@link PaginationState.hasNext}. */
  readonly hasNext: boolean;
  /** See {@link PaginationState.hasPrevious}. */
  readonly hasPrevious: boolean;
  /** See {@link PaginationState.nextRequest}. */
  readonly nextRequest: Future<RT> | null;
  /** See {@link PaginationState.previousRequest}. */
  readonly previousRequest: Future<RT> | null;
  /** See {@link PaginationState.loadNext}. */
  loadNext: () => Promise<RT | null>;
  /** See {@link PaginationState.loadPrev}. */
  loadPrev: () => Promise<RT | null>;
}

/**
 * Resolves a {@link PaginateMode} to the surface it exposes, so a component
 * generic over the mode can yield only that surface.
 */
export type PaginationStateFor<RT = unknown, E = unknown, M extends PaginateMode = 'paged'> = M extends 'infinite'
  ? InfinitePaginationState<RT, E>
  : PagedPaginationState<RT, E>;

/**
 * The per-component, local pagination state. It houses the state that is unique
 * to a single component instance — the active page and navigation — while
 * referencing a shared {@link PaginationCache} for the page graph and data.
 *
 * This is the object yielded by the `<Paginate />` component, narrowed by the
 * component's `@mode` arg to one of its two navigation surfaces so the two
 * APIs cannot be mixed:
 *
 * - **Paged** (`@mode="paged"`, the default): {@link PagedPaginationState} —
 *   render {@link activePageRequest}, navigate with {@link loadPage} (what the
 *   numbered/relational links call). Reads {@link activePage}.
 * - **Infinite** (`@mode="infinite"`): {@link InfinitePaginationState} — render
 *   {@link data}, wrap {@link nextRequest}/{@link previousRequest} in `<Request>`
 *   for loading state, and grow the view with {@link loadNext}/{@link loadPrev}.
 *
 * Both surfaces read the same shared page graph; the mode only selects which
 * API is exposed.
 *
 * Instances are created via {@link getPaginationState} (or by the `<Paginate />`
 * component on your behalf), never constructed directly.
 *
 * @hideconstructor
 */
export class PaginationState<RT = unknown, E = unknown>
  implements PagedPaginationState<RT, E>, InfinitePaginationState<RT, E>
{
  /** @internal */
  declare private store: Store | RequestManager;
  /** @internal */
  declare private request: Future<RT>;
  /** @internal */
  declare private pageHints: PageHints | undefined;

  /**
   * The shared page graph and data this component reads from.
   *
   * @internal
   */
  declare paginationCache: PaginationCache<RT, E> | null;

  /**
   * The page the paged surface is currently showing. Starts at the page this
   * component first loaded and moves whenever {@link loadPage} runs (for
   * example a numbered link is clicked).
   */
  declare activePage: Readonly<PageCache<RT, E>> | null;

  /**
   * The page this component first loaded, used to seed the active page and frontier.
   *
   * @internal
   */
  declare private initialPage: Readonly<PageCache<RT, E>> | null;

  /**
   * The first and last loaded pages of the contiguous run this component is
   * viewing. Drives the infinite surface — {@link data} walks from
   * `frontierStart` to `frontierEnd`, and {@link loadPrev}/{@link loadNext} extend
   * them backward/forward. Both seed to {@link initialPage}; a purely paged
   * consumer never extends them, so they stay put and are effectively unused.
   *
   * @internal
   */
  declare private frontierStart: Readonly<PageCache<RT, E>> | null;
  /** @internal */
  declare private frontierEnd: Readonly<PageCache<RT, E>> | null;

  /**
   * The request of the latest {@link adoptPage} call — only that call may
   * commit. Later calls (or a {@link loadPage} navigation) claim the slot,
   * superseding in-flight adoptions so the newest navigation always wins.
   * Untracked bookkeeping.
   *
   * @internal
   */
  declare private _adoptTarget: Future<RT> | null;

  constructor(request: Future<RT>, pageHints?: PageHints) {
    this.store = request.requester;
    this.request = request;
    this.pageHints = pageHints;
    this._adoptTarget = null;

    void this.setup();
  }

  /**
   * The request for the {@link activePage}, for the paged surface to render. This
   * is what a single-page view wraps in a `<Request>` to show the active page's
   * loading, error, and content states:
   *
   * ```gts
   * <Paginate @request={{this.request}}>
   *   <:content as |pages|>
   *     <Request @request={{pages.activePageRequest}}>
   *       <:content as |result|>
   *         {{#each result.data as |item|}}...{{/each}}
   *       </:content>
   *     </Request>
   *   </:content>
   * </Paginate>
   * ```
   */
  @memoized
  get activePageRequest(): Future<RT> | null {
    return this.activePage?.request ?? null;
  }

  /**
   * The total number of pages in the collection, or `0` when it is unknown (for
   * example a cursor-based collection that reports no total).
   *
   * ```gts
   * <p>Page {{pages.activePage.pageNumber}} of {{pages.totalPages}}</p>
   * ```
   */
  @memoized
  get totalPages(): number {
    return this.paginationCache?.totalPages ?? 0;
  }

  /**
   * The pages of the run this component is viewing, from the backward frontier
   * to the forward frontier inclusive, in order. Part of the infinite surface:
   * it is the same run as {@link data}, yielding the {@link PageCache} objects
   * instead of their flattened items — use it when the UI needs per-page
   * boundaries or request states.
   *
   * Grows as {@link loadNext}/{@link loadPrev} extend the frontier. Scoped to
   * this component's frontier (not the shared cache), so components paging the
   * same collection to different extents each see only what they have scrolled
   * through. For every page known to the whole collection, see
   * {@link PaginationCache.pages}.
   */
  @memoized
  get pages(): Iterable<Readonly<PageCache<RT, E>>> {
    // oxlint-disable-next-line typescript/no-this-alias
    const self = this;
    return {
      *[Symbol.iterator]() {
        const end = self.frontierEnd;
        let page: Readonly<PageCache<RT, E>> | null = self.frontierStart;
        while (page) {
          yield page;
          if (page === end) {
            break;
          }
          page = page.after;
        }
      },
    };
  }

  /**
   * The accumulated items across the loaded run, from the backward frontier to
   * the forward frontier inclusive — the single set an infinite collection renders.
   * Grows as {@link loadNext}/{@link loadPrev} extend the frontier. Scoped to this
   * component's frontier (not the shared cache), so components paging the same
   * collection to different extents each see only what they have scrolled through.
   *
   * The flattened items of {@link pages}, as one contiguous iterable. For the
   * items of every loaded page in the whole collection, see
   * {@link PaginationCache.data}.
   *
   * ```gts
   * <Paginate @request={{this.request}} @mode="infinite">
   *   <:content as |pages features|>
   *     {{#each pages.data as |item|}}...{{/each}}
   *     {{#if pages.hasNext}}
   *       <button {{on "click" features.loadNext}}>Load more</button>
   *     {{/if}}
   *   </:content>
   * </Paginate>
   * ```
   */
  @memoized
  get data(): Iterable<ContentItem<RT>> {
    // oxlint-disable-next-line typescript/no-this-alias
    const self = this;
    return {
      *[Symbol.iterator]() {
        for (const page of self.pages) {
          if (page.data) {
            yield* page.data as ContentItem<RT>[];
          }
        }
      },
    };
  }

  /**
   * Whether a page exists after the forward frontier — i.e. there is more to load
   * going forward. Use to hide the trailing load-more sentinel at end-of-list:
   *
   * ```gts
   * {{#if pages.hasNext}}
   *   <button {{on "click" features.loadNext}}>Load more</button>
   * {{/if}}
   * ```
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
   *
   * ```gts
   * {{#if pages.hasNext}}
   *   <Request @request={{pages.nextRequest}}>
   *     <:idle><button {{on "click" features.loadNext}}>Load more</button></:idle>
   *     <:loading><Spinner /></:loading>
   *   </Request>
   * {{/if}}
   * ```
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

  /** @internal */
  private async setup(): Promise<void> {
    let document;
    try {
      document = await this.request;
    } catch {
      // a failed (or aborted) initial request leaves the pagination state
      // empty. Rendering the failure is the request subscription's job, and
      // recovery (retry) produces a new request and with it a new state.
      return;
    }
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
   * Commits a resolved, membership-proven page into this state, making it the
   * {@link activePage}. The synchronous commit step under {@link adoptPage},
   * which is where the resolution and membership verification live.
   *
   * It only activates the page and keeps the infinite surface's frontier
   * coherent — a page already inside the run leaves the frontier untouched,
   * an adjacent page extends it, and a disjoint page resets the run to the
   * adopted page (jump semantics).
   *
   * @internal
   */
  private _activate(page: Readonly<PageCache<RT, E>>, url: string): void {
    this.activePage = page;

    for (const existing of this.pages) {
      if (existing === page) {
        return;
      }
    }

    if (this.frontierEnd?.nextLink === url) {
      this.frontierEnd = page;
    } else if (this.frontierStart?.prevLink === url) {
      this.frontierStart = page;
    } else {
      this.frontierStart = this.frontierEnd = page;
    }
  }

  /**
   * Adopts an externally-issued request into this pagination, making its page
   * the {@link activePage} — the programmatic entry point for route-driven
   * navigation when managing a `PaginationState` directly (the `<Paginate />`
   * component uses the same mechanism for a changed `@request` arg).
   *
   * Awaits the request and verifies that its document is a page of this
   * state's collection (same `first` — or `self` — link). On a match, the
   * page is loaded (a page already in the shared cache is reused) and — once
   * its request settles — committed: it becomes the active page, and the
   * infinite surface's run is kept coherent (a page already inside the run
   * leaves it untouched, an adjacent page extends it, a disjoint page resets
   * the run to the adopted page). The commit happens only after the page has
   * loaded, so the previous page stays active — and rendered — while the
   * adoption resolves. Returns the page's document.
   *
   * Concurrent calls race safely: the latest call wins. An earlier in-flight
   * adoption is superseded and commits nothing, and a {@link loadPage}
   * navigation also supersedes a pending adoption (the user's click is the
   * newer intent).
   *
   * Returns `null` — leaving the state untouched — whenever the adoption does
   * not commit:
   *
   * - the request (or its page's load) rejected
   * - the document is a page of a *different* collection
   * - this state has not finished setting up its own collection yet
   * - the call was superseded by a newer navigation
   *
   * ```ts
   * const pages = getPaginationState(initialRequest);
   * // later, e.g. in a route model hook reacting to a ?page= param:
   * const adopted = await pages.adoptPage(store.request(query));
   * if (adopted === null) {
   *   // not part of this collection — start a fresh pagination
   * }
   * ```
   *
   * It is a stable reference, so it is safe to pass around as an "action" or
   * "event" handler.
   */
  adoptPage = async (request: Future<RT>): Promise<RT | null> => {
    this._adoptTarget = request;

    let content;
    try {
      content = (await request).content as ReactiveDocument<unknown>;
    } catch {
      return null;
    }
    if (this._adoptTarget !== request) {
      // a newer navigation claimed the slot while the request resolved
      return null;
    }

    const cache = this.paginationCache;
    if (!cache) {
      return null;
    }

    const selfLink = getHref(content.links?.self);
    const firstLink = getHref(content.links?.first);
    assert('Expected the adopted document to have a self link', selfLink);
    if (!selfLink || (firstLink ?? selfLink) !== cache.key) {
      return null;
    }

    const page = cache.loadPage(selfLink, request);
    try {
      // wait for the page's request state to settle its value; adopting an
      // already-settled future still needs this microtask
      await page.request;
    } catch {
      return null;
    }
    if (this._adoptTarget !== request) {
      // a newer navigation claimed the slot while the page loaded
      return null;
    }

    this._activate(page, selfLink);
    return page.value;
  };

  /**
   * Extends the backward frontier by one page, prepending it to {@link data}.
   * The frontier advances only once the page has loaded, so
   * {@link previousRequest} tracks the in-flight page meanwhile. Returns the
   * loaded value, or `null` when there is no previous page or the load fails.
   *
   * On failure the frontier stays put and {@link previousRequest} keeps
   * resolving to the failed page, so a wrapping `<Request>` renders its error
   * block. Calling again retries: the failed page is re-requested with a
   * forced reload.
   *
   * In templates it is also available as the `loadPrev` content feature
   * ({@link InfinitePaginationContentFeatures.loadPrev}) yielded by
   * `<Paginate />`; the two are the same function.
   *
   * It is a stable reference, so it is safe to pass around as an "action" or
   * "event" handler.
   */
  loadPrev = async (): Promise<RT | null> => {
    return this._extend('prev');
  };

  /**
   * Extends the forward frontier by one page, appending it to {@link data}.
   * Mirror of {@link loadPrev}.
   *
   * In templates it is also available as the `loadNext` content feature
   * ({@link InfinitePaginationContentFeatures.loadNext}) yielded by
   * `<Paginate />`; the two are the same function.
   *
   * ```gts
   * <button {{on "click" pages.loadNext}}>Load more</button>
   * ```
   */
  loadNext = async (): Promise<RT | null> => {
    return this._extend('next');
  };

  /** @internal */
  private _extend = async (dir: 'prev' | 'next'): Promise<RT | null> => {
    const cache = this.paginationCache;
    assert('Expected the pagination cache to be set up before loading a page', cache);

    const frontier = dir === 'next' ? this.frontierEnd : this.frontierStart;
    const url = dir === 'next' ? frontier?.nextLink : frontier?.prevLink;
    if (!url) {
      return null;
    }

    const page = cache.getPageCache(url);
    if (!page.isRequested || page.isError) {
      // re-requesting a page that previously failed is the retry path: force
      // a reload so a cached error response is not replayed.
      const request = this.store.request(
        page.isError ? { method: 'GET', url, cacheOptions: { reload: true } } : { method: 'GET', url }
      );
      cache.loadPage(url, request as Future<RT>);
    }

    try {
      await page.request;
    } catch {
      // the failure is surfaced reactively: the frontier stays put, so
      // `nextRequest`/`previousRequest` resolves to the failed page and a
      // wrapping `<Request>` renders its error block. Calling again retries.
      return null;
    }

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
   * In templates it is also available as the `loadPage` content feature
   * ({@link PagedPaginationContentFeatures.loadPage}) yielded by `<Paginate />`;
   * the two are the same function.
   *
   * It is a stable reference, so it is safe to pass around as an "action" or
   * "event" handler. Returns the page's value, or `null` if it has none or
   * the load fails.
   *
   * On failure the page stays active and {@link activePageRequest} resolves to
   * it, so a wrapping `<Request>` renders its error block. Calling again (for
   * example clicking the page's link a second time) retries: the failed page
   * is re-requested with a forced reload.
   *
   * ```gts
   * <EachLink @pages={{pages}}>
   *   <:link as |link|>
   *     <button {{on "click" (fn features.loadPage link.url)}}>{{link.text}}</button>
   *   </:link>
   * </EachLink>
   * ```
   */
  loadPage = async (url: string): Promise<RT | null> => {
    const cache = this.paginationCache;
    assert('Expected the pagination cache to be set up before loading a page', cache);

    // an explicit navigation supersedes any in-flight adoption
    this._adoptTarget = null;

    const page = cache.getPageCache(url);
    this.activePage = page;

    if (!page.isLoaded || page.isError) {
      // re-requesting a page that previously failed is the retry path: force
      // a reload so a cached error response is not replayed.
      const request = this.store.request(
        page.isError ? { method: 'GET', url, cacheOptions: { reload: true } } : { method: 'GET', url }
      );
      cache.loadPage(url, request as Future<RT>);
      try {
        await page.request;
      } catch {
        // the failure is surfaced reactively: the page stays active, so
        // `activePageRequest` resolves to it and a wrapping `<Request>`
        // renders its error block. Calling again retries.
        return null;
      }
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
 * ```ts
 * const future = store.request(query);
 * const pages = getPaginationState(future);
 *
 * await future;
 * pages.totalPages; // now known, if the response exposed it
 * await pages.loadNext();
 * ```
 *
 * @public
 * @static
 * @for @warp-drive/ember
 */
export function getPaginationState<RT, E>(request: Future<RT>, pageHints?: PageHints): PaginationState<RT, E> {
  let state = PaginationStateCache.get(request);

  if (!state) {
    // the cache is heterogeneous over RT/E (mirrored by the cast on return)
    state = new PaginationState<RT, E>(request, pageHints) as unknown as PaginationState;
    PaginationStateCache.set(request, state);
  }

  return state as PaginationState<RT, E>;
}
