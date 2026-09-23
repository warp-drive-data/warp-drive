import type { ReactiveDataDocument } from '@warp-drive/core/reactive';
import { withReactiveResponse } from '@warp-drive/core/request';
import type { RequestInfo } from '@warp-drive/core/types/request';
import { buildBaseURL } from '@warp-drive/utilities';

import type { Todo, TodoAttributes } from '../schemas/todo.ts';

/** POST /api/todo */
export function createTodo(attributes: TodoAttributes): RequestInfo<ReactiveDataDocument<Todo>> {
  return withReactiveResponse<Todo>({
    method: 'POST',
    url: buildBaseURL({ resourcePath: 'todo' }),
    body: JSON.stringify({ data: { type: 'todo', attributes } }),

    // Invalidates every cached 'todo' query and count, so they refetch with the new todo.
    op: 'createRecord',
    cacheOptions: { types: ['todo', 'todo-count'] },
  });
}
