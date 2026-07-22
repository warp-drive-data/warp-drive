// import { assert } from '@warp-drive/core/build-config/macros';

import type { PageCache } from './page-cache.ts';
import type { PaginationCache } from './pagination-cache.ts';
import { memoized } from './reactivity/signal';

const PaginationLinksCache = new WeakMap<PaginationCache, PaginationLinks>();

export class RealPaginationLink {
  readonly isReal = true as const;

  readonly url: string;
  readonly index: number;

  constructor(url: string, index: number) {
    this.url = url;
    this.index = index;
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

// function getPaginationLink(
//   existingLink: RealPaginationLink | PlaceholderPaginationLink | null,
//   index: number,
//   currentPage: number,
//   url: string | null
// ): PaginationLink {
//   const isCurrent = index === currentPage;
//   const distanceFromActiveIndex = Math.abs(index - currentPage);
//   if (existingLink?.isReal) {
//     assert('Found existing real link with a different URL', !url || !existingLink.url || url === existingLink.url);
//     return new RealPaginationLink(url ?? existingLink.url, index, isCurrent, distanceFromActiveIndex);
//   } else if (url) {
//     return new RealPaginationLink(url, index, isCurrent, distanceFromActiveIndex);
//   } else {
//     return new PlaceholderPaginationLink([index, index], distanceFromActiveIndex);
//   }
// }

export type PaginationLink = RealPaginationLink | PlaceholderPaginationLink;

export class PaginationLinks<RT = unknown, E = unknown> {
  declare paginationCache: PaginationCache<RT, E>;

  private _links: PaginationLink[] = [];

  constructor(paginationCache: PaginationCache<RT, E>) {
    this.paginationCache = paginationCache;
  }

  /** All available links and placeholders */
  @memoized
  get links(): PaginationLink[] {
    const paginationCache = this.paginationCache;
    const { firstPage, totalPages } = paginationCache;

    const links = [];
    if (firstPage) {
      let previousPage: Readonly<PageCache<RT, E>> | null = null;
      let currentPage: Readonly<PageCache<RT, E>> | null = firstPage;
      while (currentPage) {
        if (previousPage && currentPage.pageNumber - previousPage.pageNumber > 1) {
          links.push(new PlaceholderPaginationLink([previousPage.pageNumber + 1, currentPage.pageNumber - 1]));
        }
        links.push(new RealPaginationLink(currentPage.selfLink ?? '', currentPage.pageNumber));
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

export function getPaginationLinks<RT, E>(state: PaginationCache<RT, E>): Readonly<PaginationLinks<RT, E>> {
  let links = PaginationLinksCache.get(state);

  if (!links) {
    links = new PaginationLinks<RT, E>(state);
    PaginationLinksCache.set(state, links);
  }

  return links as Readonly<PaginationLinks<RT, E>>;
}
