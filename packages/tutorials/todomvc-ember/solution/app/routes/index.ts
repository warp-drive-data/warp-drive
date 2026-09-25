import Route from '@ember/routing/route';
import { service } from '@ember/service';

import type { Future } from '@warp-drive/core/request';

// #remove-from-starter
import { getAllTodos } from '#app/data/builders/query.ts';
// #end-remove-from-starter
import type { TodosDocument } from '#app/data/schemas/todo.ts';
import type Store from '#app/data/store.ts';

export default class AllTodos extends Route {
  @service declare private readonly store: Store;

  model(): { todos?: Future<TodosDocument> } {
    return {
      // #replace-in-starter TODO (chapter 1): request the todos from /api/todo
      todos: this.store.request(getAllTodos()),
      // #end-replace-in-starter
    };
  }
}
