import type { RequestManager, Store } from '../index';
import { memoized } from './-private.ts';
import type { PaginationLink, PaginationLinks, RelationalPaginationLink } from './pagination-links.ts';
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
  pages: PaginationState<RT, E>;
}

/**
 * Lifecycle glue for a pagination links component (for example the `<EachLink />`
 * yielded by `<Paginate />`). Given the {@link PaginationState} a `<Paginate />`
 * component is driving, it exposes that state's {@link PaginationLinks} so the
 * component can render navigation controls.
 *
 * It surfaces the two kinds of link the underlying `PaginationLinks` provides:
 * the numbered {@link links} (with placeholders for gaps) and the relational
 * {@link prev}/{@link next} links. All of them read from the same shared page
 * graph as the `<Paginate />` component, so they stay in sync as pages load and
 * the active page changes.
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
   * The {@link PaginationLinks} derived from the {@link PaginationState} passed
   * as an arg. This is the object the other getters read from.
   */
  @memoized
  get paginationLinks(): Readonly<PaginationLinks<RT, E>> {
    return getPaginationLinks<RT, E>(this._args.pages);
  }

  /**
   * The numbered links and placeholders for the collection. Empty for
   * cursor-based collections, which have no page numbers to render; use
   * {@link prev}/{@link next} for those. See {@link PaginationLinks.links}.
   */
  @memoized
  get links(): ReadonlyArray<Readonly<PaginationLink>> {
    return this.paginationLinks.links;
  }

  /**
   * The relational `prev` link for the active page, or `null` at the start of
   * the collection. Available in both numbered and cursor-based pagination.
   */
  @memoized
  get prev(): Readonly<RelationalPaginationLink> | null {
    return this.paginationLinks.prev;
  }

  /**
   * The relational `next` link for the active page, or `null` at the end of the
   * collection. Available in both numbered and cursor-based pagination.
   */
  @memoized
  get next(): Readonly<RelationalPaginationLink> | null {
    return this.paginationLinks.next;
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
