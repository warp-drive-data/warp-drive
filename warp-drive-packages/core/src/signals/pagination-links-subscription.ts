import type { RequestManager, Store } from '../index';
import type { StructuredErrorDocument } from '../types/request';
import { DISPOSE } from './request-subscription.ts';
import { getPaginationLinks, PaginationLinks, type PaginationLink } from './pagination-links.ts';
import { PaginationState } from './pagination-state.ts';
import { memoized } from './-private.ts';

type ContentFeatures = {
  loadNext?: () => Promise<void>;
  loadPrev?: () => Promise<void>;
  loadPage?: (url: string) => Promise<void>;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface PaginationLinksSubscription<RT, E> {
  /**
   * The method to call when the component this subscription is attached to
   * unmounts.
   */
  [DISPOSE](): void;
}

export interface PaginationLinksSubscriptionArgs<RT, E> {
  pages: PaginationState<RT, StructuredErrorDocument<E>>;
}

/**
 * A reactive class
 *
 * @hideconstructor
 */
export class PaginationLinksSubscription<RT, E> {
  /** @internal */
  declare private isDestroyed: boolean;
  /** @internal */
  declare private _subscribedTo: object | null;
  /** @internal */
  declare private _args: PaginationLinksSubscriptionArgs<RT, E>;
  /** @internal */
  declare store: Store | RequestManager;

  constructor(store: Store | RequestManager, args: PaginationLinksSubscriptionArgs<RT, E>) {
    this.store = store;
    this._args = args;
    this.isDestroyed = false;
    this[DISPOSE] = _DISPOSE;
  }

  /**
   * Loads the prev page based on links.
   */
  loadPrev = async (): Promise<void> => {
    const { prev } = this.paginationLinks.paginationState;
    if (prev) {
      await this.loadPage(prev);
    }
  };

  /**
   * Loads the next page based on links.
   */
  loadNext = async (): Promise<void> => {
    const { next } = this.paginationLinks.paginationState;
    if (next) {
      await this.loadPage(next);
    }
  };

  /**
   * Loads a specific page by its URL.
   */
  loadPage = async (url: string): Promise<void> => {
    let { paginationState } = this.paginationLinks;
    const page = paginationState.getPageState(url);
    paginationState.activatePage(page);
    if (!page.isLoaded) {
      const request = this.store.request({ method: 'GET', url });
      await page.load(request);
    }
  };

  /**
   * Content features to yield to the content slot of a component
   */
  @memoized
  get contentFeatures(): ContentFeatures {
    return {
      loadPrev: this.loadPrev,
      loadNext: this.loadNext,
      loadPage: this.loadPage,
    } as ContentFeatures;
  }

  @memoized
  get paginationLinks(): Readonly<PaginationLinks<RT, StructuredErrorDocument<E>>> {
    return getPaginationLinks<RT, E>(this._args.pages);
  }

  @memoized
  get links(): ReadonlyArray<Readonly<PaginationLink>> {
    return this.paginationLinks.links;
  }
}

export function createPaginationLinksSubscription<RT, E>(
  store: Store | RequestManager,
  args: PaginationLinksSubscriptionArgs<RT, E>
): PaginationLinksSubscription<RT, E> {
  return new PaginationLinksSubscription(store, args);
}

interface PrivatePaginationLinksSubscription {
  isDestroyed: boolean;
}

function upgradeSubscription(sub: unknown): PrivatePaginationLinksSubscription {
  return sub as PrivatePaginationLinksSubscription;
}

function _DISPOSE<RT, E>(this: PaginationLinksSubscription<RT, E>) {
  const self = upgradeSubscription(this);
  self.isDestroyed = true;
}
