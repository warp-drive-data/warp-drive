import Route from '@ember/routing/route';
import { service } from '@ember/service';

import type { Future } from '@warp-drive/core/request';

import { getCompletedTodos, type TodosDocument } from '#app/data/builders/query.ts';
import type Store from '#app/data/store.ts';

export default class CompletedTodos extends Route {
  @service declare private readonly store: Store;

  model(): { todos: Future<TodosDocument> } {
    return {
      todos: this.store.request(getCompletedTodos()),
    };
  }
}
