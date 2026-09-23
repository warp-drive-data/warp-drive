import { withResponseType } from '@warp-drive/core/request';
import type { RequestInfo } from '@warp-drive/core/types/request';
import type { ResourceMetaDocument } from '@warp-drive/core/types/spec/document';
import { buildBaseURL, buildQueryParams } from '@warp-drive/utilities';

export interface ResourceCountDocument extends ResourceMetaDocument {
  meta: {
    count: number;
  };
}

function countTodos(filter?: { completed: boolean }): RequestInfo<ResourceCountDocument> {
  const url = buildBaseURL({ resourcePath: 'todo' });
  const query = filter ? `?${buildQueryParams({ 'filter[completed]': filter.completed })}` : '';

  return withResponseType<ResourceCountDocument>({
    method: 'GET',
    url: `${url}/ops.count${query}`,

    // Like the lists, counts are invalidated whenever a todo is created.
    op: 'query',
    cacheOptions: { types: ['todo'] },
  });
}

/** GET /api/todo/ops.count */
export function getAllTodosCount(): RequestInfo<ResourceCountDocument> {
  return countTodos();
}

/** GET /api/todo/ops.count?filter[completed]=true */
export function getCompletedTodosCount(): RequestInfo<ResourceCountDocument> {
  return countTodos({ completed: true });
}

/** GET /api/todo/ops.count?filter[completed]=false */
export function getActiveTodosCount(): RequestInfo<ResourceCountDocument> {
  return countTodos({ completed: false });
}
