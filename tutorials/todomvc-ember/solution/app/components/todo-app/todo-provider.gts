import { service } from '@ember/service';
import Component from '@glimmer/component';

import type { Future } from '@warp-drive/core/request';
import type { PagedPaginationContentFeatures, PagedPaginationState } from '@warp-drive/ember/experiments';
import { Paginate } from '@warp-drive/ember/experiments';

import { LoadingSpinner } from '#app/components/design-system/loading.gts';
import { PaginationControls } from '#app/components/todo-app/pagination-controls.gts';
import type { TodosDocument } from '#app/data/builders/query.ts';
import type { Todo } from '#app/data/schemas/todo.ts';
import type AppState from '#app/services/app-state.ts';

interface Signature {
  Args: {
    todoFuture: Future<TodosDocument>;
  };
  Blocks: {
    toggle: [todos: Todo[]];
    list: [todos: Todo[]];
  };
}

export class TodoProvider extends Component<Signature> {
  <template>
    <Paginate @request={{@todoFuture}} @autorefresh={{true}} @autorefreshBehavior="refresh">

      <:loading><LoadingSpinner /></:loading>

      <:content as |pages state|>
        {{#if pages.activePage.data}}
          <ActivePage @pages={{pages}} @state={{state}} @activePageData={{pages.activePage.data}}>
            <:toggle as |list|>{{yield list to="toggle"}}</:toggle>
            <:list as |list|>{{yield list to="list"}}</:list>
          </ActivePage>
        {{/if}}

        <PaginationControls @pages={{pages}} @state={{state}} />
      </:content>

      <:error as |error|>{{this.appState.onUnrecoverableError error}}</:error>

    </Paginate>
  </template>

  @service declare private readonly appState: AppState;
}

class ActivePage extends Component<{
  Args: {
    pages: PagedPaginationState<TodosDocument>;
    state: PagedPaginationContentFeatures<TodosDocument>;
    activePageData: Todo[];
  };
  Blocks: {
    toggle: [todos: Todo[]];
    list: [todos: Todo[]];
  };
}> {
  <template>
    {{#if this.showInternalLoading}}
      <LoadingSpinner />
    {{else if this.showToggle}}
      {{yield @activePageData to="toggle"}}
    {{/if}}

    {{#unless this.showInternalError}}
      {{yield @activePageData to="list"}}
    {{/unless}}
  </template>

  @service declare private readonly appState: AppState;

  get showInternalLoading() {
    return this.appState.isSaving;
  }

  get showInternalError() {
    return this.appState.error;
  }

  get showToggle() {
    return this.args.activePageData.length > 0 && !this.args.pages.activePage?.isLoading && this.appState.canToggle;
  }
}
