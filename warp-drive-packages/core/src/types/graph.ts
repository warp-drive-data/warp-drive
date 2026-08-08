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

export interface Operation {
  op: string;
}

export interface UpdateRelationshipOperation {
  op: 'updateRelationship';
  record: ResourceKey;
  field: string;
  value: SingleResourceRelationship | CollectionResourceRelationship;
}

export interface DeleteRecordOperation {
  op: 'deleteRecord';
  record: ResourceKey;
  isNew: boolean;
}

export interface UnknownOperation {
  op: 'never';
  record: ResourceKey;
  field: string;
}

/**
 * Replaces the state of a `to-one` relationship on the Graph with a new value.
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
 */
export type LocalRelationshipOperation =
  | ReplaceRelatedRecordsOperation
  | ReplaceRelatedRecordOperation
  | AddResourceMutation
  | RemoveResourceMutation
  | SortRelatedRecords;
