import type { ResourceKey } from '../identifier.ts';

export interface AddToResourceRelationshipMutation {
  op: 'add';
  record: ResourceKey;
  field: string;
  value: ResourceKey | ResourceKey[];
  index?: number;
}

export interface RemoveFromResourceRelationshipMutation {
  op: 'remove';
  record: ResourceKey;
  field: string;
  value: ResourceKey | ResourceKey[];
  index?: number;
}

/**
 * Replaces the local (uncommitted) state of a `to-one` relationship
 * with a new value.
 */
export interface ReplaceRelatedRecordMutation {
  /**
   * The name of the mutation
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
 * Replaces the local (uncommitted) state of a `to-many` relationship
 * with a new set of values.
 */
export interface ReplaceRelatedRecordsMutation {
  /**
   * The name of the mutation
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
   * The resources to add. If neither {@link ReplaceRelatedRecordsMutation.prior | prior}
   * nor {@link ReplaceRelatedRecordsMutation.index | index} is specified, all
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

export interface SortRelatedRecordsMutation {
  op: 'sortRelatedRecords';
  record: ResourceKey;
  field: string;
  value: ResourceKey[];
}
// A Mutation is an action that updates
// the local state of the Cache in some
// manner.
// Most Mutations are in theory also
// Operations; with the difference being
// that the change should be applied as
// "local" or "dirty" state instead of
// as "remote" or "clean" state.
//
// Note: this RFC does not publicly surface
// any of the mutations listed here as
// "operations", though the (private) Graph
// already expects and utilizes these.
// and we look forward to an RFC that makes
// the Graph a fully public API.
export type Mutation =
  | ReplaceRelatedRecordsMutation
  | ReplaceRelatedRecordMutation
  | RemoveFromResourceRelationshipMutation
  | AddToResourceRelationshipMutation
  | SortRelatedRecordsMutation;
