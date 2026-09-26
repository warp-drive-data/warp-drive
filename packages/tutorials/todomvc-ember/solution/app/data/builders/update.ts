// #omit-file-from-starter
import type { ReactiveDataDocument } from '@warp-drive/core/reactive';
import { withReactiveResponse } from '@warp-drive/core/request';
import type { RequestInfo } from '@warp-drive/core/types/request';
import { buildBaseURL } from '@warp-drive/utilities';

import type { Todo, TodoAttributes } from '../schemas/todo.ts';
import type Store from '../store.ts';
import { getActiveTodos, getCompletedTodos } from './query.ts';
import { keyForRequest, keyForSavedResource, serverIndex } from './utils.ts';

/** PATCH /api/todo/:id */
export function patchTodo(todo: Todo, attributes: Partial<TodoAttributes>): RequestInfo<ReactiveDataDocument<Todo>> {
  const key = keyForSavedResource(todo);

  return withReactiveResponse<Todo>({
    method: 'PATCH',
    url: buildBaseURL({ op: 'updateRecord', resourcePath: 'todo', identifier: key }),
    body: JSON.stringify({ data: { type: 'todo', id: key.id, attributes } }),

    // 'updateRecord' plus the todo's key: on success the cache commits the
    // response to this todo, and every list holding it re-renders.
    op: 'updateRecord',
    records: [key],
  });
}

/** Moves a todo from the cached "active" list to the cached "completed" list. */
export function patchCacheTodoCompleted(store: Store, todo: Todo): void {
  moveBetweenLists(store, todo, { from: getActiveTodos(), to: getCompletedTodos() });
}

/** Moves a todo from the cached "completed" list to the cached "active" list. */
export function patchCacheTodoActivated(store: Store, todo: Todo): void {
  moveBetweenLists(store, todo, { from: getCompletedTodos(), to: getActiveTodos() });
}

function moveBetweenLists(
  store: Store,
  todo: Todo,
  lists: { from: ReturnType<typeof getActiveTodos>; to: ReturnType<typeof getActiveTodos> }
): void {
  const value = keyForSavedResource(todo);
  const from = keyForRequest(store, lists.from);
  const to = keyForRequest(store, lists.to);

  // Only patch lists that have been requested; the others will fetch fresh.
  if (store.cache.peekRequest(to)) {
    store.cache.patch({ record: to, op: 'add', field: 'data', value, index: serverIndex(store, to, value) });
  }
  if (store.cache.peekRequest(from)) {
    store.cache.patch({ record: from, op: 'remove', field: 'data', value });
  }
}
