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
 */
export interface Operation {
  /**
   * The name of the {@link Operation | operation}
   */
  op: string;
}

/**
 * Replaces the state of a relationship on the Graph with a new state.
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

export interface ReplaceRelatedRecordOperation {
  op: 'replaceRelatedRecord';
  record: ResourceKey;
  field: string;
  value: ResourceKey | null; // never null if field is a collection
  prior?: ResourceKey; // if field is a collection, the value we are swapping with
  index?: number; // if field is a collection, the index at which we are replacing a value
}

export interface SortRelatedRecords {
  op: 'sortRelatedRecords';
  record: ResourceKey;
  field: string;
  value: ResourceKey[];
}

export interface ReplaceRelatedRecordsOperation {
  op: 'replaceRelatedRecords';
  record: ResourceKey;
  field: string;
  value: ResourceKey[]; // the records to add. If no prior/index specified all existing should be removed
  prior?: ResourceKey[]; // if this is a "splice" the records we expect to be removed
  index?: number; // if this is a "splice" the index to start from
}

export type RemoteRelationshipOperation =
  | UpdateResourceRelationshipOperation
  | UpdateRelationshipOperation
  | ReplaceRelatedRecordOperation
  | ReplaceRelatedRecordsOperation
  | RemoveResourceOperation
  | AddResourceOperation
  | DeleteRecordOperation
  | SortRelatedRecords;

export type LocalRelationshipOperation =
  | ReplaceRelatedRecordsOperation
  | ReplaceRelatedRecordOperation
  | AddResourceMutation
  | RemoveResourceMutation
  | SortRelatedRecords;
