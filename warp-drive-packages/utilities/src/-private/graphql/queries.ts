import type { Store } from '@warp-drive/core';
import { recordIdentifierFor } from '@warp-drive/core';
import type { GraphqlVariables } from '@warp-drive/core/types/graphql-request';
import type { PersistedResourceKey, RequestKey, ResourceKey } from '@warp-drive/core/types/identifier';
import type { RequestInfo } from '@warp-drive/core/types/request';

/**
 * The queries that were made, by store and operation: the cache key of each, and the variables it
 * was made with. The cache cannot list the documents it holds, and updating "every cached variant of a
 * list" needs to know them.
 */
const QUERIES = new WeakMap<object, Map<string, Map<string, GraphqlVariables>>>();

/**
 * Remembers a query that was made, so a list it fetched can be updated later by {@link addToQueries}
 * and {@link removeFromQueries}.
 */
export function recordQuery(store: object, operationName: string, key: string, variables: GraphqlVariables): void {
  let operations = QUERIES.get(store);
  if (!operations) {
    operations = new Map();
    QUERIES.set(store, operations);
  }
  let keys = operations.get(operationName);
  if (!keys) {
    keys = new Map();
    operations.set(operationName, keys);
  }
  keys.set(key, variables);
}

export interface QueryListOptions {
  /**
   * Which of the queries of the operation to update, by the variables they were made with. All of
   * them are updated when it is not given.
   */
  where?: (variables: GraphqlVariables) => boolean;
  /**
   * The position to add at. The record is added at the end when it is not given.
   */
  index?: number;
}

function persisted(record: object): PersistedResourceKey {
  const identifier = recordIdentifierFor(record);
  if (identifier.id === null) {
    throw new Error(`Cannot update a list with a record that has no id. Save ${identifier.type} first.`);
  }
  return identifier as PersistedResourceKey;
}

function update(
  store: Store,
  operationName: string,
  record: object,
  options: QueryListOptions,
  op: 'add' | 'remove'
): void {
  const identifier = persisted(record);
  const keys = QUERIES.get(store)?.get(operationName);
  if (!keys) {
    return;
  }

  for (const [key, variables] of [...keys]) {
    if (options.where && !options.where(variables)) {
      continue;
    }

    const requestKey: RequestKey = store.cacheKeyManager.getOrCreateDocumentIdentifier({
      url: key,
      cacheOptions: { key },
    } as RequestInfo)!;
    const document = store.cache.peek(requestKey);

    if (!document) {
      // the document is no longer in the cache
      keys.delete(key);
      continue;
    }

    // only a list can be updated: a document with a single resource has nothing to add to or remove from
    const data = 'data' in document ? document.data : null;
    if (!Array.isArray(data)) {
      continue;
    }

    const has = data.some((member: ResourceKey) => member.lid === identifier.lid);
    if (op === 'add' && !has) {
      store.cache.patch({ op: 'add', record: requestKey, field: 'data', value: identifier, index: options.index });
    } else if (op === 'remove' && has) {
      store.cache.patch({ op: 'remove', record: requestKey, field: 'data', value: identifier });
    }
  }
}

/**
 * Adds a record to the lists that the queries of an operation fetched, in every query that is in the
 * cache, or in the ones the `where` option picks by their variables. Use it after a mutation created a
 * record, so the lists that should show it do.
 *
 * ```ts
 * import { addToQueries } from '@warp-drive/utilities/graphql';
 *
 * // the new project belongs in the lists of open projects, not in the closed ones
 * addToQueries(store, 'GetProjects', project, { where: (variables) => variables.status === 'open' });
 * ```
 *
 * A record that is already in a list is not added again, and a query whose document has a single
 * resource is left as it is.
 */
export function addToQueries(
  store: Store,
  operationName: string,
  record: object,
  options: QueryListOptions = {}
): void {
  update(store, operationName, record, options, 'add');
}

/**
 * Removes a record from the lists that the queries of an operation fetched. It is the opposite of
 * {@link addToQueries}, and takes the same `where` option.
 */
export function removeFromQueries(
  store: Store,
  operationName: string,
  record: object,
  options: Omit<QueryListOptions, 'index'> = {}
): void {
  update(store, operationName, record, options, 'remove');
}
