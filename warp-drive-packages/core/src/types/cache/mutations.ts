import type { ResourceKey } from '../identifier.ts';

/**
 * Adds the specified {@link ResourceKey | ResourceKeys} to a relationship's
 * local (uncommitted) state.
 */
export interface AddToResourceRelationshipMutation {
  /**
   * The name of the mutation
   */
  op: 'add';
  /**
   * The cache key for the resource whose relationship is being updated
   */
  record: ResourceKey;
  /**
   * The name of the relationship to add to
   */
  field: string;
  /**
   * The resource(s) to add to the relationship
   */
  value: ResourceKey | ResourceKey[];
  /**
   * The index at which to insert the resource(s), if applicable
   */
  index?: number;
}

/**
 * Removes the specified {@link ResourceKey | ResourceKeys} from a relationship's
 * local (uncommitted) state.
 */
export interface RemoveFromResourceRelationshipMutation {
  /**
   * The name of the mutation
   */
  op: 'remove';
  /**
   * The cache key for the resource whose relationship is being updated
   */
  record: ResourceKey;
  /**
   * The name of the relationship to remove from
   */
  field: string;
  /**
   * The resource(s) to remove from the relationship
   */
  value: ResourceKey | ResourceKey[];
  /**
   * The index to remove the resource(s) from, if applicable
   */
  index?: number;
}

export interface ReplaceRelatedRecordMutation {
  op: 'replaceRelatedRecord';
  record: ResourceKey;
  field: string;
  // never null if field is a collection
  value: ResourceKey | null;
  // if field is a collection,
  //  the value we are swapping with
  prior?: ResourceKey;
  index?: number;
}

export interface ReplaceRelatedRecordsMutation {
  op: 'replaceRelatedRecords';
  record: ResourceKey;
  field: string;
  // the records to add. If no prior/index
  //  specified all existing should be removed
  value: ResourceKey[];
  // if this is a "splice" the
  //  records we expect to be removed
  prior?: ResourceKey[];
  // if this is a "splice" the
  //   index to start from
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
