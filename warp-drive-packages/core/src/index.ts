/**
 * @module
 * @mergeModuleWith <project>
 */

import { TESTING } from '@warp-drive/build-config/env';

import type { CAUTION_MEGA_DANGER_ZONE_Extension } from './reactive.ts';
import { instantiateRecord, registerDerivations, SchemaService, teardownRecord } from './reactive.ts';
import type { ReactiveDocument } from './reactive/-private/document.ts';
import type { Handler } from './request.ts';
import { Fetch } from './request/-private/fetch.ts';
import { RequestManager } from './request/-private/manager.ts';
import { DefaultCachePolicy } from './store.ts';
import { CacheHandler, type CachePolicy, Store } from './store/-private.ts';
import { recordIdentifierFor } from './store/-private.ts';
import type { CacheCapabilitiesManager, ResourceKey } from './types.ts';
import type { Cache } from './types/cache.ts';
import { getRuntimeConfig, setIsMaybeMirage, setLogging } from './types/runtime.ts';
import type { Derivation, HashFn, Transformation } from './types/schema/concepts.ts';
import type { ObjectSchema, PolarisResourceSchema, Trait } from './types/schema/fields.ts';

export { recordIdentifierFor, recordIdentifierFor as cacheKeyFor };

export { Fetch, RequestManager };

if (TESTING) {
  // @ts-expect-error adding to globalThis
  globalThis.setWarpDriveLogging = setLogging;

  // @ts-expect-error adding to globalThis
  globalThis.getWarpDriveRuntimeConfig = getRuntimeConfig;
}

// Mirage (or another Pretender-based fetch mock) may be used outside of a
// `TESTING` build (e.g. `ember serve` in dev mode), so this override is
// exposed unconditionally rather than gated to the `TESTING` env.
// @ts-expect-error adding to globalThis
globalThis.setWarpDriveIsMaybeMirage = setIsMaybeMirage;

export { Store, CacheHandler, type CachePolicy };

export { type StoreRequestContext, type StoreRequestInput, storeFor } from './store/-private.ts';

/**
 * @deprecated use {@link ReactiveDocument} instead
 */
export type Document<T> = ReactiveDocument<T>;

export type {
  DocumentCacheOperation,
  CacheOperation,
  NotificationType,
} from './store/-private/managers/notification-manager.ts';

export {
  setIdentifierGenerationMethod,
  setIdentifierUpdateMethod,
  setIdentifierForgetMethod,
  setIdentifierResetMethod,
  setKeyInfoForResource,
} from './store/-private/managers/cache-key-manager.ts';

/**
 * Options for setting up a Store instance with `useRecommendedStore`.
 */
export interface StoreSetupOptions<T extends Cache = Cache> {
  /**
   * The Cache implementation to use
   */
  cache: new (capabilities: CacheCapabilitiesManager) => T;
  /**
   * The Cache policy to use.
   *
   * Defaults to {@link DefaultCachePolicy} configured to
   * respect `Expires`, `X-WarpDrive-Expires`, and `Cache-Control` headers
   * with a fallback to 30s soft expiration and 15m hard expiration.
   */
  policy?: CachePolicy;
  /**
   * The request handlers to use. {@link Fetch} will automatically
   * be added to the end of the handler chain and {@link CacheHandler}
   * will automatically be added as the cache handler.
   *
   * May also be given as a function that receives the {@link Store} instance
   * and returns the handlers to use. This is useful when a handler needs
   * access to the store (e.g. to look up its owner for injections) or when
   * the set of handlers should be decided lazily (e.g. based on a feature
   * flag service that may not be ready until after the store is constructed).
   *
   * The function is invoked lazily, the first time the store's `requestManager`
   * is accessed, and only once per store instance.
   */
  handlers?: Handler[] | ((store: Store) => Handler[]);
  /**
   * Schemas describing the structure of your resource data.
   *
   * See {@link PolarisResourceSchema,} and {@link ObjectSchema} for more information.
   */
  schemas?: Array<PolarisResourceSchema | ObjectSchema>;
  /**
   * {@link Trait | Traits} to use with {@link PolarisResourceSchema, | Resource Schemas}
   */
  traits?: Trait[];
  /**
   * {@link Derivation | Derivations} to use for derived fields.
   */
  derivations?: Derivation[];
  /**
   * {@link Transformation | Transformations} to use for transforming fields.
   */
  transformations?: Transformation[];
  /**
   * {@link HashFn | Hash Functions} to use for embedded object identity and polymorphic type calculations
   */
  hashFns?: HashFn[];
  /**
   * {@link CAUTION_MEGA_DANGER_ZONE_Extension | Extensions} to use with resources, objects and arrays
   * to provide custom behaviors and capabilities that are not described by Schema.
   *
   * This feature should only be used during a transition period to support migrating towards
   * schemas from existing Model and ModelFragments implementations.
   */
  CAUTION_MEGA_DANGER_ZONE_extensions?: CAUTION_MEGA_DANGER_ZONE_Extension[];
}

export declare class ConfiguredStore<T extends { cache: Cache }> extends Store {
  // get cache(): T extends OptionsWithCache<infer R> ? R : never;
  createCache(capabilities: CacheCapabilitiesManager): T['cache'];
}

/**
 * Creates a configured Store class with recommended defaults
 * for schema handling, reactivity, caching, and request management.
 *
 * ```ts
 * import { useRecommendedStore } from '@warp-drive/core';
 * import { JSONAPICache } from '@warp-drive/json-api';
 *
 * export const Store = useRecommendedStore({
 *   cache: JSONAPICache,
 *   schemas: [],
 * });
 * ```
 */
export function useRecommendedStore<T extends Cache>(
  options: StoreSetupOptions<T>,
  StoreKlass: typeof Store = Store
): typeof ConfiguredStore<{ cache: T }> {
  return class AppStore extends StoreKlass {
    constructor(createArgs?: unknown) {
      super(createArgs);
      // installed via defineProperty (rather than a class field/accessor) so that
      // this lazy override of the inherited `requestManager` field does not
      // conflict with the documented pattern of assigning it directly on
      // consumer-authored Store subclasses. The setter preserves the ability
      // to replace `requestManager` outright after construction.
      let requestManager: RequestManager | undefined;
      Object.defineProperty(this, 'requestManager', {
        configurable: true,
        enumerable: true,
        get: (): RequestManager => {
          if (!requestManager) {
            const handlers = typeof options.handlers === 'function' ? options.handlers(this) : (options.handlers ?? []);
            requestManager = new RequestManager().use([...handlers, Fetch]).useCache(CacheHandler);
          }
          return requestManager;
        },
        set: (value: RequestManager): void => {
          requestManager = value;
        },
      });
    }

    lifetimes =
      options.policy ??
      new DefaultCachePolicy({
        apiCacheHardExpires: 15 * 60 * 1000, // 15 minutes
        apiCacheSoftExpires: 1 * 30 * 1000, // 30 seconds
        constraints: {
          headers: {
            'X-WarpDrive-Expires': true,
            'Cache-Control': true,
            Expires: true,
          },
        },
      });

    createSchemaService() {
      const schema = new SchemaService();
      registerDerivations(schema);
      if (options.schemas) schema.registerResources(options.schemas);

      if (options.traits) {
        for (const trait of options.traits) {
          schema.registerTrait(trait);
        }
      }

      if (options.derivations) {
        for (const derivation of options.derivations) {
          schema.registerDerivation(derivation);
        }
      }

      if (options.transformations) {
        for (const transformation of options.transformations) {
          schema.registerTransformation(transformation);
        }
      }

      if (options.hashFns) {
        for (const hashFn of options.hashFns) {
          schema.registerHashFn(hashFn);
        }
      }

      if (options.CAUTION_MEGA_DANGER_ZONE_extensions) {
        for (const extension of options.CAUTION_MEGA_DANGER_ZONE_extensions) {
          schema.CAUTION_MEGA_DANGER_ZONE_registerExtension(extension);
        }
      }

      return schema;
    }

    createCache(capabilities: CacheCapabilitiesManager) {
      // eslint-disable-next-line new-cap
      return new options.cache(capabilities);
    }

    instantiateRecord(key: ResourceKey, createArgs?: Record<string, unknown>) {
      return instantiateRecord(this, key, createArgs);
    }

    teardownRecord(record: unknown): void {
      return teardownRecord(record);
    }
  } as typeof ConfiguredStore;
}
