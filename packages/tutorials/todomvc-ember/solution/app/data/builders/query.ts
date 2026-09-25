// #omit-file-from-starter
import { withReactiveResponse } from '@warp-drive/core/request';
import type { RequestInfo } from '@warp-drive/core/types/request';
import { buildBaseURL, buildQueryParams } from '@warp-drive/utilities';

import type { Todo, TodosDocument } from '../schemas/todo.ts';

function queryTodos(filter?: { completed: boolean }): RequestInfo<TodosDocument> {
  const url = buildBaseURL({ resourcePath: 'todo' });
  const query = filter ? `?${buildQueryParams({ 'filter[completed]': filter.completed })}` : '';

  return withReactiveResponse<Todo[]>({
    method: 'GET',
    url: `${url}${query}`,

    // 'query' requests for the 'todo' type are invalidated whenever a todo is
    // created, so every list refetches and picks up the new todo.
    op: 'query',
    cacheOptions: { types: ['todo'] },
  });
}

/** GET /api/todo */
export function getAllTodos(): RequestInfo<TodosDocument> {
  return queryTodos();
}

/** GET /api/todo?filter[completed]=false */
export function getActiveTodos(): RequestInfo<TodosDocument> {
  return queryTodos({ completed: false });
}

/** GET /api/todo?filter[completed]=true */
export function getCompletedTodos(): RequestInfo<TodosDocument> {
  return queryTodos({ completed: true });
}
