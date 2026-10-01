// #omit-file-from-starter
import { recordIdentifierFor } from '@warp-drive/core';
import type { ReactiveDataDocument } from '@warp-drive/core/reactive';
import { withReactiveResponse } from '@warp-drive/core/request';
import type { RequestInfo } from '@warp-drive/core/types/request';
import { buildBaseURL } from '@warp-drive/utilities';

import type { Todo } from '../schemas/todo.ts';

/** DELETE /api/todo/:id */
export function deleteTodo(todo: Todo): RequestInfo<ReactiveDataDocument<Todo>> {
  return withReactiveResponse<Todo>({
    method: 'DELETE',
    url: buildBaseURL({ op: 'deleteRecord', identifier: { type: 'todo', id: todo.id } }),

    // The 'deleteRecord' op plus the todo's key tells the cache to remove it
    // from every cached list it appears in once the request succeeds.
    op: 'deleteRecord',
    records: [recordIdentifierFor(todo)],
  });
}
