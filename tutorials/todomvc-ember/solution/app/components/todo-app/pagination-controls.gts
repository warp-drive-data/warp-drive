import type { TOC } from '@ember/component/template-only';
import { on } from '@ember/modifier';
import type RouterService from '@ember/routing/router-service';
import { service } from '@ember/service';
import Component from '@glimmer/component';

import type {
  PagedPaginationContentFeatures,
  PagedPaginationState,
  RealPaginationLink,
  RelationalPaginationLink,
} from '@warp-drive/ember/experiments';
import { EachLink } from '@warp-drive/ember/experiments';

import type { TodosDocument } from '#app/data/builders/query.ts';

import { Button } from '#app/components/design-system/button.gts';
import { LoadingSpinner } from '#app/components/design-system/loading.gts';

interface Signature {
  Args: {
    pages: PagedPaginationState<TodosDocument>;
    state: PagedPaginationContentFeatures<TodosDocument>;
  };
}

export const PaginationControls: TOC<Signature> = <template>
  <EachLink @pages={{@pages}} as |links|>
    {{#if (or links.prev links.next)}}
      <div class="pagination-controls">
        <div class="pagination-link-buttons">

          {{#if links.prev}}<NavButton @link={{links.prev}} @page={{prevPage @pages}} />{{/if}}

          {{#each links.links as |link|}}
            {{#if link.isReal}}
              {{#if (nearActive link)}}<PageButton @link={{link}} />{{/if}}
            {{else}}
              <span class="pagination-button pagination-placeholder-button">⋯</span>
            {{/if}}
          {{/each}}

          {{#if links.next}}<NavButton @link={{links.next}} @page={{nextPage @pages}} />{{/if}}

        </div>

        {{#if @pages.activePage.isLoading}}<LoadingSpinner />{{/if}}
      </div>
    {{/if}}
  </EachLink>
</template>;

/** A numbered page link. */
class PageButton extends Component<{
  Args: {
    link: RealPaginationLink;
  };
}> {
  <template>
    <Button
      {{on "click" this.setActive}}
      class="pagination-button pagination-real-button {{if @link.isCurrent 'pagination-button-active'}}"
    >
      <span class="pagination-button-text">{{@link.index}}</span>
    </Button>
  </template>

  @service declare router: RouterService;

  setActive = async () => {
    const { link } = this.args;
    this.router.transitionTo({ queryParams: { page: link.index } });
    await link.setActive();
  };
}

/** A relational prev/next link. */
class NavButton extends Component<{
  Args: {
    link: RelationalPaginationLink;
    page: number | null;
  };
}> {
  <template>
    <Button {{on "click" this.setActive}} class="pagination-button {{@link.rel}}">
      {{#if this.isPrev}}←{{/if}}
      <span class="pagination-button-text">Load {{if this.isPrev "previous" "next"}}</span>
      {{#unless this.isPrev}}→{{/unless}}
    </Button>
  </template>

  @service declare router: RouterService;

  get isPrev(): boolean {
    return this.args.link.rel === 'prev';
  }

  setActive = async () => {
    const { link, page } = this.args;
    this.router.transitionTo({ queryParams: { page } });
    await link.setActive();
  };
}

function prevPage(pages: PagedPaginationState<TodosDocument>): number | null {
  const n = pages.activePage?.pageNumber;
  return n ? n - 1 : null;
}

function nextPage(pages: PagedPaginationState<TodosDocument>): number | null {
  const n = pages.activePage?.pageNumber;
  return n ? n + 1 : null;
}

function or(a: unknown, b: unknown) {
  return a || b;
}

/** Only render numbered links within this many pages of the active page. */
const SHOW_DISTANCE = 3;

function nearActive(link: RealPaginationLink): boolean {
  return link.distanceFromActiveIndex <= SHOW_DISTANCE;
}
