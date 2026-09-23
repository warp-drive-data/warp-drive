import { on } from '@ember/modifier';
import { service } from '@ember/service';
import Component from '@glimmer/component';

import { Request } from '@warp-drive/ember';

import { HandleError } from '#app/components/design-system/error.gts';
// #remove-region-from-starter
// #region import-bulk
import { bulkDeleteTodos } from '#app/data/builders/bulk.ts';
// #endregion import-bulk
// #remove-region-from-starter
// #region import-query
import { getCompletedTodos } from '#app/data/builders/query.ts';
// #endregion import-query
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
  {{! #replace-region-in-starter TODO (chapter 3): show the button when there are completed todos }}
  <!-- #region completed-todos-request -->
  <Request @query={{(getCompletedTodos)}} @autorefresh={{true}} @autorefreshBehavior="refresh">
    <:content as |content|>
      <ClearCompleted @completed={{content.data}} />
    </:content>
    <:error as |error|>
      <HandleError @error={{error}} @toast="Could not get completed todos for 'Clear Completed'." />
    </:error>
  </Request>
  <!-- #endregion completed-todos-request -->
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
      // #replace-region-in-starter TODO (chapter 8): delete the completed todos
      // #region clear-completed
      await this.store.request(bulkDeleteTodos(this.args.completed));
      // #endregion clear-completed
    } catch (e) {
      reportError(new Error('Could not clear completed todos', { cause: e }), { toast: true });
    }

    this.appState.onSaveEnd();
  };
}
