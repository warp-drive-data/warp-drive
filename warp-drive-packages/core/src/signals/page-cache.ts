/**
 * @module @warp-drive/ember
 */
import { assert } from '@warp-drive/core/build-config/macros';

import type { ReactiveDocument } from '../reactive.ts';
import type { Future } from '../request.ts';
import type { StructuredErrorDocument } from '../types/request.ts';
import type { Link } from '../types/spec/json-api-raw.ts';
import type { PaginationCache } from './pagination-cache.ts';
import { memoized, signal } from './reactivity/signal';
import type { RequestState } from './request-state.ts';
import { getRequestState } from './request-state.ts';

const { abs } = Math;

export type ContentData<RT> = RT extends { data: infer D } ? D : RT;
export type ContentItem<RT> = ContentData<RT> extends readonly (infer I)[] ? I : ContentData<RT>;

export function getHref(link?: Link | null): string | null {
  if (!link) {
    return null;
  }
  if (typeof link === 'string') {
    return link;
  }
  return link.href;
}

type Links = {
  prev?: string | null;
  next?: string | null;
  first?: string | null;
  last?: string | null;
};

export class PageCache<RT = unknown, E = unknown> {
  declare manager: PaginationCache<RT, E>;
  @signal declare request: Future<RT> | null;
  @signal declare state: Readonly<RequestState<RT, StructuredErrorDocument<E>>> | null;
  @signal declare selfLink: string | null;
  @signal declare prevLink: string | null;
  @signal declare nextLink: string | null;
  @signal declare firstLink: string | null;
  @signal declare lastLink: string | null;
  @signal declare pageNumber: number;
  @signal declare before: Readonly<PageCache<RT, E>> | null;
  @signal declare after: Readonly<PageCache<RT, E>> | null;

  constructor(manager: PaginationCache<RT, E>, url: string) {
    this.manager = manager;
    this.pageNumber = 0;
    this.selfLink = url;
  }

  @memoized
  get value(): RT | null {
    return (this.state?.value ?? null) as RT | null;
  }

  @memoized
  get data(): ContentData<RT> | null {
    return ((this.value as { data?: unknown } | null)?.data ?? null) as ContentData<RT> | null;
  }

  @memoized
  get isRequested(): boolean {
    return Boolean(this.state);
  }

  @memoized
  get isLoaded(): boolean {
    return this.isSuccess || this.isError;
  }

  @memoized
  get isLoading(): boolean {
    return Boolean(this.state?.isLoading);
  }

  @memoized
  get isSuccess(): boolean {
    return Boolean(this.state?.isSuccess);
  }

  @memoized
  get isCancelled(): boolean {
    return Boolean(this.state?.isCancelled);
  }

  @memoized
  get isError(): boolean {
    return Boolean(this.state?.isError);
  }

  @memoized
  get reason(): StructuredErrorDocument<E> | null {
    return this.state?.reason ?? null;
  }

  @memoized
  get prev(): PageCache<RT, E> | null {
    const url = this.prevLink;
    return url ? this.manager.getPageCache(url) : null;
  }

  @memoized
  get next(): PageCache<RT, E> | null {
    const url = this.nextLink;
    return url ? this.manager.getPageCache(url) : null;
  }

  @memoized
  get first(): PageCache<RT, E> | null {
    const url = this.firstLink;
    return url ? this.manager.getPageCache(url) : null;
  }

  @memoized
  get last(): PageCache<RT, E> | null {
    const url = this.lastLink;
    return url ? this.manager.getPageCache(url) : null;
  }

  @memoized
  get isLinked(): boolean {
    return Boolean(this.before || this.after);
  }

  async load(request: Future<RT>): Promise<ReactiveDocument<unknown> | null> {
    try {
      this.request = request;
      this.state = getRequestState<RT, E>(this.request);
      const value = await this.request;
      const content = value.content as ReactiveDocument<unknown>;

      const self = getHref(content?.links?.self);
      const first = getHref(content?.links?.first);
      const last = getHref(content?.links?.last);
      const next = getHref(content?.links?.next);
      const prev = getHref(content?.links?.prev);

      assert('Expected the page to have a self link', self);

      this.pageNumber = this.getPageNumber(content);

      const firstPage = first ? this.manager.getPageCache(first) : null;
      const lastPage = last ? this.manager.getPageCache(last) : null;
      const prevPage = prev ? this.manager.getPageCache(prev) : null;
      const nextPage = next ? this.manager.getPageCache(next) : null;

      if (firstPage) {
        this.firstLink = first;
        firstPage.setPageNumber(1);
        if (!firstPage.after) {
          firstPage.updateLinkage({ after: this });
        }
      }

      if (lastPage) {
        this.lastLink = last;
        lastPage.setPageNumber(this.manager.totalPages);
        if (!lastPage.before) {
          lastPage.updateLinkage({ before: this });
        }
      }

      if (nextPage) {
        this.nextLink = next;
        nextPage.setPageNumber(this.pageNumber + 1);
        nextPage.updateLinks({ prev: self });
      }

      if (prevPage) {
        this.prevLink = prev;
        prevPage.setPageNumber(this.pageNumber - 1);
        prevPage.updateLinks({ next: self });
      }

      if (this.isLinked) {
        if (prevPage) prevPage.updateLinkage({ after: this });
        if (nextPage) nextPage.updateLinkage({ before: this });
      } else if (prevPage?.isLinked) {
        this.updateLinkage({ before: prevPage });
        if (nextPage) nextPage.updateLinkage({ before: this });
      } else if (nextPage?.isLinked) {
        this.updateLinkage({ after: nextPage });
        if (prevPage) prevPage.updateLinkage({ after: this });
      } else if ((prevPage || nextPage) && (firstPage || lastPage)) {
        this.lookupLinkage(firstPage, lastPage);
      } else if (prevPage || nextPage) {
        this.updateLinkage({ before: prevPage, after: nextPage });
      }

      return content;
    } catch {
      // no-op
    }

    return null;
  }

  updateLinkage({ before, after }: { before?: PageCache<RT, E> | null; after?: PageCache<RT, E> | null }): void {
    assert('Expected at least one of before or after page states to link to this page', before || after);

    const leftSide = before ?? after?.before;
    const rightSide = after ?? before?.after;

    if (leftSide && leftSide !== this) {
      leftSide.setAfter(this);
      this.setBefore(leftSide);
    }

    if (rightSide && rightSide !== this) {
      rightSide.setBefore(this);
      this.setAfter(rightSide);
    }
  }

  lookupLinkage(firstPage: PageCache<RT, E> | null, lastPage: PageCache<RT, E> | null): void {
    assert('Expected at least one of firstPage or lastPage to lookup linkage against', firstPage || lastPage);

    if (firstPage && lastPage) {
      const firstPageDelta = abs(this.pageNumber - firstPage.pageNumber);
      const lastPageDelta = abs(this.pageNumber - lastPage.pageNumber);

      if (firstPageDelta <= lastPageDelta) {
        this.lookupLinkageForward(firstPage);
      } else {
        this.lookupLinkageBackwards(lastPage);
      }
    } else if (firstPage) {
      this.lookupLinkageForward(firstPage);
    } else if (lastPage) {
      this.lookupLinkageBackwards(lastPage);
    }
  }

  lookupLinkageForward(page: PageCache<RT, E>): void {
    while (page.after && page.after.pageNumber < this.pageNumber) {
      page = page.after;
    }

    this.updateLinkage({ before: page });
  }

  lookupLinkageBackwards(page: PageCache<RT, E>): void {
    while (page.before && page.before.pageNumber > this.pageNumber) {
      page = page.before;
    }

    this.updateLinkage({ after: page });
  }

  setBefore(page: Readonly<PageCache<RT, E>> | null): void {
    assert('Expected the before page to be a different page, got the same page', page !== this);
    this.before = page;
  }

  setAfter(page: Readonly<PageCache<RT, E>> | null): void {
    assert('Expected the after page to be a different page, got the same page', page !== this);
    this.after = page;
  }

  getPageNumber(document: ReactiveDocument<unknown>): number {
    return this.manager.readPageHints(document).currentPage;
  }

  updateLinks = ({ prev, next, first, last }: Links): void => {
    if (prev) {
      this.prevLink = prev;
    }
    if (next) {
      this.nextLink = next;
    }
    if (first) {
      this.firstLink = first;
    }
    if (last) {
      this.lastLink = last;
    }
  };

  setPageNumber = (pageNumber: number): void => {
    if (!this.pageNumber) {
      this.pageNumber = pageNumber;
    }
  };
}
