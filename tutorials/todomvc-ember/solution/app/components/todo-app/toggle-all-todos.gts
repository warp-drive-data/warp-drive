import { on } from '@ember/modifier';
import { service } from '@ember/service';
import Component from '@glimmer/component';
import { cached } from '@glimmer/tracking';

import { bulkPatchCacheTodos, bulkPatchTodos } from '#app/data/builders/bulk.ts';
import type { Todo } from '#app/data/schemas/todo.ts';
import type Store from '#app/data/store.ts';
import { reportError } from '#app/helpers/error.ts';
import type AppState from '#app/services/app-state.ts';

export class ToggleAllTodos extends Component<{
  Args: {
    todos: Todo[];
  };
}> {
  <template>
    <input
      id="toggle-all"
      class="toggle-all"
      type="checkbox"
      checked={{this.areViewableCompleted}}
      {{on "change" this.toggleAll}}
    />
    <label for="toggle-all">Mark all as complete</label>
  </template>

  @service declare private readonly store: Store;
  @service declare private readonly appState: AppState;

  @cached
  private get areViewableCompleted(): boolean {
    const { todos } = this.args;
    return todos.length > 0 && todos.every((todo) => todo.completed);
  }

  private readonly toggleAll = async () => {
    const completed = !this.areViewableCompleted;
    const changed = this.args.todos.filter((todo) => todo.completed !== completed);
    if (changed.length === 0) return;

    this.appState.onSaveStart();

    try {
      await this.store.request(bulkPatchTodos(changed, { completed }));
      bulkPatchCacheTodos(this.store, changed, completed);
    } catch (e) {
      reportError(new Error('Could not toggle all todos', { cause: e }), { toast: true });
    }

    this.appState.onSaveEnd();
  };
}
