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
 * @summary Experimental: one page of a paginated collection, exposing its request, loading and error status, data,
 * and links to neighboring pages.
 * @since 5.9.0
 * @public
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
    return this.state?.value as RT | null;
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
    this.request = request;
    this.state = getRequestState<RT, E>(this.request);
    let content: ReactiveDocument<unknown>;
    try {
      content = (await this.request).content as ReactiveDocument<unknown>;
    } catch {
      // a rejected request is surfaced reactively through the page's state
      return null;
    }

    this.applyDocument(content);
    return content;
  }

  /**
   * Re-applies an already-loaded page from a newer request for the same page
   * (a reload, or a route-driven navigation back to it). The newer document is
   * authoritative: its links and page hints replace the ones recorded from
   * the earlier load, and the collection total is updated from it. The page
   * keeps its current request until the newer one resolves, so a page on
   * screen does not flash a loading state; a rejected request leaves the
   * page untouched.
   *
   * @internal
   */
  async update(request: Future<RT>): Promise<ReactiveDocument<unknown> | null> {
    const state = getRequestState<RT, E>(request);
    let content: ReactiveDocument<unknown>;
    try {
      content = (await request).content as ReactiveDocument<unknown>;
    } catch {
      return null;
    }

    this.request = request;
    this.state = state;
    this.applyDocument(content);
    return content;
  }

  /**
   * Records a loaded document's links and page number, and links this page
   * into the shared page graph.
   *
   * The document is authoritative for what it states: a link it names
   * explicitly (including an explicit `null`) overwrites whatever a neighbor
   * or an earlier load of this page recorded, and a link it omits is kept.
   * `next`/`prev` name the adjacent pages; `first`/`last` name the ends of
   * the collection, beyond which nothing may remain linked.
   *
   * For a numbered collection the document must also agree with the page
   * numbers: `next` is the page after this one, `prev` the page before, a
   * page without `prev` is page 1, a page without `next` is the last page,
   * `first` is page 1 and `last` is page `totalPages`. A document that
   * contradicts this is a server (or collection-mixing) bug and is asserted
   * in development, before anything is recorded from it. A cursor collection
   * has no numbers, so there its links are the only authority.
   *
   * @internal
   */
  applyDocument(content: ReactiveDocument<unknown>): void {
    const links = (content?.links ?? {}) as Record<string, unknown>;
    const self = getHref(content?.links?.self);
    const first = getHref(content?.links?.first);
    const last = getHref(content?.links?.last);
    const next = getHref(content?.links?.next);
    const prev = getHref(content?.links?.prev);

    assert('Expected the page to have a self link', self);

    // Both hints may be `0` (unknown, e.g. cursor pagination).
    const { currentPage, totalPages } = this.manager.readPageHints(content);

    const firstPage = first ? this.manager.getPageCache(first) : null;
    const lastPage = last ? this.manager.getPageCache(last) : null;
    const prevPage = prev ? this.manager.getPageCache(prev) : null;
    const nextPage = next ? this.manager.getPageCache(next) : null;

    if (this.manager.isNumbered) {
      // a page's number as known so far: this document's hint for this page,
      // otherwise what is recorded — its own document's hint, or the number a
      // neighbor assigned by position (in a numbered collection those are
      // consistent, so a mismatch is a contradiction either way); `0` is unknown
      const ownNumber = (page: Readonly<PageCache<RT, E>>): number => (page === this ? currentPage : page.pageNumber);

      assert(
        `Page ${self} is page ${currentPage} but the collection has ${totalPages} pages: it lies beyond the collection total`,
        !currentPage || !totalPages || currentPage <= totalPages
      );
      assert(
        `Page ${self} is page ${currentPage} and has no prev link but is not the first page`,
        !('prev' in links && !prev && currentPage > 1)
      );
      assert(
        `Page ${self} is page ${currentPage} of ${totalPages} and has no next link but is not the last page`,
        !('next' in links && !next && currentPage > 0 && totalPages > 0 && currentPage < totalPages)
      );
      assert(
        `Page ${self} is page ${currentPage} but its next link names page ${nextPage ? ownNumber(nextPage) : 0}, expected page ${currentPage + 1}`,
        !nextPage || !currentPage || !ownNumber(nextPage) || ownNumber(nextPage) === currentPage + 1
      );
      assert(
        `Page ${self} is page ${currentPage} but its prev link names page ${prevPage ? ownNumber(prevPage) : 0}, expected page ${currentPage - 1}`,
        !prevPage || !currentPage || !ownNumber(prevPage) || ownNumber(prevPage) === currentPage - 1
      );
      assert(
        `Page ${self} has a first link that names page ${firstPage ? ownNumber(firstPage) : 0}, expected page 1`,
        !firstPage || !ownNumber(firstPage) || ownNumber(firstPage) === 1
      );
      assert(
        `Page ${self} has a last link that names page ${lastPage ? ownNumber(lastPage) : 0}, expected the last page ${totalPages}`,
        !lastPage || !totalPages || !ownNumber(lastPage) || ownNumber(lastPage) === totalPages
      );
      assert(
        `Page ${self} has a first link to ${first} but that first page has a page linked before it`,
        !firstPage?.before
      );
    }

    // The page number is a hint. When the response exposes it, rely on it. When
    // absent, keep whatever relative number a neighbor already assigned via
    // `setPageNumber` rather than clobbering it.
    if (currentPage) {
      this.pageNumber = currentPage;
    }
    this.manager.totalPages = totalPages;

    const stated: Links = {};
    if ('first' in links) stated.first = first;
    if ('last' in links) stated.last = last;
    if ('next' in links) stated.next = next;
    if ('prev' in links) stated.prev = prev;
    this.updateLinks(stated);

    // An explicit `null` next/prev link, or a first/last link, marks an end
    // of the collection: nothing in the graph may extend past it, and the end
    // page has no link past it either. Detaching drops pages that no longer
    // exist (e.g. the collection shrank) from the chain; they stay cached and
    // relink if a later document reaches them. A neighbor whose own link
    // still named this page is contradicted by this newer document, so that
    // link is cleared too — links and graph must agree.
    if ('next' in links && !next) {
      const after = this.after;
      this.detachAfter();
      if (after?.prevLink === self) after.updateLinks({ prev: null });
    }
    if ('prev' in links && !prev) {
      const before = this.before;
      this.detachBefore();
      if (before?.nextLink === self) before.updateLinks({ next: null });
    }
    if (lastPage) {
      lastPage.detachAfter();
      lastPage.updateLinks({ next: null });
    }
    if (firstPage) {
      firstPage.detachBefore();
      firstPage.updateLinks({ prev: null });
    }

    // first/last are sparse hints: the end page belongs beyond every page
    // reachable from this one, not necessarily right beside it.
    if (firstPage) {
      firstPage.setPageNumber(1);
      if (firstPage !== this && !firstPage.after) {
        this.linkFirst(firstPage);
      }
    }

    if (lastPage) {
      lastPage.setPageNumber(this.manager.totalPages);
      if (lastPage !== this && !lastPage.before) {
        this.linkLast(lastPage);
      }
    }

    if (nextPage) {
      nextPage.setPageNumber(this.pageNumber + 1);
      nextPage.updateLinks({ prev: self });
    }

    if (prevPage) {
      prevPage.setPageNumber(this.pageNumber - 1);
      prevPage.updateLinks({ next: self });
    }

    // next/prev are adjacency: a page currently linked beside this one that
    // the document names differently stays only when its page number proves
    // it lies beyond the named neighbor (a sparse first/last placement).
    // Otherwise it is stale — e.g. a cursor that moved — and detaches.
    if (nextPage && this.after && this.after !== nextPage && this.after.pageNumber <= nextPage.pageNumber) {
      this.detachAfter();
    }
    if (prevPage && this.before && this.before !== prevPage && this.before.pageNumber >= prevPage.pageNumber) {
      this.detachBefore();
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
  }

  /** @internal */
  detachAfter(): void {
    const after = this.after;
    if (after) {
      if (after.before === this) after.setBefore(null);
      this.setAfter(null);
    }
  }

  /** @internal */
  detachBefore(): void {
    const before = this.before;
    if (before) {
      if (before.after === this) before.setAfter(null);
      this.setBefore(null);
    }
  }

  /**
   * Links an unlinked `first` page before the earliest page reachable
   * backwards from this one that must follow it.
   *
   * @internal
   */
  linkFirst(firstPage: PageCache<RT, E>): void {
    // oxlint-disable-next-line typescript/no-this-alias
    let head: PageCache<RT, E> = this;
    while (
      head.before &&
      head.before !== firstPage &&
      (!head.before.pageNumber || head.before.pageNumber > firstPage.pageNumber)
    ) {
      head = head.before;
    }
    firstPage.updateLinkage({ after: head });
  }

  /**
   * Links an unlinked `last` page after the furthest page reachable forwards
   * from this one that must precede it.
   *
   * @internal
   */
  linkLast(lastPage: PageCache<RT, E>): void {
    // oxlint-disable-next-line typescript/no-this-alias
    let tail: PageCache<RT, E> = this;
    while (
      tail.after &&
      tail.after !== lastPage &&
      (!tail.after.pageNumber || !lastPage.pageNumber || tail.after.pageNumber < lastPage.pageNumber)
    ) {
      tail = tail.after;
    }
    lastPage.updateLinkage({ before: tail });
  }

  /**
   * Places this page between `before` and `after` in the graph (a missing side
   * is taken from the given side's current neighbor, so a single side splices
   * this page in). Pointers this page or the displaced neighbors held to their
   * old positions are cleared first, so a page moved within the graph never
   * leaves a dangling link behind that could close a cycle.
   *
   * @internal
   */
  updateLinkage({ before, after }: { before?: PageCache<RT, E> | null; after?: PageCache<RT, E> | null }): void {
    assert('Expected at least one of before or after page states to link to this page', before || after);

    const leftSide = before ?? after?.before;
    const rightSide = after ?? before?.after;

    if (leftSide && leftSide !== this) {
      if (this.before !== leftSide) this.detachBefore();
      const displaced = leftSide.after;
      if (displaced && displaced !== this && displaced !== rightSide && displaced.before === leftSide) {
        displaced.setBefore(null);
      }
      leftSide.setAfter(this);
      this.setBefore(leftSide);
    }

    if (rightSide && rightSide !== this) {
      if (this.after !== rightSide) this.detachAfter();
      const displaced = rightSide.before;
      if (displaced && displaced !== this && displaced !== leftSide && displaced.after === rightSide) {
        displaced.setAfter(null);
      }
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

  /**
   * Records the given links. Only the keys present are applied, so a caller
   * states exactly what it knows: an explicit `null` clears a link, an
   * omitted key leaves the recorded link alone.
   *
   * @internal
   */
  updateLinks = (links: Links): void => {
    if ('prev' in links) {
      this.prevLink = links.prev ?? null;
    }
    if ('next' in links) {
      this.nextLink = links.next ?? null;
    }
    if ('first' in links) {
      this.firstLink = links.first ?? null;
    }
    if ('last' in links) {
      this.lastLink = links.last ?? null;
    }
  };

  /** @internal */
  setPageNumber = (pageNumber: number): void => {
    if (!this.pageNumber) {
      this.pageNumber = pageNumber;
    }
  };
}
