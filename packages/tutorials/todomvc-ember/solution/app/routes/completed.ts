import Route from '@ember/routing/route';
import { service } from '@ember/service';

import type { Future } from '@warp-drive/core/request';

// #remove-from-starter
import { getCompletedTodos } from '#app/data/builders/query.ts';
// #end-remove-from-starter
import type { TodosDocument } from '#app/data/schemas/todo.ts';
import type Store from '#app/data/store.ts';

export default class CompletedTodos extends Route {
  @service declare private readonly store: Store;

  model(): { todos?: Future<TodosDocument> } {
    return {
      // #replace-in-starter TODO (chapter 3): request the completed todos
      todos: this.store.request(getCompletedTodos()),
      // #end-replace-in-starter
    };
  }
}
