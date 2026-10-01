// #omit-file-from-starter
import { recordIdentifierFor } from '@warp-drive/core';
import type { ReactiveDataDocument } from '@warp-drive/core/reactive';
import { withReactiveResponse } from '@warp-drive/core/request';
import type { PersistedResourceKey } from '@warp-drive/core/types/identifier';
import type { RequestInfo } from '@warp-drive/core/types/request';
import { buildBaseURL } from '@warp-drive/utilities';

import type { Todo, TodoAttributes, TodosDocument } from '../schemas/todo.ts';
import type Store from '../store.ts';
import { getActiveTodos, getCompletedTodos } from './query.ts';
import { serverIndex } from './utils.ts';

/** PATCH /api/todo/:id */
export function patchTodo(todo: Todo, attributes: Partial<TodoAttributes>): RequestInfo<ReactiveDataDocument<Todo>> {
  return withReactiveResponse<Todo>({
    method: 'PATCH',
    url: buildBaseURL({ op: 'updateRecord', identifier: { type: 'todo', id: todo.id } }),
    body: JSON.stringify({ data: { type: 'todo', id: todo.id, attributes } }),

    // 'updateRecord' plus the todo's key: on success the cache commits the
    // response to this todo, and every list holding it re-renders.
    op: 'updateRecord',
    records: [recordIdentifierFor(todo)],
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
  lists: { from: RequestInfo<TodosDocument>; to: RequestInfo<TodosDocument> }
): void {
  // A saved todo always has an id; the cast tells TypeScript so.
  const value = recordIdentifierFor(todo) as PersistedResourceKey<'todo'>;
  const from = store.cacheKeyManager.getOrCreateDocumentIdentifier(lists.from);
  const to = store.cacheKeyManager.getOrCreateDocumentIdentifier(lists.to);

  // Only patch lists that have been requested; the others will fetch fresh.
  if (to && store.cache.peekRequest(to)) {
    store.cache.patch({ record: to, op: 'add', field: 'data', value, index: serverIndex(store, lists.to, value) });
  }
  if (from && store.cache.peekRequest(from)) {
    store.cache.patch({ record: from, op: 'remove', field: 'data', value });
  }
}
