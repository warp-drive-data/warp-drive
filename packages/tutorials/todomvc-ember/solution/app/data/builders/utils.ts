import { recordIdentifierFor } from '@warp-drive/core';
import type { PersistedResourceKey, RequestKey } from '@warp-drive/core/types/identifier';
import type { RequestInfo } from '@warp-drive/core/types/request';

import type { Todo } from '../schemas/todo.ts';
import type Store from '../store.ts';

export function keyForSavedResource(todo: Todo): PersistedResourceKey<'todo'> {
  const key = recordIdentifierFor(todo);
  if (key.id === null) throw new Error('Expected a saved todo');
  return key as PersistedResourceKey<'todo'>;
}

export function keyForRequest(store: Store, request: RequestInfo): RequestKey {
  const key = store.cacheKeyManager.getOrCreateDocumentIdentifier(request);
  if (!key) throw new Error('Expected a cacheable request');
  return key;
}
