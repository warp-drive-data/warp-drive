/**
 * @module
 * @summary The `ResourceBlob` type for opaque raw resource data whose format the Cache defines.
 */

// oxlint-disable-next-line no-unused-vars
import type { CacheKeyManager } from '../../store/-private/managers/cache-key-manager.ts';
// oxlint-disable-next-line no-unused-vars
import type { Cache } from '../cache.ts';
// oxlint-disable-next-line no-unused-vars
import type { ResourceKey } from '../identifier.ts';

/**
 * The `ResourceBlob` is an opaque type that must satisfy two constraints.
 *
 * 1. it should be possible for the {@link CacheKeyManager} to be able to
 *    generate a {@link ResourceKey} for it, whether by default or due to
 *    configuration.
 * 2. it should be in a format expected by the {@link Cache}. This format
 *    is {@link Cache}-declared.
 *
 * This opaqueness allows arbitrary storage of any serializable/transferable
 * state, including such things as `Buffer`s and `String`s.
 *
 * @summary Opaque raw resource data whose format the Cache defines and from which the CacheKeyManager can derive a
 * `ResourceKey`.
 */
export type ResourceBlob = unknown;
