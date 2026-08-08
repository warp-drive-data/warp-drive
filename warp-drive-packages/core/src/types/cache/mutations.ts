// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { Cache } from '../cache.ts';
import type { ResourceKey } from '../identifier.ts';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { Operation } from './operations.ts';

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

/**
 * Reorders the local (uncommitted) state of a `to-many` relationship.
 */
export interface SortRelatedRecordsMutation {
  /**
   * The name of the mutation
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
 * A `Mutation` is an action that updates the local (uncommitted or "dirty")
 * state of the {@link Cache} in some manner.
 *
 * Most Mutations are in theory also {@link Operation | Operations}; the
 * difference is that the change should be applied as local/dirty state
 * instead of as remote/clean state.
 *
 * Mutations are applied via {@link Cache.mutate}.
 *
 * See also:
 * - {@link ReplaceRelatedRecordsMutation}
 * - {@link ReplaceRelatedRecordMutation}
 * - {@link RemoveFromResourceRelationshipMutation}
 * - {@link AddToResourceRelationshipMutation}
 * - {@link SortRelatedRecordsMutation}
 *
 * @privateRemarks
 * Note: this RFC does not publicly surface any of the mutations listed
 * here as "operations", though the (private) Graph already expects and
 * utilizes these, and we look forward to an RFC that makes the Graph a
 * fully public API.
 */
export type Mutation =
  | ReplaceRelatedRecordsMutation
  | ReplaceRelatedRecordMutation
  | RemoveFromResourceRelationshipMutation
  | AddToResourceRelationshipMutation
  | SortRelatedRecordsMutation;
