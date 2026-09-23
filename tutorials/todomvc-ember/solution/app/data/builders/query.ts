import type { ReactiveDataDocument } from '@warp-drive/core/reactive';
import { withReactiveResponse } from '@warp-drive/core/request';
import type { RequestInfo } from '@warp-drive/core/types/request';
import { buildBaseURL, buildQueryParams } from '@warp-drive/utilities';

import type { Todo } from '../schemas/todo.ts';
import type Store from '../store.ts';

export type TodosDocument = ReactiveDataDocument<Todo[]>;

function queryTodos(pageSize: number, page?: number, filter?: { completed: boolean }): RequestInfo<TodosDocument> {
  const url = buildBaseURL({ resourcePath: 'todo' });
  const queryString = buildQueryParams({
    ...(filter && { 'filter[completed]': filter.completed }),
    'page[limit]': pageSize,
    'page[offset]': typeof page === 'number' ? (page - 1) * pageSize : 0,
  });

  return withReactiveResponse<Todo[]>({
    method: 'GET',
    url: `${url}?${queryString}`,

    // 'query' requests for the 'todo' type are invalidated whenever a todo is
    // created, so every list refetches and picks up the new todo.
    op: 'query',
    cacheOptions: { types: ['todo'] },
  });
}

/** GET /api/todo (plus pagination params) */
export function getAllTodos(page?: number): RequestInfo<TodosDocument> {
  return queryTodos(5, page);
}

/** GET /api/todo?filter[completed]=false (plus pagination params) */
export function getActiveTodos(page?: number): RequestInfo<TodosDocument> {
  return queryTodos(10, page, { completed: false });
}

/** GET /api/todo?filter[completed]=true (plus pagination params) */
export function getCompletedTodos(page?: number): RequestInfo<TodosDocument> {
  return queryTodos(10, page, { completed: true });
}

/** Marks every cached todo list stale, so each refetches the next time it's shown. */
export function invalidateAllTodoQueries(store: Store): void {
  store.lifetimes.invalidateRequestsForType('todo', store);
}
