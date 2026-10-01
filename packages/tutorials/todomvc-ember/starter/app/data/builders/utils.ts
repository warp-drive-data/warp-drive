import type { ResourceKey } from '@warp-drive/core/types/identifier';
import type { RequestInfo } from '@warp-drive/core/types/request';
import { buildBaseURL } from '@warp-drive/utilities';

import type Store from '../store.ts';

/**
 * Where the server would put `todo` in the cached `list`, or `undefined` (the
 * end) if the unfiltered list isn't cached.
 *
 * The server sorts todos by creation, which is the order of the unfiltered
 * `GET /api/todo` list. The list after the move is that order, keeping only
 * the todos already in `list`, plus `todo`.
 */
export function serverIndex(store: Store, list: RequestInfo, todo: ResourceKey): number | undefined {
  const members = new Set(keysInCachedList(store, list));
  const creationOrder = keysInCachedList(store, { url: buildBaseURL({ resourcePath: 'todo' }) });
  const listAfterMove = creationOrder.filter((key) => key === todo || members.has(key));
  const index = listAfterMove.indexOf(todo);
  return index === -1 ? undefined : index;
}

/** The resource keys in the cached response to `request`, or `[]` if it isn't cached. */
function keysInCachedList(store: Store, request: RequestInfo): ResourceKey[] {
  const key = store.cacheKeyManager.getOrCreateDocumentIdentifier(request);
  const content = key && store.cache.peekRequest(key)?.content;
  return content && 'data' in content && Array.isArray(content.data) ? content.data : [];
}
