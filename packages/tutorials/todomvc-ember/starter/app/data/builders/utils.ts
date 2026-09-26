import { recordIdentifierFor } from '@warp-drive/core';
import type { PersistedResourceKey, RequestKey, ResourceKey } from '@warp-drive/core/types/identifier';
import type { RequestInfo } from '@warp-drive/core/types/request';
import { buildBaseURL } from '@warp-drive/utilities';

import type { Todo } from '../schemas/todo.ts';
import type Store from '../store.ts';

/** The cache key of a saved todo. Throws if the todo has no id yet. */
export function keyForSavedResource(todo: Todo): PersistedResourceKey<'todo'> {
  const key = recordIdentifierFor(todo);
  if (key.id === null) throw new Error('Expected a saved todo');
  return key as PersistedResourceKey<'todo'>;
}

/** The cache key a request's response is stored under. */
export function keyForRequest(store: Store, request: RequestInfo): RequestKey {
  const key = store.cacheKeyManager.getOrCreateDocumentIdentifier(request);
  if (!key) throw new Error('Expected a cacheable request');
  return key;
}

/**
 * Where the server would put `todo` in the cached `list`.
 *
 * The server sorts todos by creation, which is the order of the unfiltered
 * `GET /api/todo` list. A filtered list is that order with some todos left
 * out, so the todo goes after every todo in `list` that the unfiltered list
 * puts before it. Returns 0 when the unfiltered list isn't cached.
 */
export function serverIndex(store: Store, list: RequestKey, todo: ResourceKey): number {
  const order = cachedData(store, keyForRequest(store, { url: buildBaseURL({ resourcePath: 'todo' }) }));
  const position = order.indexOf(todo);
  return cachedData(store, list).filter((key) => order.indexOf(key) < position).length;
}

/** The resource keys in a cached list document, or `[]` if it isn't cached. */
function cachedData(store: Store, list: RequestKey): ResourceKey[] {
  const content = store.cache.peekRequest(list)?.content;
  return content && 'data' in content && Array.isArray(content.data) ? content.data : [];
}
