// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { Cache } from '../cache.ts';
import type { ResourceKey } from '../identifier.ts';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { Operation } from './operations.ts';

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
