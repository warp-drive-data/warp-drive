import type { ReactiveDataDocument } from '@warp-drive/core/reactive';
import { withReactiveResponse } from '@warp-drive/core/request';
import type { RequestInfo } from '@warp-drive/core/types/request';
import { buildBaseURL } from '@warp-drive/utilities';

import type { Todo, TodoAttributes } from '../schemas/todo.ts';
import type Store from '../store.ts';
import { patchCacheTodoActivated, patchCacheTodoCompleted } from './update.ts';
import { keyForSavedResource } from './utils.ts';

/** PATCH /api/todo/ops.bulk.patch — used by "toggle all". */
export function bulkPatchTodos(
  todos: Todo[],
  attributes: Partial<TodoAttributes>
): RequestInfo<ReactiveDataDocument<Todo[]>> {
  const keys = todos.map(keyForSavedResource);

  return withReactiveResponse<Todo[]>({
    method: 'PATCH',
    url: `${buildBaseURL({ resourcePath: 'todo' })}/ops.bulk.patch`,
    body: JSON.stringify({ data: keys.map(({ type, id }) => ({ type, id })), attributes }),

    // As with patchTodo, the returned attributes are patched into each todo
    // everywhere it appears in the cache.
    op: 'updateRecord',
    records: keys,
  });
}

/**
 * Moves todos whose completion just changed into the matching cached list.
 * Pass only the todos that actually changed.
 */
export function bulkPatchCacheTodos(store: Store, changed: Todo[], completed: boolean): void {
  for (const todo of changed) {
    if (completed) patchCacheTodoCompleted(store, todo);
    else patchCacheTodoActivated(store, todo);
  }
}

/** DELETE /api/todo/ops.bulk.delete — used by "clear completed". */
export function bulkDeleteTodos(todos: Todo[]): RequestInfo<ReactiveDataDocument<Todo[]>> {
  const keys = todos.map(keyForSavedResource);

  return withReactiveResponse<Todo[]>({
    method: 'DELETE',
    url: `${buildBaseURL({ resourcePath: 'todo' })}/ops.bulk.delete`,
    body: JSON.stringify({ data: keys.map(({ type, id }) => ({ type, id })) }),

    // Removes each todo from every cached list once the request succeeds.
    op: 'deleteRecord',
    records: keys,
  });
}
