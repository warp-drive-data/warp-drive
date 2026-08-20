import { fn } from '@ember/helper';
import { on } from '@ember/modifier';

import { useEmber } from '@warp-drive/diagnostic/ember';
import { EachLink, Paginate, Request } from '@warp-drive/ember';
import { PaginateSpec } from '@warp-drive-internal/specs/paginate-component.spec';

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
      const { requestA, requestB, store, countFor } = props;

      return <template>
        <div data-test-paginate="a">
          <Paginate @request={{requestA}} @store={{store}}>
            <:loading>
              <span data-test-pending>Pending<br />Count: {{countFor requestA}}</span>
            </:loading>
            <:content as |pages features|>
              <Request @request={{pages.activePageRequest}} @store={{store}}>
                <:idle><span data-test-idle>No page is active</span></:idle>
                <:content as |content|>
                  <div data-test-pagination="a">
                    {{#each content.data as |user|}}
                      <span data-test-user-name>{{user.attributes.name}}<br />Count: {{countFor user}}</span>
                    {{/each}}
                  </div>
                </:content>
                <:loading><span data-test-loading-page>Pending<br />Count: {{countFor requestA}}</span></:loading>
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
        </div>

        <div data-test-paginate="b">
          <Paginate @request={{requestB}} @store={{store}}>
            <:loading>
              <span data-test-pending>Pending<br />Count: {{countFor requestB}}</span>
            </:loading>
            <:content as |pages features|>
              <Request @request={{pages.activePageRequest}} @store={{store}}>
                <:idle><span data-test-idle>No page is active</span></:idle>
                <:content as |content|>
                  <div data-test-pagination="b">
                    {{#each content.data as |user|}}
                      <span data-test-user-name>{{user.attributes.name}}<br />Count: {{countFor user}}</span>
                    {{/each}}
                  </div>
                </:content>
                <:loading><span data-test-loading-page>Pending<br />Count: {{countFor requestB}}</span></:loading>
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
            <button test-id="retry-button" {{on "click" (fn retry errorFeatures)}}>Retry</button>
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
            <button test-id="retry-button" {{on "click" (fn retry errorFeatures)}}>Retry</button>
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

    // @ts-expect-error need to figure out how to do this for "compiled" versions of this type
    // If there's a typeerror here, we are missing a test.
    .never(null);
});
