import type { RequestManager, Store } from '../index';
import { memoized } from './-private.ts';
import type { PaginationLink, PaginationLinks } from './pagination-links.ts';
import { getPaginationLinks } from './pagination-links.ts';
import type { PaginationState } from './pagination-state.ts';
import { DISPOSE } from './request-subscription.ts';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface PaginationLinksSubscription<RT, E> {
  /**
   * The method to call when the component this subscription is attached to
   * unmounts.
   */
  [DISPOSE](): void;
}

export interface PaginationLinksSubscriptionArgs<RT, E> {
  state: PaginationState<RT, E>;
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

  @memoized
  get paginationLinks(): Readonly<PaginationLinks<RT, E>> {
    return getPaginationLinks<RT, E>(this._args.state);
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
