// #omit-file-from-starter
import type { ReactiveDataDocument } from '@warp-drive/core/reactive';
import { withReactiveResponse, withResponseType } from '@warp-drive/core/request';
import type { RequestInfo } from '@warp-drive/core/types/request';
import { buildBaseURL, buildQueryParams } from '@warp-drive/utilities';

import type { Todo } from '../schemas/todo.ts';
import type Store from '../store.ts';
import { patchCacheTodoActivated, patchCacheTodoCompleted } from './update.ts';
import { keyForSavedResource } from './utils.ts';

interface EmptyDocument {
  data: null;
}

/**
 * PATCH /api/todo/ops.bulk.patchAll — used by "toggle all". Sets `completed`
 * on every todo that doesn't already have it.
 */
export function bulkPatchTodos(attributes: { completed: boolean }): RequestInfo<EmptyDocument> {
  const url = buildBaseURL({ resourcePath: 'todo' });
  const queryString = buildQueryParams({ 'filter[completed]': !attributes.completed });

  return withResponseType<EmptyDocument>({
    method: 'PATCH',
    url: `${url}/ops.bulk.patchAll?${queryString}`,
    body: JSON.stringify({ attributes }),
  });
}

/**
 * Applies a "toggle all" to the cache. The server replies with no todos, so
 * we set `completed` on each changed todo ourselves and move it into the
 * matching cached list. Pass only the todos that actually changed.
 */
export function bulkPatchCacheTodos(store: Store, changed: Todo[], completed: boolean): void {
  for (const todo of changed) {
    store.cache.patch({ record: keyForSavedResource(todo), op: 'update', field: 'completed', value: completed });
    if (completed) patchCacheTodoCompleted(store, todo);
    else patchCacheTodoActivated(store, todo);
  }
}

/**
 * DELETE /api/todo/ops.bulk.deleteAll — used by "clear completed". Deletes
 * every completed todo; pass the completed todos so the cache can drop them.
 */
export function bulkDeleteTodos(todos: Todo[]): RequestInfo<ReactiveDataDocument<null>> {
  const url = buildBaseURL({ resourcePath: 'todo' });
  const queryString = buildQueryParams({ 'filter[completed]': true });

  return withReactiveResponse<null>({
    method: 'DELETE',
    url: `${url}/ops.bulk.deleteAll?${queryString}`,

    // Removes each todo from every cached list once the request succeeds.
    op: 'deleteRecord',
    records: todos.map(keyForSavedResource),
  });
}
