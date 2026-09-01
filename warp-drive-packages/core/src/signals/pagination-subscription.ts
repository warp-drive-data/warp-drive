import type { RequestManager, Store } from '../index.ts';
import type { Future } from '../request.ts';
import type { StructuredErrorDocument } from '../types/request.ts';
import type { PageHints } from './pagination-cache.ts';
import { getPaginationState, type PaginateMode, type PaginationState } from './pagination-state.ts';
import { defineSignal, memoized } from './reactivity/signal.ts';
import type { RequestLoadingState } from './request-state.ts';
import type { RequestSubscription, SubscriptionArgs } from './request-subscription.ts';
import { createRequestSubscription, DISPOSE } from './request-subscription.ts';

interface ErrorFeatures {
  isHidden: boolean;
  isOnline: boolean;
  retry: () => Promise<void>;
}

/**
 * The content features available in both pagination modes: the state and
 * controls of the initial request.
 */
export interface SharedPaginationContentFeatures<RT> {
  isOnline: boolean;
  isHidden: boolean;
  isRefreshing: boolean;
  /**
   * Whether a changed `@request` arg is currently resolving against the
   * loaded collection — e.g. a route-driven navigation (browser back button).
   * The existing content stays rendered while this is `true`; once the
   * request resolves it either becomes the active page (same collection) or
   * the component resets to the new collection.
   */
  isNavigating: boolean;
  refresh: () => Promise<void>;
  reload: () => Promise<void>;
  abort?: () => void;
  latestRequest?: Future<RT>;
}

/**
 * The content features yielded in `'paged'` mode: navigation happens by
 * loading a specific page.
 */
export interface PagedPaginationContentFeatures<RT> extends SharedPaginationContentFeatures<RT> {
  loadPage: (url: string) => Promise<RT | null>;
}

/**
 * The content features yielded in `'infinite'` mode: navigation happens by
 * extending the loaded run at either end.
 */
export interface InfinitePaginationContentFeatures<RT> extends SharedPaginationContentFeatures<RT> {
  loadNext: () => Promise<RT | null>;
  loadPrev: () => Promise<RT | null>;
}

/**
 * The full set of content features a {@link PaginationSubscription} builds —
 * both modes' surfaces. The `<Paginate />` component narrows this to one mode
 * via {@link PaginationContentFeaturesFor} before yielding.
 */
export type PaginationContentFeatures<RT> = PagedPaginationContentFeatures<RT> & InfinitePaginationContentFeatures<RT>;

/**
 * Resolves a {@link PaginateMode} to the content features it exposes. Mirror of
 * {@link PaginationStateFor}.
 */
export type PaginationContentFeaturesFor<RT = unknown, M extends PaginateMode = 'paged'> = M extends 'infinite'
  ? InfinitePaginationContentFeatures<RT>
  : PagedPaginationContentFeatures<RT>;

export interface PaginationSubscriptionArgs<RT, E> extends SubscriptionArgs<RT, E> {
  /**
   * A function to extract the `currentPage` and `totalPages` from a loaded document
   * when they are not available in the default `meta` locations. Must be the same
   * reference across all `<Paginate />` components sharing a collection.
   */
  pageHints?: PageHints;
}

export interface PaginateArgs<RT, E> extends PaginationSubscriptionArgs<RT, E> {
  /**
   * Which navigation surface the component yields: `'paged'` (the default) or
   * `'infinite'`. Type-only — it narrows the yielded state and features so the
   * two surfaces cannot be mixed, and is never read at runtime.
   */
  mode?: PaginateMode;

  subscription?: PaginationSubscription<RT, E>;

  /**
   * The store instance to use for making requests. If contexts are available,
   * the component will default to using the `store` on the context.
   *
   * This is required if the store is not available via context or should be
   * different from the store provided via context.
   *
   */
  store?: Store | RequestManager;
}

// oxlint-disable-next-line no-unused-vars
export interface PaginationSubscription<RT, E> {
  /**
   * The method to call when the component this subscription is attached to
   * unmounts.
   */
  [DISPOSE](): void;
}

/**
 * Lifecycle glue for the `<Paginate />` component. Owns the initial
 * {@link RequestSubscription} (loading/error state, autorefresh, disposal) and
 * the per-component {@link PaginationState} that it hands to the component.
 *
 * @hideconstructor
 */
export class PaginationSubscription<RT, E> {
  /** @internal */
  declare private isDestroyed: boolean;
  /** @internal */
  declare private _subscribedTo: object | null;
  /** @internal */
  declare private _args: PaginationSubscriptionArgs<RT, E>;
  /**
   * The Store this subscription subscribes to or the RequestManager
   * which issues this request.
   */
  declare store: Store | RequestManager;

  /**
   * The wrapped {@link RequestSubscription} monitoring the initial request.
   * Created eagerly: constructing one consumes reactive state (its own
   * signals), so building it lazily inside a tracked getter would cause the
   * getter to invalidate — and the subscription to be recreated, losing its
   * reloaded request — whenever `retry`/`reload` runs.
   *
   * @internal
   */
  declare private _requestSubscription: RequestSubscription<RT, E>;

  /**
   * The first request this subscription saw — the one that keys the
   * {@link PaginationState} until a navigation resolves to a different
   * collection. Plain (untracked) because it is written during the first
   * computation of {@link paginationState}.
   *
   * @internal
   */
  declare private _seedRequest: Future<RT> | null;

  /**
   * The request a resolved navigation swapped the {@link PaginationState} to,
   * when the navigation turned out to target a different collection. A signal:
   * writing it (always outside of render, from {@link _resolveNavigation})
   * invalidates {@link paginationState} so the fresh state takes over.
   *
   * @internal
   */
  declare private _navRequest: Future<RT> | null;

  /**
   * The changed request currently being resolved by {@link _resolveNavigation},
   * both to avoid kicking the same navigation twice and as the latest-wins
   * guard when several changes race. Untracked bookkeeping.
   *
   * @internal
   */
  declare private _navTarget: Future<RT> | null;

  constructor(store: Store | RequestManager, args: PaginationSubscriptionArgs<RT, E>) {
    this._args = args;
    this.store = store;
    this.isDestroyed = false;
    this._seedRequest = null;
    this._navTarget = null;
    this[DISPOSE] = _DISPOSE;
    this._requestSubscription = createRequestSubscription<RT, E>(store, args);
  }

  /**
   * The per-component pagination state yielded to the component.
   *
   * Keyed to the request that started the collection, not the current
   * `@request` arg: when the arg changes, the existing state keeps rendering
   * while {@link _resolveNavigation} resolves the new request in the
   * background. A request that resolves to a page of the same collection is
   * adopted into this state as the new active page (route-driven navigation,
   * e.g. the browser back button); one that resolves to a different
   * collection swaps in a fresh state (a true reset).
   *
   * A background `refresh` does not swap the request, so the pagination
   * state is stable across refreshes.
   */
  @memoized
  get paginationState(): PaginationState<RT, E> {
    const request = this._requestSubscription.request;
    const active = this._navRequest ?? this._seedRequest;

    if (!active) {
      // first access: this request starts the collection
      this._seedRequest = request;
      return getPaginationState<RT, E>(request, this._args.pageHints);
    }

    if (request !== active && request !== this._navTarget) {
      this._navTarget = request;
      void this._resolveNavigation(request);
    }

    return getPaginationState<RT, E>(active, this._args.pageHints);
  }

  /**
   * Resolves a changed `@request` arg against the current collection via
   * {@link PaginationState.adoptPage}: a request that resolves to a page of
   * the same collection is adopted into the existing state; one that resolves
   * to a different collection (or arrives before a collection is loaded) swaps
   * the state for a fresh one keyed to this request.
   *
   * A rejected request changes nothing here — the request subscription
   * already surfaces the failure (error/cancelled states), and the existing
   * pagination state is kept for recovery. The request is awaited before
   * `adoptPage` so that rejection and the latest-wins guard are handled
   * before anything is adopted.
   *
   * @internal
   */
  private async _resolveNavigation(request: Future<RT>): Promise<void> {
    try {
      await request;
    } catch {
      return;
    }

    // latest wins: a newer navigation or disposal superseded this one
    if (this.isDestroyed || this._navTarget !== request) {
      return;
    }

    const adopted = await this.paginationState.adoptPage(request);
    if (this.isDestroyed || this._navTarget !== request) {
      // a newer navigation claimed the slot while `adoptPage` resolved — its
      // own resolution decides the outcome. Without this check a superseded
      // `null` would be mistaken for a foreign collection and wrongly reset.
      return;
    }
    if (adopted === null) {
      // this call is still the latest navigation, so `null` means the page is
      // not part of the current collection (or the collection has not set up
      // yet): reset to a fresh state
      this._navRequest = request;
    }
    // `_navTarget` intentionally stays set: it marks this request as
    // processed so the getter does not re-kick it, and a newer navigation
    // may already have claimed the field while `adoptPage` was awaited.
  }

  /**
   * Whether there is no request or query to monitor, so the component has
   * nothing to load.
   */
  @memoized
  get isIdle(): boolean {
    return this._requestSubscription.isIdle;
  }

  /**
   * Whether the collection is still blocking-loading: no {@link PaginationState}
   * has finished setting up yet. Only the very first page load (or the reset
   * to a different collection) blocks here — extending the collection with
   * `loadNext`/`loadPrev` does not, and neither does a changed `@request` arg
   * while a collection is already on screen (that is {@link isNavigating}).
   *
   * Remains `true` for the moment between the request resolving and the
   * {@link paginationState} finishing its setup from the response, so that
   * {@link isSuccess} consumers never see a success state with an empty
   * pagination surface.
   */
  @memoized
  get isLoading(): boolean {
    const { reqState } = this._requestSubscription;
    return this.paginationState.paginationCache === null && (reqState.isLoading || reqState.isSuccess);
  }

  /**
   * Whether a changed `@request` arg is resolving while a collection is
   * already on screen — route-driven navigation, e.g. the browser back
   * button. The content stays rendered (see {@link isSuccess}); consumers can
   * use this to show a lightweight navigation indicator, the same way a
   * `loadPage` call surfaces through the active page's request state.
   */
  @memoized
  get isNavigating(): boolean {
    return this.paginationState.paginationCache !== null && this._requestSubscription.reqState.isLoading;
  }

  /**
   * The {@link RequestLoadingState} for the initial request, for building UIs
   * that respond to download progress.
   */
  @memoized
  get loadingState(): RequestLoadingState {
    return this._requestSubscription.reqState.loadingState;
  }

  /**
   * Whether the component has a set-up {@link paginationState} to render and
   * the current request did not fail. Stays `true` while a changed `@request`
   * arg resolves ({@link isNavigating}), so the existing content keeps
   * rendering instead of falling back to a blocking loading state.
   */
  @memoized
  get isSuccess(): boolean {
    const { reqState } = this._requestSubscription;
    return this.paginationState.paginationCache !== null && !reqState.isError && !reqState.isCancelled;
  }

  /**
   * Whether the initial request was cancelled (aborted).
   */
  @memoized
  get isCancelled(): boolean {
    return this._requestSubscription.reqState.isCancelled;
  }

  /**
   * Whether the initial request rejected with an error.
   */
  @memoized
  get isError(): boolean {
    return this._requestSubscription.reqState.isError;
  }

  /**
   * The error the initial request rejected with, or `null` if it did not reject.
   */
  @memoized
  get reason(): StructuredErrorDocument<E> | null {
    return this._requestSubscription.reqState.reason;
  }

  /**
   * Error features to yield to the error slot of a component
   */
  @memoized
  get errorFeatures(): ErrorFeatures {
    return {
      isHidden: this._requestSubscription.isHidden,
      isOnline: this._requestSubscription.isOnline,
      retry: this._requestSubscription.retry,
    };
  }

  /**
   * Content features to yield to the content slot of a component
   */
  @memoized
  get contentFeatures(): PaginationContentFeatures<RT> {
    const contentFeatures = this._requestSubscription.contentFeatures;
    const { paginationState } = this;
    const feat: PaginationContentFeatures<RT> = {
      ...contentFeatures,
      isNavigating: this.isNavigating,
      loadPrev: paginationState.loadPrev,
      loadNext: paginationState.loadNext,
      loadPage: paginationState.loadPage,
    };

    if (feat.isRefreshing) {
      feat.abort = () => {
        contentFeatures.latestRequest?.abort();
      };
    }

    return feat;
  }

  /**
   * The initial request `Future` this subscription is monitoring, i.e. the first
   * page load. This is the future the {@link paginationState} is built from.
   *
   * @internal
   */
  @memoized
  get request(): Future<RT> {
    return this._requestSubscription.request;
  }
}

defineSignal(PaginationSubscription.prototype, '_navRequest', null);

/**
 * Creates the {@link PaginationSubscription} a `<Paginate />` component uses to
 * manage its request lifecycle and pagination state. Pass the result back into
 * the component via `@subscription` to manage the lifecycle externally.
 *
 * @public
 */
export function createPaginationSubscription<RT, E>(
  store: Store | RequestManager,
  args: PaginationSubscriptionArgs<RT, E>
): PaginationSubscription<RT, E> {
  return new PaginationSubscription(store, args);
}

interface PrivatePaginationSubscription {
  isDestroyed: boolean;
  _requestSubscription: RequestSubscription<unknown, unknown>;
}

function upgradeSubscription(sub: unknown): PrivatePaginationSubscription {
  return sub as PrivatePaginationSubscription;
}

function _DISPOSE<RT, E>(this: PaginationSubscription<RT, E>) {
  const self = upgradeSubscription(this);
  self.isDestroyed = true;
  self._requestSubscription?.[DISPOSE]?.();
}
