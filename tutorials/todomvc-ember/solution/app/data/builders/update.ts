import type { ReactiveDataDocument } from '@warp-drive/core/reactive';
import { withReactiveResponse } from '@warp-drive/core/request';
import type { RequestInfo } from '@warp-drive/core/types/request';
import { buildBaseURL } from '@warp-drive/utilities';

import type { Todo, TodoAttributes } from '../schemas/todo.ts';
import type Store from '../store.ts';
import { getActiveTodos, getCompletedTodos, invalidateAllTodoQueries } from './query.ts';
import { keyForRequest, keyForSavedResource } from './utils.ts';

/** PATCH /api/todo/:id */
export function patchTodo(todo: Todo, attributes: Partial<TodoAttributes>): RequestInfo<ReactiveDataDocument<Todo>> {
  const key = keyForSavedResource(todo);

  return withReactiveResponse<Todo>({
    method: 'PATCH',
    url: buildBaseURL({ resourcePath: `todo/${key.id}` }),
    body: JSON.stringify({ data: { type: 'todo', id: key.id, attributes } }),

    // The response updates this todo in the cache, and every list holding it
    // re-renders with the new attributes.
    records: [key],
  });
}

/**
 * Moves a todo from the cached "active" list to the cached "completed" list.
 *
 * The cache patches a todo's *attributes* into every list that already holds
 * it, but it can't move a todo between lists: a list only tracks the records
 * it returned, not the ones it didn't. So when a todo's completion changes we
 * patch the two list documents ourselves so the change shows immediately.
 *
 * Only the first page of each list is patched, and removing a todo leaves its
 * page one short, so we also mark every list and count stale. Lists on screen
 * refetch in the background and fill the gap; the rest refetch when shown.
 */
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
  // FIXME: Set a real index on these.
  if (store.cache.peekRequest(to)) {
    store.cache.patch({ record: to, op: 'add', field: 'data', value, index: 0 });
  }
  if (store.cache.peekRequest(from)) {
    store.cache.patch({ record: from, op: 'remove', field: 'data', value });
  }

  invalidateAllTodoQueries(store);
}
