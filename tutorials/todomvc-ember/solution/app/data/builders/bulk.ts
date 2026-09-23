import { withResponseType } from '@warp-drive/core/request';
import type { RequestInfo } from '@warp-drive/core/types/request';
import { buildBaseURL, buildQueryParams } from '@warp-drive/utilities';

import type { TodoAttributes } from '../schemas/todo.ts';

interface EmptyDocument {
  data: null;
}

// These act on every matching todo on the server, including ones on pages the
// app hasn't loaded. The cache can't know which todos changed, so callers
// invalidate the cached lists afterwards (see invalidateAllTodoQueries).

function patchAllTodos(
  filter: { completed: boolean },
  attributes: Partial<TodoAttributes>
): RequestInfo<EmptyDocument> {
  const url = buildBaseURL({ resourcePath: 'todo' });
  const queryString = buildQueryParams({ 'filter[completed]': filter.completed });

  return withResponseType<EmptyDocument>({
    method: 'PATCH',
    url: `${url}/ops.bulk.patchAll?${queryString}`,
    body: JSON.stringify({ attributes }),
  });
}

/** PATCH /api/todo/ops.bulk.patchAll?filter[completed]=true — "toggle all" off. */
export function bulkPatchAllTodosToActive(): RequestInfo<EmptyDocument> {
  return patchAllTodos({ completed: true }, { completed: false });
}

/** PATCH /api/todo/ops.bulk.patchAll?filter[completed]=false — "toggle all" on. */
export function bulkPatchAllTodosToCompleted(): RequestInfo<EmptyDocument> {
  return patchAllTodos({ completed: false }, { completed: true });
}

/** DELETE /api/todo/ops.bulk.deleteAll?filter[completed]=true — "clear completed". */
export function bulkDeleteCompletedTodos(): RequestInfo<EmptyDocument> {
  const url = buildBaseURL({ resourcePath: 'todo' });
  const queryString = buildQueryParams({ 'filter[completed]': true });

  return withResponseType<EmptyDocument>({
    method: 'DELETE',
    url: `${url}/ops.bulk.deleteAll?${queryString}`,
  });
}
