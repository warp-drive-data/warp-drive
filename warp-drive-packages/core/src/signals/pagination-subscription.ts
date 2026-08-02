import type { RequestManager, Store } from '../index.ts';
import type { Future } from '../request.ts';
import type { StructuredErrorDocument } from '../types/request.ts';
import type { PageHints } from './pagination-cache.ts';
import { getPaginationState, type PaginateMode, type PaginationState } from './pagination-state.ts';
import { memoized } from './reactivity/signal.ts';
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  /** The per-component pagination state yielded to the component. */
  declare paginationState: PaginationState<RT, E>;

  constructor(store: Store | RequestManager, args: PaginationSubscriptionArgs<RT, E>) {
    this._args = args;
    this.store = store;
    this.isDestroyed = false;
    this[DISPOSE] = _DISPOSE;

    this.paginationState = getPaginationState<RT, E>(this._requestSubscription.request, args.pageHints);
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
   * Whether the initial request is still loading. Only the first page load
   * blocks here; extending the collection with `loadNext`/`loadPrev` does not.
   */
  @memoized
  get isLoading(): boolean {
    return this._requestSubscription.reqState.isLoading;
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
   * Whether the initial request resolved successfully.
   */
  @memoized
  get isSuccess(): boolean {
    return this._requestSubscription.reqState.isSuccess;
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
   * @internal
   */
  @memoized
  get _requestSubscription(): RequestSubscription<RT, E> {
    return createRequestSubscription<RT, E>(this.store, this._args);
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
