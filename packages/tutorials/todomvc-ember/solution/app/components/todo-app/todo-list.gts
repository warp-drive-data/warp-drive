import { service } from '@ember/service';
import Component from '@glimmer/component';

import { checkout } from '@warp-drive/core/reactive';
import { Await } from '@warp-drive/ember';

import { HandleError } from '#app/components/design-system/error.gts';
import { TodoItem } from '#app/components/todo-app/todo-item.gts';
import type { EditableTodo, Todo } from '#app/data/schemas/todo.ts';
import type AppState from '#app/services/app-state.ts';

interface Signature {
  Args: { todos: Todo[] };
}

export class TodoList extends Component<Signature> {
  <template>
    <ul class="todo-list">
      {{#each @todos as |immutableTodo|}}
        <Await @promise={{this.checkout immutableTodo}}>

          {{! On success, we have a mutable copy of the todo }}
          <:success as |mutableTodoCopy|>
            <TodoItem
              @todo={{mutableTodoCopy}}
              @onEditStart={{this.appState.onEditStart}}
              @onEditEnd={{this.appState.onEditEnd}}
            />
          </:success>

          {{! On error, pass to HandleError }}
          <:error as |error|><HandleError @error={{error}} /></:error>

        </Await>
      {{/each}}
    </ul>
  </template>

  @service declare private readonly appState: AppState;

  checkout(todo: Todo): Promise<EditableTodo> {
    return checkout<EditableTodo>(todo);
  }
}
