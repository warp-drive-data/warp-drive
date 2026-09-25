import { on } from '@ember/modifier';
import { service } from '@ember/service';
import Component from '@glimmer/component';

import { Request } from '@warp-drive/ember';

import { HandleError } from '#app/components/design-system/error.gts';
import type { Todo } from '#app/data/schemas/todo.ts';
import type Store from '#app/data/store.ts';
import { reportError } from '#app/helpers/error.ts';
import type AppState from '#app/services/app-state.ts';

/**
 * Renders a button to clear completed todos if there are any.
 * On click, it will delete all completed todos.
 * If there are no completed todos, nothing is rendered.
 */
export const ClearCompletedTodos = <template>
  {{! TODO (chapter 3): show the button when there are completed todos }}
</template>;

class ClearCompleted extends Component<{
  Args: { completed: Todo[] };
}> {
  <template>
    {{#if @completed.length}}
      <button class="clear-completed" type="button" {{on "click" this.clearCompleted}}>
        Clear completed
      </button>
    {{/if}}
  </template>

  @service declare private readonly store: Store;
  @service declare private readonly appState: AppState;

  clearCompleted = async () => {
    this.appState.onSaveStart();

    try {
      // TODO (chapter 8): delete the completed todos
    } catch (e) {
      reportError(new Error('Could not clear completed todos', { cause: e }), { toast: true });
    }

    this.appState.onSaveEnd();
  };
}
