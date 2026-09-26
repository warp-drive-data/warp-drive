import { fn } from '@ember/helper';
import { on } from '@ember/modifier';

import type { RequestManager } from '@warp-drive/core';
import { useEmber } from '@warp-drive/diagnostic/ember';
import { Request } from '@warp-drive/ember';
import { EachLink, Paginate } from '@warp-drive/ember/experiments';
import { type CollectionRequest, PaginateSpec } from '@warp-drive-internal/specs/paginate-component.spec';

type ReloadProps = { store: RequestManager; request: CollectionRequest };
type SourceReloadProps = { store: RequestManager; source: { request: CollectionRequest } };
type SharedReloadProps = { store: RequestManager; requestA: CollectionRequest; requestB: CollectionRequest };
type SecondPaginationProps = {
  store: RequestManager;
  requestA: CollectionRequest;
  source: { requestB: CollectionRequest | null };
};

// the templates the reload scenarios render: the active page's items plus the
// full link set (numbered links with gaps, prev/next/last) for the paged
// surface, and the accumulated items plus sentinels for the infinite one

function pagedReloadTemplate({ request, store }: ReloadProps) {
  return <template>
    <Paginate @request={{request}} @store={{store}}>
      <:loading>
        <span data-test-pending>Pending</span>
      </:loading>
      <:content as |pages features|>
        {{#if features.isNavigating}}
          <span data-test-navigating>Navigating</span>
        {{/if}}
        <Request @request={{pages.activePageRequest}} @store={{store}}>
          <:content as |content|>
            {{#each content.data as |user|}}
              <span data-test-user-name>{{user.attributes.name}}</span>
            {{/each}}
          </:content>
          <:loading><span data-test-loading-page>Loading page</span></:loading>
        </Request>

        <EachLink @pages={{pages}} as |state|>
          {{#if state.prev}}
            <button {{on "click" state.prev.setActive}} data-test-prev>{{state.prev.text}}</button>
          {{/if}}
          {{#each state.links as |link|}}
            {{#if link.isReal}}
              <button
                {{on "click" (fn features.loadPage link.url)}}
                data-test-load-page={{link.index}}
              >{{link.text}}</button>
            {{else}}
              <button data-test-gap>.</button>
            {{/if}}
          {{/each}}
          {{#if state.next}}
            <button {{on "click" state.next.setActive}} data-test-next>{{state.next.text}}</button>
          {{/if}}
          {{#if state.last}}
            <button {{on "click" state.last.setActive}} data-test-last>{{state.last.text}}</button>
          {{/if}}
        </EachLink>
      </:content>
      <:error as |error|>
        <span data-test-error>{{error.message}}</span>
      </:error>
    </Paginate>
  </template>;
}

function sourceReloadTemplate({ source, store }: SourceReloadProps) {
  return <template>
    <Paginate @request={{source.request}} @store={{store}}>
      <:loading>
        <span data-test-pending>Pending</span>
      </:loading>
      <:content as |pages features|>
        {{#if features.isNavigating}}
          <span data-test-navigating>Navigating</span>
        {{/if}}
        <Request @request={{pages.activePageRequest}} @store={{store}}>
          <:content as |content|>
            {{#each content.data as |user|}}
              <span data-test-user-name>{{user.attributes.name}}</span>
            {{/each}}
          </:content>
          <:loading><span data-test-loading-page>Loading page</span></:loading>
        </Request>

        <EachLink @pages={{pages}} as |state|>
          {{#each state.links as |link|}}
            {{#if link.isReal}}
              <button
                {{on "click" (fn features.loadPage link.url)}}
                data-test-load-page={{link.index}}
              >{{link.text}}</button>
            {{else}}
              <button data-test-gap>.</button>
            {{/if}}
          {{/each}}
        </EachLink>
      </:content>
      <:error as |error|>
        <span data-test-error>{{error.message}}</span>
      </:error>
    </Paginate>
  </template>;
}

function infiniteReloadTemplate({ request, store }: ReloadProps) {
  return <template>
    <Paginate @request={{request}} @store={{store}} @mode="infinite">
      <:loading>
        <span data-test-pending>Pending</span>
      </:loading>
      <:content as |pages features|>
        {{#if pages.hasPrevious}}
          <Request @request={{pages.previousRequest}} @store={{store}}>
            <:idle>
              <button data-test-load-prev {{on "click" features.loadPrev}}>Load previous</button>
            </:idle>
            <:loading><span data-test-loading-prev>Loading previous</span></:loading>
          </Request>
        {{/if}}

        {{#each pages.data as |user|}}
          <span data-test-user-name>{{user.attributes.name}}</span>
        {{/each}}

        {{#if pages.hasNext}}
          <Request @request={{pages.nextRequest}} @store={{store}}>
            <:idle>
              <button data-test-load-next {{on "click" features.loadNext}}>Load next</button>
            </:idle>
            <:loading><span data-test-loading-next>Loading next</span></:loading>
          </Request>
        {{/if}}
      </:content>
      <:error as |error|>
        <span data-test-error>{{error.message}}</span>
      </:error>
    </Paginate>
  </template>;
}

function sharedReloadTemplate({ requestA, requestB, store }: SharedReloadProps) {
  return <template>
    <div data-test-paginate="a">
      <Paginate @request={{requestA}} @store={{store}}>
        <:loading>
          <span data-test-pending>Pending</span>
        </:loading>
        <:content as |pages features|>
          <Request @request={{pages.activePageRequest}} @store={{store}}>
            <:content as |content|>
              {{#each content.data as |user|}}
                <span data-test-user-name>{{user.attributes.name}}</span>
              {{/each}}
            </:content>
            <:loading><span data-test-loading-page>Loading page</span></:loading>
          </Request>

          <EachLink @pages={{pages}} as |state|>
            {{#each state.links as |link|}}
              {{#if link.isReal}}
                <button
                  {{on "click" (fn features.loadPage link.url)}}
                  data-test-load-page={{link.index}}
                >{{link.text}}</button>
              {{else}}
                <button data-test-gap>.</button>
              {{/if}}
            {{/each}}
            {{#if state.next}}
              <button {{on "click" state.next.setActive}} data-test-next>{{state.next.text}}</button>
            {{/if}}
          </EachLink>
        </:content>
        <:error as |error|>
          <span data-test-error>{{error.message}}</span>
        </:error>
      </Paginate>
    </div>

    <div data-test-paginate="b">
      <Paginate @request={{requestB}} @store={{store}}>
        <:loading>
          <span data-test-pending>Pending</span>
        </:loading>
        <:content as |pages features|>
          <Request @request={{pages.activePageRequest}} @store={{store}}>
            <:content as |content|>
              {{#each content.data as |user|}}
                <span data-test-user-name>{{user.attributes.name}}</span>
              {{/each}}
            </:content>
            <:loading><span data-test-loading-page>Loading page</span></:loading>
          </Request>

          <EachLink @pages={{pages}} as |state|>
            {{#each state.links as |link|}}
              {{#if link.isReal}}
                <button
                  {{on "click" (fn features.loadPage link.url)}}
                  data-test-load-page={{link.index}}
                >{{link.text}}</button>
              {{else}}
                <button data-test-gap>.</button>
              {{/if}}
            {{/each}}
            {{#if state.next}}
              <button {{on "click" state.next.setActive}} data-test-next>{{state.next.text}}</button>
            {{/if}}
          </EachLink>
        </:content>
        <:error as |error|>
          <span data-test-error>{{error.message}}</span>
        </:error>
      </Paginate>
    </div>
  </template>;
}

function secondPaginationTemplate({ requestA, source, store }: SecondPaginationProps) {
  return <template>
    <div data-test-paginate="a">
      <Paginate @request={{requestA}} @store={{store}}>
        <:loading>
          <span data-test-pending>Pending</span>
        </:loading>
        <:content as |pages|>
          <Request @request={{pages.activePageRequest}} @store={{store}}>
            <:content as |content|>
              {{#each content.data as |user|}}
                <span data-test-user-name>{{user.attributes.name}}</span>
              {{/each}}
            </:content>
            <:loading><span data-test-loading-page>Loading page</span></:loading>
          </Request>
        </:content>
        <:error as |error|>
          <span data-test-error>{{error.message}}</span>
        </:error>
      </Paginate>
    </div>

    {{#if source.requestB}}
      <div data-test-paginate="b">
        <Paginate @request={{source.requestB}} @store={{store}}>
          <:loading>
            <span data-test-pending>Pending</span>
          </:loading>
          <:content as |pages|>
            <Request @request={{pages.activePageRequest}} @store={{store}}>
              <:content as |content|>
                {{#each content.data as |user|}}
                  <span data-test-user-name>{{user.attributes.name}}</span>
                {{/each}}
              </:content>
              <:loading><span data-test-loading-page>Loading page</span></:loading>
            </Request>
          </:content>
          <:error as |error|>
            <span data-test-error>{{error.message}}</span>
          </:error>
        </Paginate>
      </div>
    {{/if}}
  </template>;
}

PaginateSpec.use(useEmber(), function (b) {
  b
    /* this comment just to make prettier behave */

    .test('it handles paged pagination with complete data', function (props) {
      const { request, store, countFor } = props;

      return <template>
        <Paginate @request={{request}} @store={{store}}>
          <:loading>
            <span data-test-pending>Pending<br />Count: {{countFor request}}</span>
          </:loading>
          <:content as |pages features|>
            <Request @request={{pages.activePageRequest}} @store={{store}}>
              <:idle><span data-test-idle>No page is active</span></:idle>
              <:content as |content|>
                {{#each content.data as |user|}}
                  <span data-test-user-name>{{user.attributes.name}}<br />Count: {{countFor user}}</span>
                {{/each}}
              </:content>
              <:loading><span data-test-loading-page>Pending<br />Count: {{countFor request}}</span></:loading>
            </Request>

            <EachLink @pages={{pages}} as |state|>
              {{#if state.first}}
                <button
                  {{on "click" state.first.setActive}}
                  disabled={{state.first.isCurrent}}
                  data-test-first
                >{{state.first.text}}</button>
              {{/if}}
              {{#if state.prev}}
                <button {{on "click" state.prev.setActive}} data-test-prev>{{state.prev.text}}</button>
              {{/if}}
              {{#each state.links as |link|}}
                {{#if link.isReal}}
                  <button
                    {{on "click" (fn features.loadPage link.url)}}
                    data-test-load-page={{link.index}}
                    data-test-url={{link.url}}
                  >{{link.text}}</button>
                {{else}}
                  <button>.</button>
                {{/if}}
              {{/each}}
              {{#if state.next}}
                <button {{on "click" state.next.setActive}} data-test-next>{{state.next.text}}</button>
              {{/if}}
              {{#if state.last}}
                <button
                  {{on "click" state.last.setActive}}
                  disabled={{state.last.isCurrent}}
                  data-test-last
                >{{state.last.text}}</button>
              {{/if}}
            </EachLink>
          </:content>
          <:error as |error|>{{error.message}}<br />Count: {{countFor error}}</:error>
        </Paginate>
      </template>;
    })

    .test('it handles paged pagination with incomplete data', function (props) {
      const { request, store, countFor } = props;

      return <template>
        <Paginate @request={{request}} @store={{store}}>
          <:loading>
            <span data-test-pending>Pending<br />Count: {{countFor request}}</span>
          </:loading>
          <:content as |pages features|>
            <Request @request={{pages.activePageRequest}} @store={{store}}>
              <:idle><span data-test-idle>No page is active</span></:idle>
              <:content as |content|>
                {{#each content.data as |user|}}
                  <span data-test-user-name>{{user.attributes.name}}<br />Count: {{countFor user}}</span>
                {{/each}}
              </:content>
              <:loading><span data-test-loading-page>Pending<br />Count: {{countFor request}}</span></:loading>
            </Request>

            <EachLink @pages={{pages}} as |state|>
              {{#each state.links as |link|}}
                {{#if link.isReal}}
                  <button
                    {{on "click" (fn features.loadPage link.url)}}
                    data-test-load-page={{link.index}}
                    data-test-url={{link.url}}
                  >{{link.text}}</button>
                {{else}}
                  <button>.</button>
                {{/if}}
              {{/each}}
            </EachLink>
          </:content>
          <:error as |error|>{{error.message}}<br />Count: {{countFor error}}</:error>
        </Paginate>
      </template>;
    })

    .test('multiple paginate components have individual rendering states while sharing cached pages', function (props) {
      const { requestA, requestB, store, countForA, countForB } = props;

      return <template>
        <div data-test-paginate="a">
          <Paginate @request={{requestA}} @store={{store}}>
            <:loading>
              <span data-test-pending>Pending<br />Count: {{countForA requestA}}</span>
            </:loading>
            <:content as |pages features|>
              <Request @request={{pages.activePageRequest}} @store={{store}}>
                <:idle><span data-test-idle>No page is active</span></:idle>
                <:content as |content|>
                  <div data-test-pagination="a">
                    {{#each content.data as |user|}}
                      <span data-test-user-name>{{user.attributes.name}}<br />Count: {{countForA user}}</span>
                    {{/each}}
                  </div>
                </:content>
                <:loading><span data-test-loading-page>Pending<br />Count: {{countForA requestA}}</span></:loading>
              </Request>

              <EachLink @pages={{pages}} as |state|>
                {{#each state.links as |link|}}
                  {{#if link.isReal}}
                    <button
                      {{on "click" (fn features.loadPage link.url)}}
                      data-test-load-page={{link.index}}
                      data-test-url={{link.url}}
                    >{{link.text}}</button>
                  {{else}}
                    <button>.</button>
                  {{/if}}
                {{/each}}
              </EachLink>
            </:content>
            <:error as |error|>{{error.message}}<br />Count: {{countForA error}}</:error>
          </Paginate>
        </div>

        <div data-test-paginate="b">
          <Paginate @request={{requestB}} @store={{store}}>
            <:loading>
              <span data-test-pending>Pending<br />Count: {{countForB requestB}}</span>
            </:loading>
            <:content as |pages features|>
              <Request @request={{pages.activePageRequest}} @store={{store}}>
                <:idle><span data-test-idle>No page is active</span></:idle>
                <:content as |content|>
                  <div data-test-pagination="b">
                    {{#each content.data as |user|}}
                      <span data-test-user-name>{{user.attributes.name}}<br />Count: {{countForB user}}</span>
                    {{/each}}
                  </div>
                </:content>
                <:loading><span data-test-loading-page>Pending<br />Count: {{countForB requestB}}</span></:loading>
              </Request>

              <EachLink @pages={{pages}} as |state|>
                {{#each state.links as |link|}}
                  {{#if link.isReal}}
                    <button
                      {{on "click" (fn features.loadPage link.url)}}
                      data-test-load-page={{link.index}}
                      data-test-url={{link.url}}
                    >{{link.text}}</button>
                  {{else}}
                    <button>.</button>
                  {{/if}}
                {{/each}}
              </EachLink>
            </:content>
            <:error as |error|>{{error.message}}<br />Count: {{countForB error}}</:error>
          </Paginate>
        </div>
      </template>;
    })

    .test('it derives pageNumber and totalPages from a custom pageHints fn', function (props) {
      const { request, store, pageHints } = props;

      return <template>
        <Paginate @request={{request}} @store={{store}} @pageHints={{pageHints}}>
          <:loading>
            <span data-test-pending>Pending</span>
          </:loading>
          <:content as |pages features|>
            <Request @request={{pages.activePageRequest}} @store={{store}}>
              <:idle><span data-test-idle>No page is active</span></:idle>
              <:content as |content|>
                {{#each content.data as |user|}}
                  <span data-test-user-name>{{user.attributes.name}}</span>
                {{/each}}
              </:content>
              <:loading><span data-test-loading-page>Pending</span></:loading>
            </Request>

            <EachLink @pages={{pages}} as |state|>
              {{#each state.links as |link|}}
                {{#if link.isReal}}
                  <button {{on "click" link.setActive}} data-test-load-page={{link.index}}>{{link.text}}</button>
                {{else}}
                  <button>.</button>
                {{/if}}
              {{/each}}
            </EachLink>
          </:content>
          <:error as |error|>{{error.message}}</:error>
        </Paginate>
      </template>;
    })

    .test('it renders the full link set when entering on a middle page', function (props) {
      const { request, store } = props;

      return <template>
        <Paginate @request={{request}} @store={{store}}>
          <:loading>
            <span data-test-pending>Pending</span>
          </:loading>
          <:content as |pages features|>
            <Request @request={{pages.activePageRequest}} @store={{store}}>
              <:idle><span data-test-idle>No page is active</span></:idle>
              <:content as |content|>
                {{#each content.data as |user|}}
                  <span data-test-user-name>{{user.attributes.name}}</span>
                {{/each}}
              </:content>
              <:loading><span data-test-loading-page>Pending</span></:loading>
            </Request>

            <EachLink @pages={{pages}} as |state|>
              {{#each state.links as |link|}}
                {{#if link.isReal}}
                  <button {{on "click" link.setActive}} data-test-load-page={{link.index}}>{{link.text}}</button>
                {{else}}
                  <button>.</button>
                {{/if}}
              {{/each}}
            </EachLink>
          </:content>
          <:error as |error|>{{error.message}}</:error>
        </Paginate>
      </template>;
    })

    .test('it supports cursor-based pagination in paged mode (no page numbers or total)', function (props) {
      const { request, store } = props;

      return <template>
        <Paginate @request={{request}} @store={{store}}>
          <:loading>
            <span data-test-pending>Pending</span>
          </:loading>
          <:content as |pages features|>
            <Request @request={{pages.activePageRequest}} @store={{store}}>
              <:idle><span data-test-idle>No page is active</span></:idle>
              <:content as |content|>
                {{#each content.data as |user|}}
                  <span data-test-user-name>{{user.attributes.name}}</span>
                {{/each}}
              </:content>
              <:loading><span data-test-loading-page>Pending</span></:loading>
            </Request>

            <EachLink @pages={{pages}} as |state|>
              {{#if state.prev}}
                <button data-test-prev {{on "click" (fn features.loadPage state.prev.url)}}>{{state.prev.text}}</button>
              {{/if}}
              {{#each state.links as |link|}}
                {{#if link.isReal}}
                  <button data-test-load-page={{link.index}}>{{link.text}}</button>
                {{/if}}
              {{/each}}
              {{#if state.next}}
                <button data-test-next {{on "click" (fn features.loadPage state.next.url)}}>{{state.next.text}}</button>
              {{/if}}
            </EachLink>
          </:content>
          <:error as |error|>{{error.message}}</:error>
        </Paginate>
      </template>;
    })

    .test('it supports infinite pagination that accumulates loaded pages into a single set', function (props) {
      const { request, store } = props;

      return <template>
        <Paginate @request={{request}} @store={{store}} @mode="infinite">
          <:loading>
            <span data-test-pending>Pending</span>
          </:loading>
          <:content as |pages features|>
            {{#if pages.hasPrevious}}
              <Request @request={{pages.previousRequest}} @store={{store}}>
                <:idle>
                  <button data-test-load-prev {{on "click" features.loadPrev}}>Load previous</button>
                </:idle>
                <:loading><span data-test-loading-prev>Loading previous</span></:loading>
              </Request>
            {{/if}}

            {{#each pages.data as |user|}}
              <span data-test-user-name>{{user.attributes.name}}</span>
            {{/each}}

            {{#if pages.hasNext}}
              <Request @request={{pages.nextRequest}} @store={{store}}>
                <:idle>
                  <button data-test-load-next {{on "click" features.loadNext}}>Load next</button>
                </:idle>
                <:loading><span data-test-loading-next>Loading next</span></:loading>
              </Request>
            {{/if}}
          </:content>
          <:error as |error|>{{error.message}}</:error>
        </Paginate>
      </template>;
    })

    .test('infinite pagination extends backwards from a deep-linked entry page', function (props) {
      const { request, store } = props;

      return <template>
        <Paginate @request={{request}} @store={{store}} @mode="infinite">
          <:loading>
            <span data-test-pending>Pending</span>
          </:loading>
          <:content as |pages features|>
            {{#if pages.hasPrevious}}
              <Request @request={{pages.previousRequest}} @store={{store}}>
                <:idle>
                  <button data-test-load-prev {{on "click" features.loadPrev}}>Load previous</button>
                </:idle>
                <:loading><span data-test-loading-prev>Loading previous</span></:loading>
              </Request>
            {{/if}}

            {{#each pages.data as |user|}}
              <span data-test-user-name>{{user.attributes.name}}</span>
            {{/each}}

            {{#if pages.hasNext}}
              <Request @request={{pages.nextRequest}} @store={{store}}>
                <:idle>
                  <button data-test-load-next {{on "click" features.loadNext}}>Load next</button>
                </:idle>
                <:loading><span data-test-loading-next>Loading next</span></:loading>
              </Request>
            {{/if}}
          </:content>
          <:error as |error|>{{error.message}}</:error>
        </Paginate>
      </template>;
    })

    .test('it renders the default block as a fallback with pagination state and features', function (props) {
      const { request, store } = props;

      return <template>
        <Paginate @request={{request}} @store={{store}} @mode="infinite" as |pages features|>
          {{#each pages.data as |user|}}
            <span data-test-user-name>{{user.attributes.name}}</span>
          {{/each}}

          <button data-test-load-next {{on "click" features.loadNext}}>Load next</button>
        </Paginate>
      </template>;
    })

    .test('it transitions to error state correctly', function (props) {
      const { request, store, countFor } = props;

      return <template>
        <Paginate @request={{request}} @store={{store}}>
          <:loading>
            <span data-test-pending>Pending<br />Count: {{countFor request}}</span>
          </:loading>
          <:content as |pages features|>
            <Request @request={{pages.activePageRequest}} @store={{store}}>
              <:content as |content|>
                {{#each content.data as |user|}}
                  <span data-test-user-name>{{user.attributes.name}}<br />Count: {{countFor user}}</span>
                {{/each}}
              </:content>
              <:loading><span data-test-loading-page>Pending</span></:loading>
            </Request>
          </:content>
          <:error as |error|>
            <span data-test-error>{{error.message}}<br />Count: {{countFor error}}</span>
          </:error>
        </Paginate>
      </template>;
    })

    .test('we can retry from error state', function (props) {
      const { request, store, countFor, retry } = props;

      return <template>
        <Paginate @request={{request}} @store={{store}}>
          <:loading>
            <span data-test-pending>Pending<br />Count: {{countFor request}}</span>
          </:loading>
          <:content as |pages features|>
            <Request @request={{pages.activePageRequest}} @store={{store}}>
              <:content as |content|>
                {{#each content.data as |user|}}
                  <span data-test-user-name>{{user.attributes.name}}<br />Count: {{countFor user}}</span>
                {{/each}}
              </:content>
              <:loading><span data-test-loading-page>Pending</span></:loading>
            </Request>

            <span data-test-total-pages>{{pages.totalPages}}</span>

            <EachLink @pages={{pages}} as |state|>
              {{#each state.links as |link|}}
                {{#if link.isReal}}
                  <button {{on "click" link.setActive}} data-test-load-page={{link.index}}>{{link.text}}</button>
                {{else}}
                  <button>.</button>
                {{/if}}
              {{/each}}
            </EachLink>
          </:content>
          <:error as |error errorFeatures|>
            <span data-test-error>{{error.message}}<br />Count: {{countFor error}}</span>
            <button data-test-id="retry-button" {{on "click" (fn retry errorFeatures)}}>Retry</button>
          </:error>
        </Paginate>
      </template>;
    })

    .test('it rethrows if error block is not present', function (props) {
      const { request, store, countFor } = props;

      return <template>
        <Paginate @request={{request}} @store={{store}}>
          <:loading>
            <span data-test-pending>Pending<br />Count: {{countFor request}}</span>
          </:loading>
          <:content as |pages features|>
            <Request @request={{pages.activePageRequest}} @store={{store}}>
              <:content as |content|>
                {{#each content.data as |user|}}
                  <span data-test-user-name>{{user.attributes.name}}<br />Count: {{countFor user}}</span>
                {{/each}}
              </:content>
              <:loading><span data-test-loading-page>Pending</span></:loading>
            </Request>
          </:content>
        </Paginate>
      </template>;
    })

    .test('it transitions to cancelled state correctly', function (props) {
      const { request, store, countFor } = props;

      return <template>
        <Paginate @request={{request}} @store={{store}}>
          <:loading>
            <span data-test-pending>Pending<br />Count: {{countFor request}}</span>
          </:loading>
          <:content as |pages features|>
            <Request @request={{pages.activePageRequest}} @store={{store}}>
              <:content as |content|>
                {{#each content.data as |user|}}
                  <span data-test-user-name>{{user.attributes.name}}<br />Count: {{countFor user}}</span>
                {{/each}}
              </:content>
              <:loading><span data-test-loading-page>Pending</span></:loading>
            </Request>
          </:content>
          <:cancelled as |error|>
            <span data-test-cancelled>Cancelled {{error.message}}<br />Count: {{countFor error}}</span>
          </:cancelled>
          <:error as |error|>
            <span data-test-error>{{error.message}}<br />Count: {{countFor error}}</span>
          </:error>
        </Paginate>
      </template>;
    })

    .test('we can retry from cancelled state', function (props) {
      const { request, store, countFor, retry } = props;

      return <template>
        <Paginate @request={{request}} @store={{store}}>
          <:loading>
            <span data-test-pending>Pending<br />Count: {{countFor request}}</span>
          </:loading>
          <:content as |pages features|>
            <Request @request={{pages.activePageRequest}} @store={{store}}>
              <:content as |content|>
                {{#each content.data as |user|}}
                  <span data-test-user-name>{{user.attributes.name}}<br />Count: {{countFor user}}</span>
                {{/each}}
              </:content>
              <:loading><span data-test-loading-page>Pending</span></:loading>
            </Request>

            <span data-test-total-pages>{{pages.totalPages}}</span>

            <EachLink @pages={{pages}} as |state|>
              {{#each state.links as |link|}}
                {{#if link.isReal}}
                  <button {{on "click" link.setActive}} data-test-load-page={{link.index}}>{{link.text}}</button>
                {{else}}
                  <button>.</button>
                {{/if}}
              {{/each}}
            </EachLink>
          </:content>
          <:cancelled as |error errorFeatures|>
            <span data-test-cancelled>Cancelled {{error.message}}<br />Count: {{countFor error}}</span>
            <button data-test-id="retry-button" {{on "click" (fn retry errorFeatures)}}>Retry</button>
          </:cancelled>
          <:error as |error|>
            <span data-test-error>{{error.message}}<br />Count: {{countFor error}}</span>
          </:error>
        </Paginate>
      </template>;
    })

    .test('it transitions to error state if cancelled block is not present', function (props) {
      const { request, store, countFor } = props;

      return <template>
        <Paginate @request={{request}} @store={{store}}>
          <:loading>
            <span data-test-pending>Pending<br />Count: {{countFor request}}</span>
          </:loading>
          <:content as |pages features|>
            <Request @request={{pages.activePageRequest}} @store={{store}}>
              <:content as |content|>
                {{#each content.data as |user|}}
                  <span data-test-user-name>{{user.attributes.name}}<br />Count: {{countFor user}}</span>
                {{/each}}
              </:content>
              <:loading><span data-test-loading-page>Pending</span></:loading>
            </Request>
          </:content>
          <:error as |error|>
            <span data-test-error>{{error.message}}<br />Count: {{countFor error}}</span>
          </:error>
        </Paginate>
      </template>;
    })

    .test('it does not rethrow for cancelled', function (props) {
      const { request, store, countFor } = props;

      return <template>
        <Paginate @request={{request}} @store={{store}}>
          <:loading>
            <span data-test-pending>Pending<br />Count: {{countFor request}}</span>
          </:loading>
          <:content as |pages features|>
            <Request @request={{pages.activePageRequest}} @store={{store}}>
              <:content as |content|>
                {{#each content.data as |user|}}
                  <span data-test-user-name>{{user.attributes.name}}<br />Count: {{countFor user}}</span>
                {{/each}}
              </:content>
              <:loading><span data-test-loading-page>Pending</span></:loading>
            </Request>
          </:content>
        </Paginate>
      </template>;
    })

    .test('a failed page load renders the active page error and can be retried', function (props) {
      const { request, store } = props;

      return <template>
        <Paginate @request={{request}} @store={{store}}>
          <:loading>
            <span data-test-pending>Pending</span>
          </:loading>
          <:content as |pages features|>
            <Request @request={{pages.activePageRequest}} @store={{store}}>
              <:idle><span data-test-idle>No page is active</span></:idle>
              <:content as |content|>
                {{#each content.data as |user|}}
                  <span data-test-user-name>{{user.attributes.name}}</span>
                {{/each}}
              </:content>
              <:loading><span data-test-loading-page>Pending</span></:loading>
              <:error as |error|>
                <span data-test-page-error>{{error.message}}</span>
              </:error>
            </Request>

            <EachLink @pages={{pages}} as |state|>
              {{#each state.links as |link|}}
                {{#if link.isReal}}
                  <button {{on "click" link.setActive}} data-test-load-page={{link.index}}>{{link.text}}</button>
                {{else}}
                  <button>.</button>
                {{/if}}
              {{/each}}
            </EachLink>
          </:content>
          <:error as |error|>
            <span data-test-error>{{error.message}}</span>
          </:error>
        </Paginate>
      </template>;
    })

    .test('a failed loadNext renders the error and can be retried', function (props) {
      const { request, store } = props;

      return <template>
        <Paginate @request={{request}} @store={{store}} @mode="infinite">
          <:loading>
            <span data-test-pending>Pending</span>
          </:loading>
          <:content as |pages features|>
            {{#each pages.data as |user|}}
              <span data-test-user-name>{{user.attributes.name}}</span>
            {{/each}}

            {{#if pages.hasNext}}
              <Request @request={{pages.nextRequest}} @store={{store}}>
                <:idle>
                  <button data-test-load-next {{on "click" features.loadNext}}>Load next</button>
                </:idle>
                <:loading><span data-test-loading-next>Loading next</span></:loading>
                <:error as |error|>
                  <span data-test-next-error>{{error.message}}</span>
                  <button data-test-load-next {{on "click" features.loadNext}}>Retry</button>
                </:error>
              </Request>
            {{/if}}
          </:content>
          <:error as |error|>
            <span data-test-error>{{error.message}}</span>
          </:error>
        </Paginate>
      </template>;
    })

    .test(
      'a changed @request that resolves to a page of the same collection is adopted as the active page',
      function (props) {
        const { source, store } = props;

        return <template>
          <Paginate @request={{source.request}} @store={{store}}>
            <:loading>
              <span data-test-pending>Pending</span>
            </:loading>
            <:content as |pages features|>
              {{#if features.isNavigating}}
                <span data-test-navigating>Navigating</span>
              {{/if}}
              <Request @request={{pages.activePageRequest}} @store={{store}}>
                <:content as |content|>
                  {{#each content.data as |user|}}
                    <span data-test-user-name>{{user.attributes.name}}</span>
                  {{/each}}
                </:content>
                <:loading><span data-test-loading-page>Loading page</span></:loading>
              </Request>
            </:content>
            <:error as |error|>
              <span data-test-error>{{error.message}}</span>
            </:error>
          </Paginate>
        </template>;
      }
    )

    .test('a changed @request that resolves to a different collection resets the pagination', function (props) {
      const { source, store } = props;

      return <template>
        <Paginate @request={{source.request}} @store={{store}}>
          <:loading>
            <span data-test-pending>Pending</span>
          </:loading>
          <:content as |pages features|>
            {{#if features.isNavigating}}
              <span data-test-navigating>Navigating</span>
            {{/if}}
            <Request @request={{pages.activePageRequest}} @store={{store}}>
              <:content as |content|>
                {{#each content.data as |user|}}
                  <span data-test-user-name>{{user.attributes.name}}</span>
                {{/each}}
              </:content>
              <:loading><span data-test-loading-page>Loading page</span></:loading>
            </Request>
          </:content>
          <:error as |error|>
            <span data-test-error>{{error.message}}</span>
          </:error>
        </Paginate>
      </template>;
    })

    .test('adoptPage adopts same-collection requests and rejects foreign ones', function (props) {
      const { request, store } = props;

      return <template>
        <Paginate @request={{request}} @store={{store}}>
          <:loading>
            <span data-test-pending>Pending</span>
          </:loading>
          <:content as |pages|>
            <Request @request={{pages.activePageRequest}} @store={{store}}>
              <:content as |content|>
                {{#each content.data as |user|}}
                  <span data-test-user-name>{{user.attributes.name}}</span>
                {{/each}}
              </:content>
              <:loading><span data-test-loading-page>Loading page</span></:loading>
            </Request>
          </:content>
          <:error as |error|>
            <span data-test-error>{{error.message}}</span>
          </:error>
        </Paginate>
      </template>;
    })

    .test('concurrent adoptPage calls resolve to the latest call', function (props) {
      const { request, store } = props;

      return <template>
        <Paginate @request={{request}} @store={{store}}>
          <:loading>
            <span data-test-pending>Pending</span>
          </:loading>
          <:content as |pages|>
            <Request @request={{pages.activePageRequest}} @store={{store}}>
              <:content as |content|>
                {{#each content.data as |user|}}
                  <span data-test-user-name>{{user.attributes.name}}</span>
                {{/each}}
              </:content>
              <:loading><span data-test-loading-page>Loading page</span></:loading>
            </Request>
          </:content>
          <:error as |error|>
            <span data-test-error>{{error.message}}</span>
          </:error>
        </Paginate>
      </template>;
    })

    .test('re-requesting a loaded page updates the page graph with its new links and total', function (props) {
      const { request, store } = props;

      return <template>
        <Paginate @request={{request}} @store={{store}}>
          <:loading>
            <span data-test-pending>Pending</span>
          </:loading>
          <:content as |pages features|>
            <Request @request={{pages.activePageRequest}} @store={{store}}>
              <:content as |content|>
                {{#each content.data as |user|}}
                  <span data-test-user-name>{{user.attributes.name}}</span>
                {{/each}}
              </:content>
              <:loading><span data-test-loading-page>Loading page</span></:loading>
            </Request>

            <EachLink @pages={{pages}} as |state|>
              {{#each state.links as |link|}}
                {{#if link.isReal}}
                  <button
                    {{on "click" (fn features.loadPage link.url)}}
                    data-test-load-page={{link.index}}
                  >{{link.text}}</button>
                {{else}}
                  <button>.</button>
                {{/if}}
              {{/each}}
              {{#if state.next}}
                <button {{on "click" state.next.setActive}} data-test-next>{{state.next.text}}</button>
              {{/if}}
            </EachLink>
          </:content>
          <:error as |error|>
            <span data-test-error>{{error.message}}</span>
          </:error>
        </Paginate>
      </template>;
    })

    .test(
      'reloading the first page after the collection grows by one page links the new last page',
      pagedReloadTemplate
    )
    .test('reloading a middle page after the collection grows keeps the pages around it in order', pagedReloadTemplate)
    .test('reloading the last page after the collection grows gives it a next page', pagedReloadTemplate)
    .test(
      'reloading the first page after the collection grows by several pages renders a gap before the new last page',
      pagedReloadTemplate
    )
    .test('reloading a page with an unchanged document leaves the page graph as it was', pagedReloadTemplate)
    .test(
      'a changed @request that reloads the active page swaps in its document without a loading state',
      sourceReloadTemplate
    )
    .test('a failed reload leaves the loaded page untouched', pagedReloadTemplate)
    .test('a reload that omits links keeps the links recorded from the earlier load', pagedReloadTemplate)
    .test('concurrent reloads of the same page resolve to the latest request', pagedReloadTemplate)
    .test(
      'a reload through one component updates the links of another component sharing the collection',
      sharedReloadTemplate
    )
    .test(
      'a new pagination over an already-loaded page adopts the newer request for everyone sharing the page',
      secondPaginationTemplate
    )
    .test('reloading a page in an infinite run replaces its items in place', infiniteReloadTemplate)
    .test('reloading the last page of an infinite run that gained a next page extends the run', infiniteReloadTemplate)
    .test(
      'reloading a page in an infinite run whose next page is gone drops the pages after it',
      infiniteReloadTemplate
    )
    .test(
      'reloading the entry page of an infinite run whose previous page is gone drops the pages before it',
      infiniteReloadTemplate
    )
    .test(
      'reloading a page whose next cursor changed drops the stale branch and follows the new one',
      infiniteReloadTemplate
    )

    .test('a numbered page whose next link skips a page is a contradiction', pagedReloadTemplate)
    .test('a numbered page whose prev link skips a page is a contradiction', pagedReloadTemplate)
    .test('a numbered page above the first with no prev link is a contradiction', pagedReloadTemplate)
    .test('a numbered page below the last with no next link is a contradiction', pagedReloadTemplate)
    .test('a numbered page beyond the collection total is a contradiction', pagedReloadTemplate)
    .test('a first link that names a page other than page 1 is a contradiction', pagedReloadTemplate)
    .test('a last link that names a page other than the last page is a contradiction', pagedReloadTemplate)
    .test('a first link to a page with a page linked before it is a contradiction', pagedReloadTemplate)
    .test(
      'a numbered page whose next link skips to a page known only from links is a contradiction',
      pagedReloadTemplate
    )
    .test(
      'reloading a page whose next cursor now skips a page drops the skipped page from the run',
      infiniteReloadTemplate
    )
    // @ts-expect-error need to figure out how to do this for "compiled" versions of this type
    // If there's a typeerror here, we are missing a test.
    .never(null);
});
