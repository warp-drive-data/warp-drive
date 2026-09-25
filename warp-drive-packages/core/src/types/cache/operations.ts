/**
 * {@link Cache} Operations perform updates to the
 * Cache's "remote" (or clean) state to reflect external
 * changes.
 *
 * Usually operations represent the result of a {@link WebSocket} or
 * {@link EventSource | ServerEvent} message, though they can also be used to carefully
 * patch the state of the cache with information known by the
 * application or developer.
 *
 * Operations are applied via {@link Cache.patch}.
 *
 * See also {@link Mutation}, which applies analogous updates to the
 * Cache's "local" (or dirty) state.
 *
 * @summary Types for the operations passed to `cache.patch` to update the cache's remote (clean) state, such as
 * from WebSocket or server-sent event messages.
 * @module
 */
// oxlint-disable-next-line no-unused-vars
import type { Cache } from '../cache.ts';
import type { PersistedResourceKey, RequestKey, ResourceKey } from '../identifier.ts';
import type { Value } from '../json/raw.ts';
import type { ExistingResourceObject } from '../spec/json-api-raw.ts';
import type { Relationship } from './relationship.ts';

/**
 * All operations are objects with at least one property,
 * `op` which contains a string with the name of the operation
 * to perform.
 *
 * @summary Base shape of every cache operation, carrying the operation's name in `op`.
 */
export interface Op {
  /**
   * The name of the {@link Op | operation}
   */
  op: string;
}

/**
 * Occasionally the Store discovers that two previously
 * thought to be distinct resources refer to the same resource.
 *
 * This operation will be performed, giving the Cache the chance
 * to cleanup and merge internal state as desired when this discovery
 * is made.
 *
 * @summary Cache operation telling the Cache that two resource keys refer to the same resource, so it can merge the
 * stale one into the kept one.
 */
export interface MergeOperation extends Op {
  op: 'mergeIdentifiers';
  /**
   * The stale {@link ResourceKey | ResourceKey} that
   * the cache should eliminate in favor of {@link MergeOperation.value | value}
   */
  record: ResourceKey;
  /**
   * The kept {@link ResourceKey | ResourceKey} that
   * the cache should also keep and merge {@link MergeOperation.record | record} into.
   */
  value: ResourceKey;
}

/**
 * Removes a document and its associated request from
 * the cache.
 *
 * @summary Cache operation passed to `cache.patch` that removes a request's document from the cache.
 */
export interface RemoveDocumentOperation extends Op {
  op: 'remove';
  /**
   * The cache key for the request
   */
  record: RequestKey;
}

/**
 * Removes a resource from the cache. This is treated
 * as if a remote deletion has occurred, and all references
 * to the resource should be eliminated.
 *
 * @summary Cache operation passed to `cache.patch` that removes a resource as if deleted remotely, eliminating all
 * references to it.
 */
export interface RemoveResourceOperation extends Op {
  op: 'remove';
  /**
   * The cache key for the resource
   */
  record: PersistedResourceKey;
}

/**
 * Adds a resource to the cache.
 *
 * @summary Cache operation passed to `cache.patch` that adds a persisted resource's data to the cache's remote
 * state.
 */
export interface AddResourceOperation extends Op {
  op: 'add';
  /**
   * The cache key for the resource
   */
  record: PersistedResourceKey;
  /**
   * The data for the resource
   */
  value: ExistingResourceObject;
}
/**
 * Upserts (merges) new state for a resource
 *
 * @summary Cache operation passed to `cache.patch` that merges new remote state into a persisted resource.
 */
export interface UpdateResourceOperation extends Op {
  op: 'update';
  /**
   * The cache key for the resource
   */
  record: PersistedResourceKey;
  /**
   * The new state to merge into the resource
   */
  value: ExistingResourceObject;
}
/**
 * Replaces the state of a field with a new state
 *
 * @summary Cache operation passed to `cache.patch` that replaces the remote value of a single field on a persisted
 * resource.
 */
export interface UpdateResourceFieldOperation extends Op {
  op: 'update';
  /**
   * The cache key for the resource
   */
  record: PersistedResourceKey;
  /**
   * The name of the field to update
   */
  field: string;
  /**
   * The new value for the field
   */
  value: Value;
}
/**
 * Replaces the state of a relationship with a new state
 *
 * @summary Cache operation that replaces the remote state of one relationship on a persisted resource.
 */
export interface UpdateResourceRelationshipOperation extends Op {
  op: 'update';
  /**
   * The cache key for the resource
   */
  record: PersistedResourceKey;
  /**
   * The name of the relationship to update
   */
  field: string;
  /**
   * The new state for the relationship
   */
  value: Relationship<PersistedResourceKey>;
}

/**
 * Adds a resource to a request document, optionally
 * at a specific index. This can be used to update the
 * result of a request.
 *
 * @summary Cache operation passed to `cache.patch` that adds resources to a request document's `data` or
 * `included`, optionally at an index.
 */
export interface AddToDocumentOperation extends Op {
  op: 'add';
  /**
   * The cache key for the request document
   */
  record: RequestKey;
  /**
   * Which member of the document to add to
   */
  field: 'data' | 'included';
  /**
   * The resource(s) to add
   */
  value: PersistedResourceKey | PersistedResourceKey[];
  /**
   * The index at which to insert the resource(s), if applicable
   */
  index?: number;
}
/**
 * Adds the specified ResourceKeys to a relationship
 *
 * @summary Cache operation passed to `cache.patch` that adds resources to a relationship's remote state,
 * optionally at an index.
 */
export interface AddToResourceRelationshipOperation extends Op {
  op: 'add';
  /**
   * The cache key for the resource whose relationship is being updated
   */
  record: PersistedResourceKey;
  /**
   * The name of the relationship to add to
   */
  field: string;
  /**
   * The resource(s) to add to the relationship
   */
  value: PersistedResourceKey | PersistedResourceKey[];
  /**
   * The index at which to insert the resource(s), if applicable
   */
  index?: number;
}
/**
 * Removes the specified ResourceKeys from a relationship
 *
 * @summary Cache operation passed to `cache.patch` that removes resources from a relationship's remote state.
 */
export interface RemoveFromResourceRelationshipOperation extends Op {
  op: 'remove';
  /**
   * The cache key for the resource whose relationship is being updated
   */
  record: PersistedResourceKey;
  /**
   * The name of the relationship to remove from
   */
  field: string;
  /**
   * The resource(s) to remove from the relationship
   */
  value: PersistedResourceKey | PersistedResourceKey[];
  /**
   * The index to remove the resource(s) from, if applicable
   */
  index?: number;
}
/**
 * Removes a resource from a request document, optionally
 * at a specific index. This can be used to update the
 * result of a request.
 *
 * @summary Cache operation passed to `cache.patch` that removes resources from a request document's `data` or
 * `included`.
 */
export interface RemoveFromDocumentOperation extends Op {
  op: 'remove';
  /**
   * The cache key for the request document
   */
  record: RequestKey;
  /**
   * Which member of the document to remove from
   */
  field: 'data' | 'included';
  /**
   * The resource(s) to remove
   */
  value: PersistedResourceKey | PersistedResourceKey[];
  /**
   * The index to remove the resource(s) from, if applicable
   */
  index?: number;
}

/**
 * {@link Cache} Operations perform updates to the
 * Cache's "remote" (or clean) state to reflect external
 * changes.
 *
 * Usually operations represent the result of a {@link WebSocket} or
 * {@link EventSource | ServerEvent} message, though they can also be used to carefully
 * patch the state of the cache with information known by the
 * application or developer.
 *
 * Operations are applied via {@link Cache.patch}.
 *
 * See also:
 * - {@link MergeOperation}
 * - {@link RemoveResourceOperation}
 * - {@link RemoveDocumentOperation}
 * - {@link AddResourceOperation}
 * - {@link UpdateResourceOperation}
 * - {@link UpdateResourceFieldOperation}
 * - {@link AddToResourceRelationshipOperation}
 * - {@link RemoveFromResourceRelationshipOperation}
 * - {@link AddToDocumentOperation}
 * - {@link RemoveFromDocumentOperation}
 *
 * @summary Union of the updates `cache.patch` applies to the cache's remote (clean) state, typically from server
 * pushes such as WebSocket or SSE messages.
 */
export type Operation =
  | MergeOperation
  | RemoveResourceOperation
  | RemoveDocumentOperation
  | AddResourceOperation
  | UpdateResourceOperation
  | UpdateResourceFieldOperation
  | AddToResourceRelationshipOperation
  | RemoveFromResourceRelationshipOperation
  | AddToDocumentOperation
  | RemoveFromDocumentOperation;
