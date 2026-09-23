import Route from '@ember/routing/route';
import { service } from '@ember/service';

import type { Future } from '@warp-drive/core/request';

import {
  getActiveTodosCount,
  getAllTodosCount,
  getCompletedTodosCount,
  type ResourceCountDocument,
} from '#app/data/builders/count.ts';
import { getCompletedTodos, type TodosDocument } from '#app/data/builders/query.ts';
import type Store from '#app/data/store.ts';

export default class CompletedTodos extends Route {
  @service declare private readonly store: Store;

  // Refetch when the page changes, instead of only updating the URL.
  queryParams = {
    page: { refreshModel: true },
  };

  model(params: { page: number }): {
    todos: Future<TodosDocument>;
    counts: Future<ResourceCountDocument>[];
  } {
    return {
      todos: this.store.request(getCompletedTodos(params.page)),
      // Started here so the footer's counts load alongside the list.
      counts: [
        this.store.request(getAllTodosCount()),
        this.store.request(getCompletedTodosCount()),
        this.store.request(getActiveTodosCount()),
      ],
    };
  }
}
