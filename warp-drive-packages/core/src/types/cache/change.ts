// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { Cache } from '../cache.ts';
import type { RequestKey, ResourceKey } from '../identifier.ts';

/**
 * Describes a single mutation to a resource or document that occurred
 * in the cache, as returned by {@link Cache.diff}.
 *
 * @example
 * ```ts
 * const change: Change = {
 *   identifier: resourceKey,
 *   op: 'upsert',
 *   patch: { name: 'Chris' },
 * };
 * ```
 */
export interface Change {
  /**
   * the {@link ResourceKey} or {@link RequestKey} of the entity that changed
   */
  identifier: ResourceKey | RequestKey;
  /**
   * the type of change that occurred. If `'upsert'`, {@link Change.patch | patch}
   * will be present with the data to merge into the cache for the entity.
   */
  op: 'upsert' | 'remove';
  /**
   * When {@link Change.op | op} is `'upsert'`, the data to merge into the
   * cache for the entity.
   *
   * This is opaque to the Store but should be understood by the Cache and
   * may be utilized by an Adapter when generating data during a `save`
   * operation.
   *
   * It is generally recommended that `patch` contain only the updated
   * state, ignoring fields that are unchanged.
   */
  patch?: unknown;
}
