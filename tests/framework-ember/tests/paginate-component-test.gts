import { fn } from '@ember/helper';
import { on } from '@ember/modifier';
import { click, rerender } from '@ember/test-helpers';

import { Fetch, RequestManager } from '@warp-drive/core';
import type { CacheHandler, Future, NextFn } from '@warp-drive/core/request';
import type { RequestContext, StructuredDataDocument } from '@warp-drive/core/types/request';
import type { RenderingTestContext } from '@warp-drive/diagnostic/ember';
import { module, setupRenderingTest, test as _test } from '@warp-drive/diagnostic/ember';
import { clearPaginationCache, EachLink, getPaginationState, Paginate, Request } from '@warp-drive/ember';
import { MockServerHandler } from '@warp-drive/holodeck';
import { GET } from '@warp-drive/holodeck/mock';
import { buildBaseURL } from '@warp-drive/utilities';

// our tests use a rendering test context and add manager to it
interface LocalTestContext extends RenderingTestContext {
  manager: RequestManager;
}
type DiagnosticTest = Parameters<typeof _test<LocalTestContext>>[1];
function test(name: string, callback: DiagnosticTest): void {
  return _test<LocalTestContext>(name, callback);
}

type UserResource = {
  id: string;
  type: 'user';
  attributes: {
    name: string;
  };
};

class SimpleCacheHandler implements CacheHandler {
  _cache: Map<string, unknown> = new Map();
  request<T = unknown>(
    context: RequestContext,
    next: NextFn<T>
  ): T | Promise<T | StructuredDataDocument<T>> | Future<T> {
    const { url, method, cacheOptions } = context.request;
    if (url && method === 'GET' && this._cache.has(url) && cacheOptions?.reload !== true) {
      return this._cache.get(url) as T;
    }

    const future = next(context.request);
    context.setStream(future.getStream());

    return future.then(
      (result) => {
        if (url && method === 'GET') {
          this._cache.set(url, result);
        }
        return result;
      },
      (error) => {
        if (url && method === 'GET') {
          this._cache.set(url, error);
        }
        throw error;
      }
    );
  }
}

const users = [
  {
    id: '1',
    type: 'user',
    attributes: {
      name: 'Chris Thoburn',
    },
  },
  {
    id: '2',
    type: 'user',
    attributes: {
      name: 'Leo Euclides',
    },
  },
  {
    id: '3',
    type: 'user',
    attributes: {
      name: 'Mehul Chaudhari',
    },
  },
  {
    id: '4',
    type: 'user',
    attributes: {
      name: 'Benedikt Deicke',
    },
  },
  {
    id: '5',
    type: 'user',
    attributes: {
      name: 'Jane Portman',
    },
  },
  {
    id: '6',
    type: 'user',
    attributes: {
      name: 'Mia Sinek',
    },
  },
];

module<LocalTestContext>('Integration | <Paginate />', function (hooks) {
  setupRenderingTest(hooks);

  hooks.beforeEach(function () {
    clearPaginationCache();

    const manager = new RequestManager();
    manager.use([new MockServerHandler(this), Fetch]);
    manager.useCache(new SimpleCacheHandler());

    this.manager = manager;
  });
  test('it handles paged pagination with complete data', async function (assert) {
    const urls = [
      buildBaseURL({ resourcePath: 'users/1' }),
      buildBaseURL({ resourcePath: 'users/2' }),
      buildBaseURL({ resourcePath: 'users/3' }),
      buildBaseURL({ resourcePath: 'users/4' }),
      buildBaseURL({ resourcePath: 'users/5' }),
      buildBaseURL({ resourcePath: 'users/6' }),
    ];

    await GET(this, 'users/2', () => ({
      data: [users[1]],
      links: {
        first: urls[0],
        prev: urls[0],
        self: urls[1],
        next: urls[2],
        last: urls[5],
      },
      meta: {
        currentPage: 2,
        totalPages: 6,
      },
    }));

    await GET(this, 'users/1', () => ({
      data: [users[0]],
      links: {
        first: urls[0],
        prev: null,
        self: urls[0],
        next: urls[1],
        last: urls[5],
      },
      meta: {
        currentPage: 1,
        totalPages: 6,
      },
    }));

    await GET(this, 'users/6', () => ({
      data: [users[5]],
      links: {
        first: urls[0],
        prev: urls[4],
        self: urls[5],
        next: urls[6],
        last: urls[5],
      },
      meta: {
        currentPage: 6,
        totalPages: 6,
      },
    }));

    await GET(this, 'users/5', () => ({
      data: [users[4]],
      links: {
        first: urls[0],
        prev: urls[3],
        self: urls[4],
        next: urls[5],
        last: urls[5],
      },
      meta: {
        currentPage: 5,
        totalPages: 6,
      },
    }));

    await GET(this, 'users/4', () => ({
      data: [users[3]],
      links: {
        first: urls[0],
        prev: urls[2],
        self: urls[3],
        next: urls[4],
        last: urls[5],
      },
      meta: {
        currentPage: 4,
        totalPages: 6,
      },
    }));

    await GET(this, 'users/3', () => ({
      data: [users[2]],
      links: {
        first: urls[0],
        prev: urls[1],
        self: urls[2],
        next: urls[3],
        last: urls[5],
      },
      meta: {
        currentPage: 3,
        totalPages: 6,
      },
    }));

    const request = this.manager.request<UserResource[]>({ url: urls[1], method: 'GET' });
    const paginationState = getPaginationState(this.manager, request);

    let counter = 0;
    function countFor(_result: unknown) {
      return ++counter;
    }

    const manager = this.manager;

    await this.render(
      <template>
        <Paginate @request={{request}} @store={{manager}} @mode="paged">
          <:loading>
            <span data-test-pending>Pending<br />Count: {{countFor request}}</span>
          </:loading>
          <:content as |pages features|>
            <Request @request={{pages.activePageRequest}} @store={{manager}}>
              <:idle><span data-test-idle>No page is active</span></:idle>
              <:content as |content|>
                {{#each content as |user|}}
                  <span data-test-user-name>{{user.attributes.name}}<br />Count: {{countFor user}}</span>
                {{/each}}
              </:content>
              <:loading><span data-test-loading-page>Pending<br />Count: {{countFor request}}</span></:loading>
            </Request>

            <EachLink @state={{pages}} @store={{manager}}>
              <:link as |link|>
                <button
                  {{on "click" (fn features.loadPage link.url)}}
                  data-test-load-page={{link.index}}
                  data-test-url={{link.url}}
                >{{link.text}}</button>
              </:link>
              <:placeholder as |link|>
                <button>.</button>
              </:placeholder>
            </EachLink>
          </:content>
          <:error as |error|>{{error.message}}<br />Count: {{countFor error}}</:error>
        </Paginate>
      </template>
    );

    let activePage = null;

    assert.equal(counter, 1);
    assert.equal(this.element.querySelector('[data-test-pending]')?.textContent.trim(), 'PendingCount: 1');
    assert.equal(Array.from(paginationState.pages).length, 0, 'No pages initially');
    assert.equal(Array.from(paginationState.data).length, 0, 'No data initially');
    assert.deepEqual(paginationState.links.length, 0, '0 links initially');

    await request;
    await rerender();

    activePage = paginationState.activePage;

    assert.equal(Array.from(paginationState.pages).length, 4, '4 pages');
    assert.deepEqual(activePage?.data, [users[1]], 'Page data');
    assert.deepEqual(activePage?.pageNumber, 2, 'Page number');
    assert.deepEqual(paginationState.totalPages, 6, 'Total pages');
    assert.deepEqual(paginationState.links.length, 5, '5 links');
    assert.deepEqual(
      paginationState.links.map((link) => (link.isReal ? `${link.index}` : '.')),
      ['1', '2', '3', '.', '6'],
      'Link names'
    );
    assert.equal(counter, 2);
    assert.equal(this.element.querySelector('[data-test-user-name]')?.textContent.trim(), 'Leo EuclidesCount: 2');
    assert.equal(this.element.querySelectorAll('[data-test-user-name]').length, 1, '1 user rendered');

    await click('[data-test-load-page="1"]');
    assert.equal(Array.from(paginationState.pages).length, 4, '4 pages');
    activePage = paginationState.activePage;
    assert.deepEqual(activePage?.data, [users[0]], 'Page data');
    assert.deepEqual(activePage?.pageNumber, 1, 'Page number');
    assert.deepEqual(paginationState.totalPages, 6, 'Total pages');
    assert.deepEqual(paginationState.links.length, 5, '5 links');
    assert.deepEqual(
      paginationState.links.map((link) => (link.isReal ? `${link.index}` : '.')),
      ['1', '2', '3', '.', '6'],
      'Link names'
    );
    assert.equal(counter, 4);
    assert.equal(this.element.querySelector('[data-test-user-name]')?.textContent.trim(), 'Chris ThoburnCount: 4');
    assert.equal(this.element.querySelectorAll('[data-test-user-name]').length, 1, '1 user rendered');

    await click('[data-test-load-page="6"]');
    assert.equal(Array.from(paginationState.pages).length, 5, '5 pages');
    activePage = paginationState.activePage;
    assert.deepEqual(activePage?.data, [users[5]], 'Page data');
    assert.deepEqual(activePage?.pageNumber, 6, 'Page number');
    assert.deepEqual(paginationState.totalPages, 6, 'Total pages');
    assert.deepEqual(paginationState.links.length, 6, '6 links');
    assert.deepEqual(
      paginationState.links.map((link) => (link.isReal ? `${link.index}` : '.')),
      ['1', '2', '3', '.', '5', '6'],
      'Link names'
    );
    assert.equal(counter, 6);
    assert.equal(this.element.querySelector('[data-test-user-name]')?.textContent.trim(), 'Mia SinekCount: 6');
    assert.equal(this.element.querySelectorAll('[data-test-user-name]').length, 1, '1 user rendered');

    await click('[data-test-load-page="5"]');
    assert.equal(Array.from(paginationState.pages).length, 6, '6 pages');
    activePage = paginationState.activePage;
    assert.deepEqual(activePage?.data, [users[4]], 'Page data');
    assert.deepEqual(activePage?.pageNumber, 5, 'Page number');
    assert.deepEqual(paginationState.totalPages, 6, 'Total pages');
    assert.deepEqual(paginationState.links.length, 6, '6 links');
    assert.deepEqual(
      paginationState.links.map((link) => (link.isReal ? `${link.index}` : '.')),
      ['1', '2', '3', '4', '5', '6'],
      'Link names'
    );
    assert.equal(counter, 8);
    assert.equal(this.element.querySelector('[data-test-user-name]')?.textContent.trim(), 'Jane PortmanCount: 8');
    assert.equal(this.element.querySelectorAll('[data-test-user-name]').length, 1, '1 user rendered');

    await click('[data-test-load-page="4"]');
    assert.equal(Array.from(paginationState.pages).length, 6, '6 pages');
    activePage = paginationState.activePage;
    assert.deepEqual(activePage?.data, [users[3]], 'Page data');
    assert.deepEqual(activePage?.pageNumber, 4, 'Page number');
    assert.deepEqual(paginationState.totalPages, 6, 'Total pages');
    assert.deepEqual(paginationState.links.length, 6, '6 links');
    assert.deepEqual(
      paginationState.links.map((link) => (link.isReal ? `${link.index}` : '.')),
      ['1', '2', '3', '4', '5', '6'],
      'Link names'
    );
    assert.equal(counter, 10);
    assert.equal(this.element.querySelector('[data-test-user-name]')?.textContent.trim(), 'Benedikt DeickeCount: 10');
    assert.equal(this.element.querySelectorAll('[data-test-user-name]').length, 1, '1 user rendered');

    await click('[data-test-load-page="3"]');
    assert.equal(Array.from(paginationState.pages).length, 6, '6 pages');
    activePage = paginationState.activePage;
    assert.deepEqual(activePage?.data, [users[2]], 'Page data');
    assert.deepEqual(activePage?.pageNumber, 3, 'Page number');
    assert.deepEqual(paginationState.totalPages, 6, 'Total pages');
    assert.deepEqual(paginationState.links.length, 6, '6 links');
    assert.deepEqual(
      paginationState.links.map((link) => (link.isReal ? `${link.index}` : '.')),
      ['1', '2', '3', '4', '5', '6'],
      'Link names'
    );
    assert.equal(counter, 12);
    assert.equal(this.element.querySelector('[data-test-user-name]')?.textContent.trim(), 'Mehul ChaudhariCount: 12');
    assert.equal(this.element.querySelectorAll('[data-test-user-name]').length, 1, '1 user rendered');
  });

  test('it handles paged pagination with incomplete data', async function (assert) {
    const urls = [
      buildBaseURL({ resourcePath: 'users/1' }),
      buildBaseURL({ resourcePath: 'users/2' }),
      buildBaseURL({ resourcePath: 'users/3' }),
      buildBaseURL({ resourcePath: 'users/4' }),
      buildBaseURL({ resourcePath: 'users/5' }),
      buildBaseURL({ resourcePath: 'users/6' }),
    ];

    await GET(this, 'users/2', () => ({
      data: [users[1]],
      links: {
        prev: urls[0],
        self: urls[1],
        next: urls[2],
      },
      meta: {
        currentPage: 2,
        totalPages: 6,
      },
    }));

    await GET(this, 'users/1', () => ({
      data: [users[0]],
      links: {
        prev: null,
        self: urls[0],
        next: urls[1],
      },
      meta: {
        currentPage: 1,
        totalPages: 6,
      },
    }));

    await GET(this, 'users/3', () => ({
      data: [users[2]],
      links: {
        prev: urls[1],
        self: urls[2],
        next: urls[3],
      },
      meta: {
        currentPage: 3,
        totalPages: 6,
      },
    }));

    await GET(this, 'users/4', () => ({
      data: [users[3]],
      links: {
        prev: urls[2],
        self: urls[3],
        next: urls[4],
      },
      meta: {
        currentPage: 4,
        totalPages: 6,
      },
    }));

    await GET(this, 'users/5', () => ({
      data: [users[4]],
      links: {
        prev: urls[3],
        self: urls[4],
        next: urls[5],
      },
      meta: {
        currentPage: 5,
        totalPages: 6,
      },
    }));

    await GET(this, 'users/6', () => ({
      data: [users[5]],
      links: {
        prev: urls[4],
        self: urls[5],
        next: urls[6],
      },
      meta: {
        currentPage: 6,
        totalPages: 6,
      },
    }));

    const request = this.manager.request<UserResource[]>({ url: urls[1], method: 'GET' });
    const paginationState = getPaginationState(this.manager, request);

    let counter = 0;
    function countFor(_result: unknown) {
      return ++counter;
    }

    const manager = this.manager;

    await this.render(
      <template>
        <Paginate @request={{request}} @store={{manager}} @mode="paged">
          <:loading>
            <span data-test-pending>Pending<br />Count: {{countFor request}}</span>
          </:loading>
          <:content as |pages features|>
            <Request @request={{pages.activePageRequest}} @store={{manager}}>
              <:idle><span data-test-idle>No page is active</span></:idle>
              <:content as |content|>
                {{#each content as |user|}}
                  <span data-test-user-name>{{user.attributes.name}}<br />Count: {{countFor user}}</span>
                {{/each}}
              </:content>
              <:loading><span data-test-loading-page>Pending<br />Count: {{countFor request}}</span></:loading>
            </Request>

            <EachLink @state={{pages}} @store={{manager}}>
              <:link as |link|>
                <button
                  {{on "click" (fn features.loadPage link.url)}}
                  data-test-load-page={{link.index}}
                  data-test-url={{link.url}}
                >{{link.text}}</button>
              </:link>
              <:placeholder as |link|>
                <button>.</button>
              </:placeholder>
            </EachLink>
          </:content>
          <:error as |error|>{{error.message}}<br />Count: {{countFor error}}</:error>
        </Paginate>
      </template>
    );

    let activePage = null;

    assert.equal(counter, 1);
    assert.equal(this.element.querySelector('[data-test-pending]')?.textContent.trim(), 'PendingCount: 1');
    assert.equal(Array.from(paginationState.pages).length, 0, 'No pages initially');
    assert.equal(Array.from(paginationState.data).length, 0, 'No data initially');
    assert.deepEqual(paginationState.links.length, 0, '0 links initially');

    await request;
    await rerender();

    activePage = paginationState.activePage;

    assert.equal(Array.from(paginationState.pages).length, 3, '3 pages');
    assert.deepEqual(activePage?.data, [users[1]], 'Page data');
    assert.deepEqual(activePage?.pageNumber, 2, 'Page number');
    assert.deepEqual(paginationState.totalPages, 6, 'Total pages');
    assert.deepEqual(paginationState.links.length, 4, '4 links');
    assert.deepEqual(
      paginationState.links.map((link) => (link.isReal ? `${link.index}` : '.')),
      ['1', '2', '3', '.'],
      'Link names'
    );
    assert.equal(counter, 2);
    assert.equal(this.element.querySelector('[data-test-user-name]')?.textContent.trim(), 'Leo EuclidesCount: 2');
    assert.equal(this.element.querySelectorAll('[data-test-user-name]').length, 1, '1 user rendered');

    await click('[data-test-load-page="1"]');
    assert.equal(Array.from(paginationState.pages).length, 3, '3 pages');
    activePage = paginationState.activePage;
    assert.deepEqual(activePage?.data, [users[0]], 'Page data');
    assert.deepEqual(activePage?.pageNumber, 1, 'Page number');
    assert.deepEqual(paginationState.totalPages, 6, 'Total pages');
    assert.deepEqual(paginationState.links.length, 4, '4 links');
    assert.deepEqual(
      paginationState.links.map((link) => (link.isReal ? `${link.index}` : '.')),
      ['1', '2', '3', '.'],
      'Link names'
    );
    assert.equal(counter, 4);
    assert.equal(this.element.querySelector('[data-test-user-name]')?.textContent.trim(), 'Chris ThoburnCount: 4');
    assert.equal(this.element.querySelectorAll('[data-test-user-name]').length, 1, '1 user rendered');

    await click('[data-test-load-page="3"]');
    assert.equal(Array.from(paginationState.pages).length, 4, '4 pages');
    activePage = paginationState.activePage;
    assert.deepEqual(activePage?.data, [users[2]], 'Page data');
    assert.deepEqual(activePage?.pageNumber, 3, 'Page number');
    assert.deepEqual(paginationState.totalPages, 6, 'Total pages');
    assert.deepEqual(paginationState.links.length, 5, '5 links');
    assert.deepEqual(
      paginationState.links.map((link) => (link.isReal ? `${link.index}` : '.')),
      ['1', '2', '3', '4', '.'],
      'Link names'
    );
    assert.equal(counter, 6);
    assert.equal(this.element.querySelector('[data-test-user-name]')?.textContent.trim(), 'Mehul ChaudhariCount: 6');
    assert.equal(this.element.querySelectorAll('[data-test-user-name]').length, 1, '1 user rendered');

    await click('[data-test-load-page="4"]');
    assert.equal(Array.from(paginationState.pages).length, 5, '5 pages');
    activePage = paginationState.activePage;
    assert.deepEqual(activePage?.data, [users[3]], 'Page data');
    assert.deepEqual(activePage?.pageNumber, 4, 'Page number');
    assert.deepEqual(paginationState.totalPages, 6, 'Total pages');
    assert.deepEqual(paginationState.links.length, 6, '6 links');
    assert.deepEqual(
      paginationState.links.map((link) => (link.isReal ? `${link.index}` : '.')),
      ['1', '2', '3', '4', '5', '.'],
      'Link names'
    );
    assert.equal(counter, 8);
    assert.equal(this.element.querySelector('[data-test-user-name]')?.textContent.trim(), 'Benedikt DeickeCount: 8');
    assert.equal(this.element.querySelectorAll('[data-test-user-name]').length, 1, '1 user rendered');

    await click('[data-test-load-page="5"]');
    assert.equal(Array.from(paginationState.pages).length, 6, '6 pages');
    activePage = paginationState.activePage;
    assert.deepEqual(activePage?.data, [users[4]], 'Page data');
    assert.deepEqual(activePage?.pageNumber, 5, 'Page number');
    assert.deepEqual(paginationState.totalPages, 6, 'Total pages');
    assert.deepEqual(paginationState.links.length, 6, '6 links');
    assert.deepEqual(
      paginationState.links.map((link) => (link.isReal ? `${link.index}` : '.')),
      ['1', '2', '3', '4', '5', '6'],
      'Link names'
    );
    assert.equal(counter, 10);
    assert.equal(this.element.querySelector('[data-test-user-name]')?.textContent.trim(), 'Jane PortmanCount: 10');
    assert.equal(this.element.querySelectorAll('[data-test-user-name]').length, 1, '1 user rendered');

    await click('[data-test-load-page="6"]');
    assert.equal(Array.from(paginationState.pages).length, 6, '6 pages');
    activePage = paginationState.activePage;
    assert.deepEqual(activePage?.data, [users[5]], 'Page data');
    assert.deepEqual(activePage?.pageNumber, 6, 'Page number');
    assert.deepEqual(paginationState.totalPages, 6, 'Total pages');
    assert.deepEqual(paginationState.links.length, 6, '6 links');
    assert.deepEqual(
      paginationState.links.map((link) => (link.isReal ? `${link.index}` : '.')),
      ['1', '2', '3', '4', '5', '6'],
      'Link names'
    );
    assert.equal(counter, 12);
    assert.equal(this.element.querySelector('[data-test-user-name]')?.textContent.trim(), 'Mia SinekCount: 12');
    assert.equal(this.element.querySelectorAll('[data-test-user-name]').length, 1, '1 user rendered');
  });

  test('multiple paginate components have individual rendering states while sharing cached pages', async function (assert) {
    const urls = [
      buildBaseURL({ resourcePath: 'users/1' }),
      buildBaseURL({ resourcePath: 'users/2' }),
      buildBaseURL({ resourcePath: 'users/3' }),
      buildBaseURL({ resourcePath: 'users/4' }),
      buildBaseURL({ resourcePath: 'users/5' }),
      buildBaseURL({ resourcePath: 'users/6' }),
    ];

    await GET(this, 'users/2', () => ({
      data: [users[1]],
      links: {
        first: urls[0],
        prev: urls[0],
        self: urls[1],
        next: urls[2],
        last: urls[5],
      },
      meta: {
        currentPage: 2,
        totalPages: 6,
      },
    }));

    await GET(this, 'users/5', () => ({
      data: [users[4]],
      links: {
        first: urls[0],
        prev: urls[3],
        self: urls[4],
        next: urls[5],
        last: urls[5],
      },
      meta: {
        currentPage: 5,
        totalPages: 6,
      },
    }));

    await GET(this, 'users/1', () => ({
      data: [users[0]],
      links: {
        first: urls[0],
        prev: null,
        self: urls[0],
        next: urls[1],
        last: urls[5],
      },
      meta: {
        currentPage: 1,
        totalPages: 6,
      },
    }));

    await GET(this, 'users/6', () => ({
      data: [users[5]],
      links: {
        first: urls[0],
        prev: urls[4],
        self: urls[5],
        next: urls[6],
        last: urls[5],
      },
      meta: {
        currentPage: 6,
        totalPages: 6,
      },
    }));

    await GET(this, 'users/4', () => ({
      data: [users[3]],
      links: {
        first: urls[0],
        prev: urls[2],
        self: urls[3],
        next: urls[4],
        last: urls[5],
      },
      meta: {
        currentPage: 4,
        totalPages: 6,
      },
    }));

    await GET(this, 'users/3', () => ({
      data: [users[2]],
      links: {
        first: urls[0],
        prev: urls[1],
        self: urls[2],
        next: urls[3],
        last: urls[5],
      },
      meta: {
        currentPage: 3,
        totalPages: 6,
      },
    }));

    const requestA = this.manager.request<UserResource[]>({ url: urls[1], method: 'GET' });
    const requestB = this.manager.request<UserResource[]>({ url: urls[4], method: 'GET' });
    // Each request gets its own PaginationState (individual active page /
    // rendering state) while both share the underlying pagination cache.
    const paginationStateA = getPaginationState(this.manager, requestA);
    const paginationStateB = getPaginationState(this.manager, requestB);

    let counter = 0;
    function countFor(_result: unknown) {
      return ++counter;
    }

    const manager = this.manager;

    await this.render(
      <template>
        <div data-test-paginate="a">
          <Paginate @request={{requestA}} @store={{manager}} @mode="paged">
            <:loading>
              <span data-test-pending>Pending<br />Count: {{countFor requestA}}</span>
            </:loading>
            <:content as |pages features|>
              <Request @request={{pages.activePageRequest}} @store={{manager}}>
                <:idle><span data-test-idle>No page is active</span></:idle>
                <:content as |content|>
                  <div data-test-pagination="a">
                    {{#each content as |user|}}
                      <span data-test-user-name>{{user.attributes.name}}<br />Count: {{countFor user}}</span>
                    {{/each}}
                  </div>
                </:content>
                <:loading><span data-test-loading-page>Pending<br />Count: {{countFor requestA}}</span></:loading>
              </Request>

              <EachLink @state={{pages}} @store={{manager}}>
                <:link as |link|>
                  <button
                    {{on "click" (fn features.loadPage link.url)}}
                    data-test-load-page={{link.index}}
                    data-test-url={{link.url}}
                  >{{link.text}}</button>
                </:link>
                <:placeholder as |link|>
                  <button>.</button>
                </:placeholder>
              </EachLink>
            </:content>
            <:error as |error|>{{error.message}}<br />Count: {{countFor error}}</:error>
          </Paginate>
        </div>

        <div data-test-paginate="b">
          <Paginate @request={{requestB}} @store={{manager}} @mode="paged">
            <:loading>
              <span data-test-pending>Pending<br />Count: {{countFor requestB}}</span>
            </:loading>
            <:content as |pages features|>
              <Request @request={{pages.activePageRequest}} @store={{manager}}>
                <:idle><span data-test-idle>No page is active</span></:idle>
                <:content as |content|>
                  <div data-test-pagination="b">
                    {{#each content as |user|}}
                      <span data-test-user-name>{{user.attributes.name}}<br />Count: {{countFor user}}</span>
                    {{/each}}
                  </div>
                </:content>
                <:loading><span data-test-loading-page>Pending<br />Count: {{countFor requestB}}</span></:loading>
              </Request>

              <EachLink @state={{pages}} @store={{manager}}>
                <:link as |link|>
                  <button
                    {{on "click" (fn features.loadPage link.url)}}
                    data-test-load-page={{link.index}}
                    data-test-url={{link.url}}
                  >{{link.text}}</button>
                </:link>
                <:placeholder as |link|>
                  <button>.</button>
                </:placeholder>
              </EachLink>
            </:content>
            <:error as |error|>{{error.message}}<br />Count: {{countFor error}}</:error>
          </Paginate>
        </div>
      </template>
    );

    let activePageA = null;
    let activePageB = null;

    assert.equal(counter, 2);
    assert.equal(this.element.querySelector('[data-test-pending]')?.textContent.trim(), 'PendingCount: 1');
    assert.equal(Array.from(paginationStateA.pages).length, 0, 'No pages initially');
    assert.equal(Array.from(paginationStateA.data).length, 0, 'No data initially');
    assert.deepEqual(paginationStateA.links.length, 0, '0 links initially');

    await requestA;
    await requestB;
    await rerender();

    activePageA = paginationStateA.activePage;
    activePageB = paginationStateB.activePage;

    assert.equal(Array.from(paginationStateA.pages).length, 6, '6 pages');
    assert.deepEqual(activePageA?.data, [users[1]], 'Page data');
    assert.deepEqual(activePageA?.pageNumber, 2, 'Page number');
    assert.deepEqual(activePageB?.data, [users[4]], 'Page data');
    assert.deepEqual(activePageB?.pageNumber, 5, 'Page number');
    assert.deepEqual(paginationStateA.totalPages, 6, 'Total pages');
    assert.deepEqual(paginationStateA.links.length, 6, '6 links');
    assert.deepEqual(
      paginationStateA.links.map((link) => (link.isReal ? `${link.index}` : '.')),
      ['1', '2', '3', '4', '5', '6'],
      'Link names'
    );
    assert.equal(counter, 4);
    assert.equal(
      this.element.querySelector('[data-test-pagination="a"] [data-test-user-name]')?.textContent.trim(),
      'Leo EuclidesCount: 3'
    );
    assert.equal(
      this.element.querySelectorAll('[data-test-pagination="a"] [data-test-user-name]').length,
      1,
      '1 user rendered'
    );
    assert.equal(
      this.element.querySelector('[data-test-pagination="b"] [data-test-user-name]')?.textContent.trim(),
      'Jane PortmanCount: 4'
    );
    assert.equal(
      this.element.querySelectorAll('[data-test-pagination="b"] [data-test-user-name]').length,
      1,
      '1 user rendered'
    );

    await click('[data-test-paginate="a"] [data-test-load-page="1"]');
    activePageA = paginationStateA.activePage;
    assert.deepEqual(activePageA?.data, [users[0]], 'Page data');
    assert.deepEqual(activePageA?.pageNumber, 1, 'Page number');
    assert.equal(Array.from(paginationStateA.pages).length, 6, '6 pages');
    assert.deepEqual(paginationStateA.links.length, 6, '6 links');
    assert.equal(counter, 6);
    assert.equal(
      this.element.querySelector('[data-test-pagination="a"] [data-test-user-name]')?.textContent.trim(),
      'Chris ThoburnCount: 6'
    );
    assert.equal(
      this.element.querySelector('[data-test-pagination="b"] [data-test-user-name]')?.textContent.trim(),
      'Jane PortmanCount: 4',
      'Component B did not re-render'
    );

    await click('[data-test-paginate="b"] [data-test-load-page="6"]');
    activePageB = paginationStateB.activePage;
    assert.deepEqual(activePageB?.data, [users[5]], 'Page data');
    assert.deepEqual(activePageB?.pageNumber, 6, 'Page number');
    assert.equal(Array.from(paginationStateA.pages).length, 6, '6 pages');
    assert.deepEqual(paginationStateA.links.length, 6, '6 links');
    assert.equal(counter, 8);
    assert.equal(
      this.element.querySelector('[data-test-pagination="a"] [data-test-user-name]')?.textContent.trim(),
      'Chris ThoburnCount: 6',
      'Component A did not re-render'
    );
    assert.equal(
      this.element.querySelector('[data-test-pagination="b"] [data-test-user-name]')?.textContent.trim(),
      'Mia SinekCount: 8'
    );

    await click('[data-test-paginate="a"] [data-test-load-page="4"]');
    activePageA = paginationStateA.activePage;
    assert.deepEqual(activePageA?.data, [users[3]], 'Page data');
    assert.deepEqual(activePageA?.pageNumber, 4, 'Page number');
    assert.equal(Array.from(paginationStateA.pages).length, 6, '6 pages');
    assert.deepEqual(paginationStateA.links.length, 6, '6 links');
    assert.equal(counter, 10);
    assert.equal(
      this.element.querySelector('[data-test-pagination="a"] [data-test-user-name]')?.textContent.trim(),
      'Benedikt DeickeCount: 10'
    );
    assert.equal(
      this.element.querySelector('[data-test-pagination="b"] [data-test-user-name]')?.textContent.trim(),
      'Mia SinekCount: 8',
      'Component B did not re-render'
    );

    await click('[data-test-paginate="b"] [data-test-load-page="3"]');
    activePageB = paginationStateB.activePage;
    assert.deepEqual(activePageB?.data, [users[2]], 'Page data');
    assert.deepEqual(activePageB?.pageNumber, 3, 'Page number');
    assert.equal(Array.from(paginationStateA.pages).length, 6, '6 pages');
    assert.deepEqual(paginationStateA.links.length, 6, '6 links');
    assert.equal(counter, 12);
    assert.equal(
      this.element.querySelector('[data-test-pagination="a"] [data-test-user-name]')?.textContent.trim(),
      'Benedikt DeickeCount: 10',
      'Component A did not re-render'
    );
    assert.equal(
      this.element.querySelector('[data-test-pagination="b"] [data-test-user-name]')?.textContent.trim(),
      'Mehul ChaudhariCount: 12'
    );
  });
});
