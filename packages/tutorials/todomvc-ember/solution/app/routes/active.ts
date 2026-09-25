import Route from '@ember/routing/route';
import { service } from '@ember/service';

import type { Future } from '@warp-drive/core/request';

// #remove-from-starter
import { getActiveTodos } from '#app/data/builders/query.ts';
// #end-remove-from-starter
import type { TodosDocument } from '#app/data/schemas/todo.ts';
import type Store from '#app/data/store.ts';

export default class ActiveTodos extends Route {
  @service declare private readonly store: Store;

  model(): { todos?: Future<TodosDocument> } {
    return {
      // #replace-in-starter TODO (chapter 3): request the active todos
      todos: this.store.request(getActiveTodos()),
      // #end-replace-in-starter
    };
  }
}
