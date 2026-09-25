import { service } from '@ember/service';
import Component from '@glimmer/component';

import type { Future } from '@warp-drive/core/request';
import { Request } from '@warp-drive/ember';

import { LoadingSpinner } from '#app/components/design-system/loading.gts';
import type { Todo, TodosDocument } from '#app/data/schemas/todo.ts';
import type AppState from '#app/services/app-state.ts';

interface Signature {
  Args: {
    todoFuture?: Future<TodosDocument>;
  };
  Blocks: {
    toggle: [todos: Todo[]];
    list: [todos: Todo[]];
  };
}

export class TodoProvider extends Component<Signature> {
  <template>
    {{! #replace-in-starter TODO (chapter 1): render @todoFuture with <Request> }}
    <Request @request={{@todoFuture}} @autorefresh={{true}} @autorefreshBehavior="refresh">

      <:loading><LoadingSpinner /></:loading>

      <:content as |content|>
        <TodoListState @todos={{content.data}}>
          <:toggle as |list|>{{yield list to="toggle"}}</:toggle>
          <:list as |list|>{{yield list to="list"}}</:list>
        </TodoListState>
      </:content>

      <:error as |error|>{{this.appState.onUnrecoverableError error}}</:error>

    </Request>
    {{! #end-replace-in-starter }}
  </template>

  @service declare private readonly appState: AppState;
}

class TodoListState extends Component<{
  Args: {
    todos: Todo[];
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
      {{yield @todos to="toggle"}}
    {{/if}}

    {{#unless this.showInternalError}}
      {{yield @todos to="list"}}
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
    return this.args.todos.length > 0 && this.appState.canToggle;
  }
}
