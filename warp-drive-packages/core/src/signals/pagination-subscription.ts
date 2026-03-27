import { assert } from '@warp-drive/core/build-config/macros';

import type { RequestManager, Store } from '../index';
import type { ReactiveDocument } from '../reactive.ts';
import type { Future } from '../request';
import type { StructuredErrorDocument } from '../types/request';
import type { Link } from '../types/spec/json-api-raw.ts';
import { memoized } from './-private.ts';
import type { PageState } from './page-state.ts';
import type { PaginationLink, PaginationLinks } from './pagination-links.ts';
import { getPaginationLinks } from './pagination-links.ts';
import { getPaginationState, type PaginationState } from './pagination-state.ts';
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
  loadNext?: () => Promise<ReactiveDocument<RT[]> | null>;
  loadPrev?: () => Promise<ReactiveDocument<RT[]> | null>;
  loadPage: (url: string) => Promise<ReactiveDocument<RT[]> | null>;
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

  declare paginationState: PaginationState<RT, StructuredErrorDocument<E>>;
  declare activePage: Readonly<PageState<RT, StructuredErrorDocument<E>>>;

  constructor(store: Store | RequestManager, args: PaginationSubscriptionArgs<RT, E>) {
    this._args = args;
    this.store = store;
    this.isDestroyed = false;
    this[DISPOSE] = _DISPOSE;

    void this.setupPaginatioState();
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

  @memoized
  get paginationLinks(): Readonly<PaginationLinks<RT, StructuredErrorDocument<E>>> {
    return getPaginationLinks<RT, E>(this);
  }

  @memoized
  get links(): ReadonlyArray<Readonly<PaginationLink>> {
    return this.paginationLinks.links;
  }

  async setupPaginatioState(): Promise<void> {
    const document = await this.request;
    const content = document.content as ReactiveDocument<RT[]>;
    const cacheKey = getHref(content.links?.first) ?? getHref(content.links?.self) ?? '';
    assert('Expected the initial document to have either a first or self link', cacheKey);
    this.paginationState = getPaginationState<RT, E>(cacheKey, this.request, this._args.mode);
  }

  /**
   * Loads the prev page based on links.
   */
  loadPrev = async (): Promise<ReactiveDocument<RT[]> | null> => {
    const { prevLink } = this.activePage;
    if (prevLink) {
      return this.loadPage(prevLink);
    }

    return null;
  };

  /**
   * Loads the next page based on links.
   */
  loadNext = async (): Promise<ReactiveDocument<RT[]> | null> => {
    const { nextLink } = this.activePage;
    if (nextLink) {
      return this.loadPage(nextLink);
    }

    return null;
  };

  /**
   * Loads a specific page by its URL.
   */
  loadPage = async (url: string): Promise<ReactiveDocument<RT[]> | null> => {
    this.activePage = this.paginationState.getPageState(url);

    if (!this.activePage.isLoaded) {
      const request = this.store.request({ method: 'GET', url });
      return this.paginationState.loadPage(this.activePage, request as Future<RT>);
    }

    return this.activePage.value;
  };
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
