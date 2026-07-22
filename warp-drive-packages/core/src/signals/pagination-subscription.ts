import { assert } from '@warp-drive/core/build-config/macros';

import type { RequestManager, Store } from '../index.ts';
import type { ReactiveDocument } from '../reactive.ts';
import type { Future } from '../request.ts';
import type { StructuredErrorDocument } from '../types/request.ts';
import type { Link } from '../types/spec/json-api-raw.ts';
import type { PageState } from './page-state.ts';
import { getPaginationState, type PaginationState } from './pagination-state.ts';
import { defineSignal, memoized } from './reactivity/signal.ts';
import type { RequestLoadingState } from './request-state.ts';
import type { RequestSubscription, SubscriptionArgs } from './request-subscription.ts';
import { createRequestSubscription, DISPOSE } from './request-subscription.ts';

export function getHref(link?: Link | null): string | null {
  if (!link) {
    return null;
  }
  if (typeof link === 'string') {
    return link;
  }
  return link.href;
}

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
  loadNext?: () => Promise<ReactiveDocument<RT> | null>;
  loadPrev?: () => Promise<ReactiveDocument<RT> | null>;
  loadPage: (url: string) => Promise<ReactiveDocument<RT> | null>;
};

export interface PaginationSubscriptionArgs<RT, E> extends SubscriptionArgs<RT, E> {
  mode?: 'infinite' | 'paged';
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
 * A reactive class
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

  declare paginationState: PaginationState<RT, E>;
  declare activePage: Readonly<PageState<RT, E>>;

  constructor(store: Store | RequestManager, args: PaginationSubscriptionArgs<RT, E>) {
    this._args = args;
    this.store = store;
    this.isDestroyed = false;
    this[DISPOSE] = _DISPOSE;

    void this.setupPaginationState();
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
    const feat: PaginationContentFeatures<RT> = {
      ...contentFeatures,
      loadPrev: this.loadPrev,
      loadNext: this.loadNext,
      loadPage: this.loadPage,
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

  @memoized
  get activePageRequest(): Future<RT> | null {
    return this.activePage.request;
  }

  async setupPaginationState(): Promise<void> {
    const document = await this.request;
    const content = document.content as ReactiveDocument<RT>;
    const selfLink = getHref(content.links?.self);
    const firstLink = getHref(content.links?.first);
    assert('Expected the initial document to have a self link', selfLink);
    const cacheKey = firstLink ?? selfLink ?? '';
    this.paginationState = getPaginationState<RT, E>(cacheKey, this._args.mode);
    this.paginationState.totalPages = this.paginationState.getTotalPages(content);
    this.activePage = this.paginationState.start(selfLink, this.request);
  }

  /**
   * Loads the prev page based on links.
   */
  loadPrev = async (): Promise<ReactiveDocument<RT> | null> => {
    const { prevLink } = this.activePage;
    if (prevLink) {
      return this.loadPage(prevLink);
    }

    return null;
  };

  /**
   * Loads the next page based on links.
   */
  loadNext = async (): Promise<ReactiveDocument<RT> | null> => {
    const { nextLink } = this.activePage;
    if (nextLink) {
      return this.loadPage(nextLink);
    }

    return null;
  };

  /**
   * Loads a specific page by its URL.
   */
  loadPage = async (url: string): Promise<ReactiveDocument<RT> | null> => {
    this.activePage = this.paginationState.getPageState(url);
    if (!this.activePage.isLoaded) {
      const request = this.store.request({ method: 'GET', url });
      const page = this.paginationState.loadPage(url, request as Future<RT>);
      await page.request;
      return page.value;
    }

    return this.activePage.value;
  };
}

defineSignal(PaginationSubscription.prototype, 'paginationState', null);
defineSignal(PaginationSubscription.prototype, 'activePage', null);

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
