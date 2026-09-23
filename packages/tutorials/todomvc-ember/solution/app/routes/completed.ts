import Route from '@ember/routing/route';
import { service } from '@ember/service';

import type { Future } from '@warp-drive/core/request';

// #remove-region-from-starter
// #region import-query
import { getCompletedTodos } from '#app/data/builders/query.ts';
// #endregion import-query
import type { TodosDocument } from '#app/data/schemas/todo.ts';
import type Store from '#app/data/store.ts';

export default class CompletedTodos extends Route {
  @service declare private readonly store: Store;

  model(): { todos?: Future<TodosDocument> } {
    return {
      // #replace-region-in-starter TODO (chapter 3): request the completed todos
      // #region request-todos
      todos: this.store.request(getCompletedTodos()),
      // #endregion request-todos
    };
  }
}
