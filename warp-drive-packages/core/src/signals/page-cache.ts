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

/**
 * Extracts the `data` member of a document type, or the document type itself
 * when it has no `data` member.
 */
export type ContentData<RT> = RT extends { data: infer D } ? D : RT;

/**
 * The element type of a collection document's `data` array — the item type an
 * infinite view renders. See {@link PaginationState.data}.
 */
export type ContentItem<RT> = ContentData<RT> extends readonly (infer I)[] ? I : ContentData<RT>;

/** @internal */
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

/**
 * A single page of a paginated collection: its request, its loaded document, and
 * its links to neighboring pages in the shared page graph.
 *
 * Pages are yielded to consumers as `Readonly<PageCache>` — through
 * {@link PaginationState.activePage}, {@link PaginationState.pages}, and the
 * relational getters below — to read a page's data and request status when
 * building pagination UIs:
 *
 * ```ts
 * const page = paginationState.activePage;
 *
 * if (page?.isLoading) {
 *   // show a spinner
 * } else if (page?.isError) {
 *   // show page.reason
 * } else {
 *   // render page.data
 * }
 * ```
 *
 * @hideconstructor
 */
export class PageCache<RT = unknown, E = unknown> {
  /** @internal */
  declare manager: PaginationCache<RT, E>;

  /**
   * The request that loaded (or is loading) this page, or `null` if the page is
   * known from links but was never requested. Wrap it in a `<Request>` component
   * to render the page's loading, error, and content states.
   */
  @signal declare request: Future<RT> | null;

  /** @internal */
  @signal declare state: Readonly<RequestState<RT, StructuredErrorDocument<E>>> | null;

  /** The `self` link of this page — the URL that identifies it in the collection. */
  @signal declare selfLink: string | null;

  /** The `prev` link of this page, or `null` at the start of the collection. */
  @signal declare prevLink: string | null;

  /** The `next` link of this page, or `null` at the end of the collection. */
  @signal declare nextLink: string | null;

  /** The `first` link of the collection, when the response exposed one. */
  @signal declare firstLink: string | null;

  /** The `last` link of the collection, when the response exposed one. */
  @signal declare lastLink: string | null;

  /**
   * The 1-based page number, or `0` when unknown (for example cursor-based
   * pagination, where pages have no ordinal position). Derived from the
   * collection's {@link PageHints}.
   */
  @signal declare pageNumber: number;

  /** @internal */
  @signal declare before: Readonly<PageCache<RT, E>> | null;
  /** @internal */
  @signal declare after: Readonly<PageCache<RT, E>> | null;

  constructor(manager: PaginationCache<RT, E>, url: string) {
    this.manager = manager;
    this.pageNumber = 0;
    this.selfLink = url;
  }

  /**
   * The document this page's request resolved to, or `null` while it has not
   * resolved.
   */
  @memoized
  get value(): RT | null {
    return (this.state?.value ?? null) as RT | null;
  }

  /**
   * The `data` member of the loaded document — the page's items — or `null`
   * while the page has not loaded.
   */
  @memoized
  get data(): ContentData<RT> | null {
    return ((this.value as { data?: unknown } | null)?.data ?? null) as ContentData<RT> | null;
  }

  /**
   * Whether a request has ever been issued for this page. `false` for pages that
   * are known only from links.
   */
  @memoized
  get isRequested(): boolean {
    return Boolean(this.state);
  }

  /** Whether this page's request has settled (successfully or with an error). */
  @memoized
  get isLoaded(): boolean {
    return this.isSuccess || this.isError;
  }

  /** Whether this page's request is currently in flight. */
  @memoized
  get isLoading(): boolean {
    return Boolean(this.state?.isLoading);
  }

  /** Whether this page's request resolved successfully. */
  @memoized
  get isSuccess(): boolean {
    return Boolean(this.state?.isSuccess);
  }

  /** Whether this page's request was cancelled (aborted). */
  @memoized
  get isCancelled(): boolean {
    return Boolean(this.state?.isCancelled);
  }

  /** Whether this page's request rejected with an error. */
  @memoized
  get isError(): boolean {
    return Boolean(this.state?.isError);
  }

  /** The error this page's request rejected with, or `null` if it did not reject. */
  @memoized
  get reason(): StructuredErrorDocument<E> | null {
    return this.state?.reason ?? null;
  }

  /** The page at this page's `prev` link, or `null` at the start of the collection. */
  @memoized
  get prev(): PageCache<RT, E> | null {
    const url = this.prevLink;
    return url ? this.manager.getPageCache(url) : null;
  }

  /** The page at this page's `next` link, or `null` at the end of the collection. */
  @memoized
  get next(): PageCache<RT, E> | null {
    const url = this.nextLink;
    return url ? this.manager.getPageCache(url) : null;
  }

  /** The first page of the collection, when the response exposed a `first` link. */
  @memoized
  get first(): PageCache<RT, E> | null {
    const url = this.firstLink;
    return url ? this.manager.getPageCache(url) : null;
  }

  /** The last page of the collection, when the response exposed a `last` link. */
  @memoized
  get last(): PageCache<RT, E> | null {
    const url = this.lastLink;
    return url ? this.manager.getPageCache(url) : null;
  }

  /** @internal */
  @memoized
  get isLinked(): boolean {
    return Boolean(this.before || this.after);
  }

  /** @internal */
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

      // The page number is a hint. When the response exposes it, rely on it. When
      // absent (`0`, e.g. cursor pagination), keep whatever relative number a
      // neighbor already assigned via `setPageNumber` rather than clobbering it.
      const pageNumber = this.getPageNumber(content);
      if (pageNumber) {
        this.pageNumber = pageNumber;
      }

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

  /** @internal */
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

  /** @internal */
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

  /** @internal */
  lookupLinkageForward(page: PageCache<RT, E>): void {
    while (page.after && page.after.pageNumber < this.pageNumber) {
      page = page.after;
    }

    this.updateLinkage({ before: page });
  }

  /** @internal */
  lookupLinkageBackwards(page: PageCache<RT, E>): void {
    while (page.before && page.before.pageNumber > this.pageNumber) {
      page = page.before;
    }

    this.updateLinkage({ after: page });
  }

  /** @internal */
  setBefore(page: Readonly<PageCache<RT, E>> | null): void {
    assert('Expected the before page to be a different page, got the same page', page !== this);
    this.before = page;
  }

  /** @internal */
  setAfter(page: Readonly<PageCache<RT, E>> | null): void {
    assert('Expected the after page to be a different page, got the same page', page !== this);
    this.after = page;
  }

  /** @internal */
  getPageNumber(document: ReactiveDocument<unknown>): number {
    return this.manager.readPageHints(document).currentPage;
  }

  /** @internal */
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

  /** @internal */
  setPageNumber = (pageNumber: number): void => {
    if (!this.pageNumber) {
      this.pageNumber = pageNumber;
    }
  };
}
