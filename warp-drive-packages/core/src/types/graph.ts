import type {
  AddToResourceRelationshipMutation as AddResourceMutation,
  RemoveFromResourceRelationshipMutation as RemoveResourceMutation,
} from './cache/mutations.ts';
import type {
  AddToResourceRelationshipOperation as AddResourceOperation,
  RemoveFromResourceRelationshipOperation as RemoveResourceOperation,
  UpdateResourceRelationshipOperation,
} from './cache/operations.ts';
import type { ResourceKey } from './identifier.ts';
import type { CollectionResourceRelationship, SingleResourceRelationship } from './spec/json-api-raw.ts';

/**
 * All Graph operations are objects with at least one property,
 * `op`, which contains a string with the name of the operation
 * to perform.
 *
 * @summary Base shape of every relationship Graph operation, carrying the operation's name in `op`.
 */
export interface Operation {
  /**
   * The name of the {@link Operation | operation}
   */
  op: string;
}

/**
 * Replaces the state of a relationship on the Graph with a new state.
 *
 * @summary Graph operation that replaces a relationship's remote state with a raw JSON:API relationship object.
 */
export interface UpdateRelationshipOperation {
  /**
   * The name of the operation
   */
  op: 'updateRelationship';
  /**
   * The cache key for the resource whose relationship is being updated
   */
  record: ResourceKey;
  /**
   * The name of the relationship to update
   */
  field: string;
  /**
   * The new state for the relationship
   */
  value: SingleResourceRelationship | CollectionResourceRelationship;
}

/**
 * Signals to the Graph that a resource has been deleted, so that
 * it can be removed from any relationships that reference it.
 *
 * @summary Graph operation signaling that a resource was deleted so it is removed from every relationship that
 * references it.
 */
export interface DeleteRecordOperation {
  /**
   * The name of the operation
   */
  op: 'deleteRecord';
  /**
   * The cache key for the resource that was deleted
   */
  record: ResourceKey;
  /**
   * Whether the resource was a client-created resource that had not yet been persisted
   */
  isNew: boolean;
}

/**
 * A placeholder operation for a relationship whose kind (`to-one` vs
 * `to-many`) is not yet known to the Graph.
 *
 * @summary Placeholder Graph operation, with `op: 'never'`, for a relationship whose to-one or to-many kind is not
 * yet known.
 */
export interface UnknownOperation {
  /**
   * The name of the operation
   */
  op: 'never';
  /**
   * The cache key for the resource whose relationship is affected
   */
  record: ResourceKey;
  /**
   * The name of the relationship
   */
  field: string;
}

/**
 * Replaces the state of a `to-one` relationship on the Graph with a new value.
 *
 * @summary Graph operation that sets a to-one relationship's value, or swaps a single member of a to-many.
 */
export interface ReplaceRelatedRecordOperation {
  /**
   * The name of the operation
   */
  op: 'replaceRelatedRecord';
  /**
   * The cache key for the resource whose relationship is being updated
   */
  record: ResourceKey;
  /**
   * The name of the relationship to replace
   */
  field: string;
  /**
   * The new value for the relationship. Never `null` if the field is
   * actually a collection relationship.
   */
  value: ResourceKey | null;
  /**
   * If the field is a collection relationship, the value being swapped out
   */
  prior?: ResourceKey;
  /**
   * If the field is a collection relationship, the index at which the swap occurred
   */
  index?: number;
}

/**
 * Reorders the state of a `to-many` relationship on the Graph.
 *
 * @summary Graph operation that reorders the members of a to-many relationship.
 */
export interface SortRelatedRecords {
  /**
   * The name of the operation
   */
  op: 'sortRelatedRecords';
  /**
   * The cache key for the resource whose relationship is being reordered
   */
  record: ResourceKey;
  /**
   * The name of the relationship to reorder
   */
  field: string;
  /**
   * The relationship's members in their new order
   */
  value: ResourceKey[];
}

/**
 * Replaces the state of a `to-many` relationship on the Graph with a
 * new set of values.
 *
 * @summary Graph operation that replaces or splices the members of a to-many relationship.
 */
export interface ReplaceRelatedRecordsOperation {
  /**
   * The name of the operation
   */
  op: 'replaceRelatedRecords';
  /**
   * The cache key for the resource whose relationship is being updated
   */
  record: ResourceKey;
  /**
   * The name of the relationship to replace
   */
  field: string;
  /**
   * The resources to add. If neither {@link ReplaceRelatedRecordsOperation.prior | prior}
   * nor {@link ReplaceRelatedRecordsOperation.index | index} is specified, all
   * existing members should be removed.
   */
  value: ResourceKey[];
  /**
   * If this is a "splice", the resources expected to be removed
   */
  prior?: ResourceKey[];
  /**
   * If this is a "splice", the index to start from
   */
  index?: number;
}

/**
 * The Graph operations that apply to a relationship's remote
 * (persisted/clean) state.
 *
 * See also:
 * - {@link UpdateResourceRelationshipOperation}
 * - {@link UpdateRelationshipOperation}
 * - {@link ReplaceRelatedRecordOperation}
 * - {@link ReplaceRelatedRecordsOperation}
 * - {@link RemoveResourceOperation}
 * - {@link AddResourceOperation}
 * - {@link DeleteRecordOperation}
 * - {@link SortRelatedRecords}
 *
 * @summary Union of the Graph operations that update a relationship's remote (persisted) state.
 */
export type RemoteRelationshipOperation =
  | UpdateResourceRelationshipOperation
  | UpdateRelationshipOperation
  | ReplaceRelatedRecordOperation
  | ReplaceRelatedRecordsOperation
  | RemoveResourceOperation
  | AddResourceOperation
  | DeleteRecordOperation
  | SortRelatedRecords;

/**
 * The Graph operations that apply to a relationship's local
 * (uncommitted/dirty) state.
 *
 * See also:
 * - {@link ReplaceRelatedRecordsOperation}
 * - {@link ReplaceRelatedRecordOperation}
 * - {@link AddResourceMutation}
 * - {@link RemoveResourceMutation}
 * - {@link SortRelatedRecords}
 *
 * @summary Union of the Graph operations that update a relationship's local (uncommitted) state.
 */
export type LocalRelationshipOperation =
  | ReplaceRelatedRecordsOperation
  | ReplaceRelatedRecordOperation
  | AddResourceMutation
  | RemoveResourceMutation
  | SortRelatedRecords;
