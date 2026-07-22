import type { PageCache } from './page-cache.ts';
import type { PaginationState } from './pagination-state.ts';
import { memoized } from './reactivity/signal';

const PaginationLinksCache = new WeakMap<PaginationState, PaginationLinks>();

export class RealPaginationLink {
  readonly isReal = true as const;

  readonly url: string;
  readonly index: number;
  readonly isCurrent: boolean;

  constructor(url: string, index: number, isCurrent = false) {
    this.url = url;
    this.index = index;
    this.isCurrent = isCurrent;
  }

  get text(): string {
    return `${this.index}`;
  }
}

export class PlaceholderPaginationLink {
  readonly isReal = false as const;

  indexRange: [start: number, end: number];

  text = '.';

  constructor(index: [start: number, end: number]) {
    this.indexRange = index;
  }

  get rangeSize(): number {
    return this.indexRange[1] - this.indexRange[0] + 1;
  }

  _mergeRange(newRange: [start: number, end: number]): void {
    const [oldStart, oldEnd] = this.indexRange;
    const [newStart, newEnd] = newRange;
    const mergedRange: [start: number, end: number] = [Math.min(oldStart, newStart), Math.max(oldEnd, newEnd)];
    this.indexRange = mergedRange;
  }
}

export type PaginationLink = RealPaginationLink | PlaceholderPaginationLink;

export class PaginationLinks<RT = unknown, E = unknown> {
  declare paginationState: PaginationState<RT, E>;

  constructor(paginationState: PaginationState<RT, E>) {
    this.paginationState = paginationState;
  }

  /** All available links and placeholders, derived from the shared page graph. */
  @memoized
  get links(): PaginationLink[] {
    const links: PaginationLink[] = [];

    const cache = this.paginationState.paginationCache;
    if (!cache) {
      return links;
    }

    const { firstPage, totalPages } = cache;
    const activeIndex = this.paginationState.activePage?.pageNumber ?? 0;

    if (firstPage) {
      let previousPage: Readonly<PageCache<RT, E>> | null = null;
      let currentPage: Readonly<PageCache<RT, E>> | null = firstPage;
      while (currentPage) {
        if (previousPage && currentPage.pageNumber - previousPage.pageNumber > 1) {
          links.push(new PlaceholderPaginationLink([previousPage.pageNumber + 1, currentPage.pageNumber - 1]));
        }
        links.push(
          new RealPaginationLink(
            currentPage.selfLink ?? '',
            currentPage.pageNumber,
            currentPage.pageNumber === activeIndex
          )
        );
        previousPage = currentPage;
        currentPage = currentPage.after;
      }

      if (previousPage && previousPage.pageNumber < totalPages) {
        links.push(new PlaceholderPaginationLink([previousPage.pageNumber + 1, totalPages]));
      }
    }

    return links;
  }
}

export function getPaginationLinks<RT, E>(state: PaginationState<RT, E>): Readonly<PaginationLinks<RT, E>> {
  let links = PaginationLinksCache.get(state);

  if (!links) {
    links = new PaginationLinks<RT, E>(state);
    PaginationLinksCache.set(state, links);
  }

  return links as Readonly<PaginationLinks<RT, E>>;
}
