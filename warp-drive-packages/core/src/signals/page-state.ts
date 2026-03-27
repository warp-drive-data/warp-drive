/**
 * @module @warp-drive/ember
 */
import { assert } from '@warp-drive/core/build-config/macros';

import type { ReactiveDocument } from '../reactive.ts';
import type { Future } from '../request.ts';
import type { StructuredErrorDocument } from '../types/request.ts';
import type { Link } from '../types/spec/json-api-raw.ts';
import type { PaginationState } from './pagination-state.ts';
import { memoized, signal } from './reactivity/signal';
import type { RequestState } from './request-state.ts';
import { getRequestState } from './request-state.ts';

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

export class PageState<RT = unknown, E = unknown> {
  declare manager: PaginationState<RT, E>;
  @signal declare request: Future<RT> | null;
  @signal declare state: Readonly<RequestState<RT, StructuredErrorDocument<E>>> | null;
  @signal declare selfLink: string | null;
  @signal declare prevLink: string | null;
  @signal declare nextLink: string | null;
  @signal declare firstLink: string | null;
  @signal declare lastLink: string | null;
  @signal declare pageNumber: number;
  @signal declare before: Readonly<PageState<RT, E>> | null;
  @signal declare after: Readonly<PageState<RT, E>> | null;

  constructor(manager: PaginationState<RT, E>, futureOrLink: Future<RT> | string) {
    this.manager = manager;
    this.pageNumber = 0;
    if (typeof futureOrLink === 'string') {
      this.selfLink = futureOrLink;
    } else {
      this.load(futureOrLink);
    }
  }

  @memoized
  get value(): ReactiveDocument<RT[]> | null {
    return this.state?.value as ReactiveDocument<RT[]>;
  }

  @memoized
  get data(): RT[] | null {
    return this.value?.data as RT[];
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
  get prev(): PageState<RT, E> | null {
    const url = this.prevLink;
    return url ? this.manager.getPageState(url) : null;
  }

  @memoized
  get next(): PageState<RT, E> | null {
    const url = this.nextLink;
    return url ? this.manager.getPageState(url) : null;
  }

  @memoized
  get first(): PageState<RT, E> | null {
    const url = this.firstLink;
    return url ? this.manager.getPageState(url) : null;
  }

  @memoized
  get last(): PageState<RT, E> | null {
    const url = this.lastLink;
    return url ? this.manager.getPageState(url) : null;
  }

  load = async (request: Future<unknown>): Promise<ReactiveDocument<RT[]> | null> => {
    try {
      this.request = request as Future<RT>;
      this.state = getRequestState<RT, E>(this.request);
      const value = await this.request;
      const content = value.content as ReactiveDocument<RT[]>;

      const self = getHref(content?.links?.self);
      assert('Expected the page to have a self link', self);

      // Ensure the page is cached under its self link when it's loaded only with a future
      if (!this.selfLink || !this.manager.getPageState(self)) {
        this.selfLink = self;
        this.manager.pagesCache.set(this.selfLink, this);
      }

      const next = getHref(content?.links?.next);
      if (next) {
        this.nextLink = next;
        const nextPage = this.manager.getPageState(next);
        nextPage.updateLinks({ prev: self });
      }

      const prev = getHref(content?.links?.prev);
      if (prev) {
        const prevPage = this.manager.getPageState(prev);
        this.prevLink = prev;
        prevPage.updateLinks({ next: self });
      }

      const first = getHref(content?.links?.first);
      if (first) {
        this.firstLink = first;
      }

      const last = getHref(content?.links?.last);
      if (last) {
        this.lastLink = last;
      }

      this.pageNumber = this.getPageNumber(content);
      this.manager.totalPages = this.getTotalPages(content);

      return content;
    } catch {}

    return null;
  };

  getPageNumber = (document: ReactiveDocument<unknown>): number => {
    const currentPage = (document.meta?.page ?? document.meta?.currentPage ?? 0) as number;
    assert(
      'Could not determine the page number from the document meta. Make sure to include either a `currentPage` or `page` property.',
      currentPage > 0
    );
    return currentPage;
  };

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
