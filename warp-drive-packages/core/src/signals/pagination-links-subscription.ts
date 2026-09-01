import { memoized } from './-private.ts';
import type { PaginationLinks } from './pagination-links.ts';
import { getPaginationLinks } from './pagination-links.ts';
import type { PagedPaginationState } from './pagination-state.ts';
import { DISPOSE } from './request-subscription.ts';

export interface PaginationLinksSubscription<RT, E> {
  /**
   * The method to call when the component this subscription is attached to
   * unmounts.
   */
  [DISPOSE](): void;
}

export interface PaginationLinksSubscriptionArgs<RT, E> {
  pages: PagedPaginationState<RT, E>;
}

/**
 * The framework-agnostic core of a pagination links component (for example the
 * `<EachLink />` component of `@warp-drive/ember`): it owns the component
 * lifecycle, while the links themselves live on the {@link PaginationLinks}
 * it exposes.
 *
 * Given the {@link PagedPaginationState} a `<Paginate />` component is driving,
 * {@link paginationLinks} derives that state's `PaginationLinks` — the numbered
 * links (with placeholders for gaps) and the relational
 * `first`/`prev`/`next`/`last` links a component yields for the consumer to
 * render. All of them read from the same shared page graph as the
 * `<Paginate />` component, so they stay in sync as pages load and the active
 * page changes.
 *
 * @since 5.9.0
 * @public
 * @hideconstructor
 */
export class PaginationLinksSubscription<RT, E> {
  /** @internal */
  declare private isDestroyed: boolean;
  /** @internal */
  declare private _args: PaginationLinksSubscriptionArgs<RT, E>;

  constructor(args: PaginationLinksSubscriptionArgs<RT, E>) {
    this._args = args;
    this.isDestroyed = false;
    this[DISPOSE] = _DISPOSE;
  }

  /**
   * The {@link PaginationLinks} derived from the {@link PagedPaginationState}
   * passed as an arg — the surface a links component yields to its consumer:
   * the numbered {@link PaginationLinks.links | links} (empty for cursor-based
   * collections) and the relational {@link PaginationLinks.first | first}/
   * {@link PaginationLinks.prev | prev}/{@link PaginationLinks.next | next}/
   * {@link PaginationLinks.last | last} links.
   *
   * Recomputes when the `pages` arg changes, so a component whose pagination
   * resets to a different collection derives fresh links automatically.
   */
  @memoized
  get paginationLinks(): Readonly<PaginationLinks<RT, E>> {
    return getPaginationLinks<RT, E>(this._args.pages);
  }
}

/**
 * Creates the {@link PaginationLinksSubscription} a links component (such as
 * `<EachLink />`) uses to derive its links from a {@link PagedPaginationState}.
 *
 * ```ts
 * const subscription = createPaginationLinksSubscription({ pages: paginationState });
 *
 * subscription.paginationLinks; // the derived PaginationLinks
 * subscription[DISPOSE](); // tear down when the owning component unmounts
 * ```
 *
 * @since 5.9.0
 * @public
 */
export function createPaginationLinksSubscription<RT, E>(
  args: PaginationLinksSubscriptionArgs<RT, E>
): PaginationLinksSubscription<RT, E> {
  return new PaginationLinksSubscription(args);
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
