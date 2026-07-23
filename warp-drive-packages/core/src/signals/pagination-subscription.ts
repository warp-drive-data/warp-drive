import type { RequestManager, Store } from '../index.ts';
import type { Future } from '../request.ts';
import type { StructuredErrorDocument } from '../types/request.ts';
import type { PageHints } from './pagination-cache.ts';
import { getPaginationState, type PaginationState } from './pagination-state.ts';
import { memoized } from './reactivity/signal.ts';
import type { RequestLoadingState } from './request-state.ts';
import type { RequestSubscription, SubscriptionArgs } from './request-subscription.ts';
import { createRequestSubscription, DISPOSE } from './request-subscription.ts';

interface ErrorFeatures {
  isHidden: boolean;
  isOnline: boolean;
  retry: () => Promise<void>;
}

export type PaginationContentFeatures<RT> = {
  // Initial Request
  isOnline: boolean;
  isHidden: boolean;
  isRefreshing: boolean;
  refresh: () => Promise<void>;
  reload: () => Promise<void>;
  abort?: () => void;
  latestRequest?: Future<RT>;

  // Pagination
  loadNext?: () => Promise<RT | null>;
  loadPrev?: () => Promise<RT | null>;
  loadPage: (url: string) => Promise<RT | null>;
};

export interface PaginationSubscriptionArgs<RT, E> extends SubscriptionArgs<RT, E> {
  mode?: 'infinite' | 'paged';

  /**
   * A function to extract the `currentPage` and `totalPages` from a loaded document
   * when they are not available in the default `meta` locations. Must be the same
   * reference across all `<Paginate />` components sharing a collection.
   */
  pageHints?: PageHints;
}

export interface PaginateArgs<RT, E> extends PaginationSubscriptionArgs<RT, E> {
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
  /** @internal */
  declare store: Store | RequestManager;

  /** The per-component pagination state yielded to the component. */
  declare paginationState: PaginationState<RT, E>;

  constructor(store: Store | RequestManager, args: PaginationSubscriptionArgs<RT, E>) {
    this._args = args;
    this.store = store;
    this.isDestroyed = false;
    this[DISPOSE] = _DISPOSE;

    this.paginationState = getPaginationState<RT, E>(
      store,
      this._requestSubscription.request,
      args.mode ?? 'paged',
      args.pageHints
    );
  }

  @memoized
  get isIdle(): boolean {
    return this._requestSubscription.isIdle;
  }

  @memoized
  get isLoading(): boolean {
    return this._requestSubscription.reqState.isLoading;
  }

  @memoized
  get loadingState(): RequestLoadingState {
    return this._requestSubscription.reqState.loadingState;
  }

  @memoized
  get isSuccess(): boolean {
    return this._requestSubscription.reqState.isSuccess;
  }

  @memoized
  get isCancelled(): boolean {
    return this._requestSubscription.reqState.isCancelled;
  }

  @memoized
  get isError(): boolean {
    return this._requestSubscription.reqState.isError;
  }

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

  @memoized
  get request(): Future<RT> {
    return this._requestSubscription.request;
  }
}

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
