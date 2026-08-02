import type { PageCache } from './page-cache.ts';
import type { PagedPaginationState } from './pagination-state.ts';
import { memoized } from './reactivity/signal';

const PaginationLinksCache = new WeakMap<PagedPaginationState, PaginationLinks>();

/**
 * A single numbered link, e.g. page `3`. Loads its page and makes it active when
 * {@link setActive} runs. Carries its {@link index} and its
 * {@link distanceFromActiveIndex} so a UI can style links by how far they sit
 * from the current page.
 */
export class RealPaginationLink {
  readonly isReal = true as const;

  readonly url: string;
  readonly index: number;
  readonly isCurrent: boolean;
  readonly distanceFromActiveIndex: number;
  /** @internal */
  declare private _loadPage: (url: string) => Promise<unknown>;

  constructor(url: string, index: number, activeIndex: number, loadPage: (url: string) => Promise<unknown>) {
    this.url = url;
    this.index = index;
    this.isCurrent = index === activeIndex;
    this.distanceFromActiveIndex = Math.abs(index - activeIndex);
    this._loadPage = loadPage;
  }

  get text(): string {
    return `${this.index}`;
  }

  /**
   * Loads this link's page and makes it the active page on the associated
   * {@link PaginationState}. Stable reference, so it can be used directly
   * as a click handler.
   */
  setActive = (): Promise<unknown> => {
    return this._loadPage(this.url);
  };
}

/**
 * A stand-in for a run of pages that have not been loaded yet, rendered as an
 * ellipsis between numbered links. It covers an {@link indexRange} rather than a
 * single page and has no page to navigate to. Adjacent gaps merge via
 * {@link _mergeRange} as more pages load.
 */
export class PlaceholderPaginationLink {
  readonly isReal = false as const;

  indexRange: [start: number, end: number];
  readonly activeIndex: number;

  text = '.';

  constructor(index: [start: number, end: number], activeIndex: number) {
    this.indexRange = index;
    this.activeIndex = activeIndex;
  }

  get rangeSize(): number {
    return this.indexRange[1] - this.indexRange[0] + 1;
  }

  /**
   * The distance between the active page and the nearest edge of this
   * placeholder's index range.
   */
  get distanceFromActiveIndex(): number {
    const [start, end] = this.indexRange;
    return Math.min(Math.abs(start - this.activeIndex), Math.abs(end - this.activeIndex));
  }

  _mergeRange(newRange: [start: number, end: number]): void {
    const [oldStart, oldEnd] = this.indexRange;
    const [newStart, newEnd] = newRange;
    const mergedRange: [start: number, end: number] = [Math.min(oldStart, newStart), Math.max(oldEnd, newEnd)];
    this.indexRange = mergedRange;
  }
}

/**
 * A relational (`prev`/`next`) navigation link, relative to the active page. Unlike
 * {@link RealPaginationLink} these carry no ordinal index — they are the only links
 * available for cursor-based pagination, where pages are chained purely by opaque
 * `prev`/`next` links with no page number or total. They are also available in
 * numbered pagination as a convenience.
 */
export class RelationalPaginationLink {
  readonly isReal = true as const;

  readonly rel: 'prev' | 'next';
  readonly url: string;
  /** @internal */
  declare private _loadPage: (url: string) => Promise<unknown>;

  constructor(rel: 'prev' | 'next', url: string, loadPage: (url: string) => Promise<unknown>) {
    this.rel = rel;
    this.url = url;
    this._loadPage = loadPage;
  }

  get text(): string {
    return this.rel;
  }

  /**
   * Loads this link's page and makes it the active page on the associated
   * {@link PaginationState}. Stable reference, so it can be used directly
   * as a click handler.
   */
  setActive = (): Promise<unknown> => {
    return this._loadPage(this.url);
  };
}

export type PaginationLink = RealPaginationLink | PlaceholderPaginationLink;

/**
 * The reactive set of navigation links derived from a {@link PaginationState}.
 * Where `PaginationState` tracks which pages are loaded and which one is active,
 * `PaginationLinks` turns that page graph into the links a UI renders to move
 * between pages.
 *
 * It provides two kinds of link:
 *
 * - {@link links}: the numbered links, with {@link PlaceholderPaginationLink}
 *   placeholders standing in for gaps of not-yet-loaded pages. Only numbered
 *   collections (where the server exposes page numbers) produce these.
 * - {@link prev} and {@link next}: the relational links for the active page.
 *   Available in both numbered and cursor-based pagination, and the only links a
 *   cursor-based collection has.
 *
 * Every link updates as pages load and as the active page changes, since they
 * read straight from the state's shared page graph. To get the links for a
 * state, use {@link getPaginationLinks}.
 *
 * See also:
 * - {@link RealPaginationLink}
 * - {@link PlaceholderPaginationLink}
 * - {@link RelationalPaginationLink}
 *
 * @hideconstructor
 */
export class PaginationLinks<RT = unknown, E = unknown> {
  declare paginationState: PagedPaginationState<RT, E>;

  constructor(paginationState: PagedPaginationState<RT, E>) {
    this.paginationState = paginationState;
  }

  /**
   * The relational `prev` link for the active page, or `null` at the start of the
   * collection. Available in both numbered and cursor pagination.
   */
  @memoized
  get prev(): RelationalPaginationLink | null {
    const url = this.paginationState.activePage?.prevLink;
    return url ? new RelationalPaginationLink('prev', url, this.paginationState.loadPage) : null;
  }

  /**
   * The relational `next` link for the active page, or `null` at the end of the
   * collection. Available in both numbered and cursor pagination.
   */
  @memoized
  get next(): RelationalPaginationLink | null {
    const url = this.paginationState.activePage?.nextLink;
    return url ? new RelationalPaginationLink('next', url, this.paginationState.loadPage) : null;
  }

  /**
   * The numbered links and placeholders, derived from the shared page graph.
   *
   * Only produced for numbered pagination (where the server exposes page numbers).
   * Cursor-based collections have no page numbers, so this is empty — use
   * {@link prev}/{@link next} for cursor navigation.
   */
  @memoized
  get links(): PaginationLink[] {
    const links: PaginationLink[] = [];

    const cache = this.paginationState.paginationCache;
    if (!cache || !cache.isNumbered) {
      return links;
    }

    const { firstPage, totalPages } = cache;
    const activeIndex = this.paginationState.activePage?.pageNumber ?? 0;

    if (firstPage) {
      let previousPage: Readonly<PageCache<RT, E>> | null = null;
      let currentPage: Readonly<PageCache<RT, E>> | null = firstPage;
      while (currentPage) {
        if (previousPage && currentPage.pageNumber - previousPage.pageNumber > 1) {
          links.push(
            new PlaceholderPaginationLink([previousPage.pageNumber + 1, currentPage.pageNumber - 1], activeIndex)
          );
        }
        links.push(
          new RealPaginationLink(
            currentPage.selfLink ?? '',
            currentPage.pageNumber,
            activeIndex,
            this.paginationState.loadPage
          )
        );
        previousPage = currentPage;
        currentPage = currentPage.after;
      }

      if (previousPage && previousPage.pageNumber < totalPages) {
        links.push(new PlaceholderPaginationLink([previousPage.pageNumber + 1, totalPages], activeIndex));
      }
    }

    return links;
  }
}

/**
 * Get the {@link PaginationLinks} for a given {@link PaginationState}. Returns
 * the same instance for the same state, so repeated calls (for example a
 * `<Paginate />` component and a separate links component reading the same state)
 * share one set of links. Keyed by state identity, the same way
 * {@link getPaginationState} is keyed by request and {@link getRequestState} by
 * future.
 *
 * ```ts
 * const links = getPaginationLinks(paginationState);
 *
 * for (const link of links.links) {
 *   if (link.isReal) {
 *     // render a numbered link, using link.setActive as the click handler
 *   } else {
 *     // render an ellipsis for the gap link.indexRange covers
 *   }
 * }
 * ```
 */
export function getPaginationLinks<RT, E>(state: PagedPaginationState<RT, E>): Readonly<PaginationLinks<RT, E>> {
  let links = PaginationLinksCache.get(state);

  if (!links) {
    links = new PaginationLinks<RT, E>(state);
    PaginationLinksCache.set(state, links);
  }

  return links as Readonly<PaginationLinks<RT, E>>;
}
