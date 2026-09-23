import { on } from '@ember/modifier';
import { service } from '@ember/service';
import Component from '@glimmer/component';

import { Request } from '@warp-drive/ember';

import { HandleError } from '#app/components/design-system/error.gts';
import { bulkDeleteCompletedTodos } from '#app/data/builders/bulk.ts';
import { getCompletedTodosCount } from '#app/data/builders/count.ts';
import { invalidateAllTodoQueries } from '#app/data/builders/query.ts';
import type Store from '#app/data/store.ts';
import { reportError } from '#app/helpers/error.ts';
import type AppState from '#app/services/app-state.ts';

/**
 * Renders a button to clear completed todos if there are any.
 * On click, it will delete all completed todos.
 * If there are no completed todos, nothing is rendered.
 */
export const ClearCompletedTodos = <template>
  <Request @query={{(getCompletedTodosCount)}} @autorefresh={{true}} @autorefreshBehavior="refresh">
    <:content as |content|>
      <ClearCompleted @completed={{content.meta.count}} />
    </:content>
    <:error as |error|>
      <HandleError @error={{error}} @toast="Could not get completed todos for 'Clear Completed'." />
    </:error>
  </Request>
</template>;

class ClearCompleted extends Component<{
  Args: { completed: number };
}> {
  <template>
    {{#if @completed}}
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
      await this.store.request(bulkDeleteCompletedTodos());
      invalidateAllTodoQueries(this.store);
    } catch (e) {
      reportError(new Error('Could not clear completed todos', { cause: e }), { toast: true });
    }

    this.appState.onSaveEnd();
  };
}
