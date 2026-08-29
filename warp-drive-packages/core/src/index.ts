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
import { CacheHandler, type CachePolicy, Store, recordIdentifierFor } from './store/-private.ts';
import type { CacheCapabilitiesManager, ResourceKey } from './types.ts';
import type { Cache } from './types/cache.ts';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { RequestInfo } from './types/request.ts';
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
  NotifyKeys,
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
   * A constructor for the {@link Cache} implementation to use, receiving the
   * store's {@link CacheCapabilitiesManager} when instantiated.
   */
  cache: {
    /**
     * Constructs a new {@link Cache} instance for the store.
     */
    new (capabilities: CacheCapabilitiesManager): T;
  };
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
   *
   * See the "Adding Stateful Handlers" section of {@link useRecommendedStore}
   * for an example of using this callback to construct a handler that needs
   * access to an Ember service.
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

export declare class ConfiguredStore<
  T extends {
    /**
     * The {@link Cache} instance type this configured store's `createCache`
     * method produces.
     */
    cache: Cache;
  },
> extends Store {
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
 *
 * ### Adding Stateful Handlers
 *
 * A request {@link Handler} is sometimes more than a plain object or class with
 * a `request` method — it may need access to a stateful dependency such as an
 * Ember service (an auth token, a feature-flags service, an i18n helper, etc.).
 *
 * A plain class handler that only relies on Ember's `@service` decorator will
 * not work here on its own: the handler is never instantiated *through* Ember's
 * container (it's just `new`'d up), so it has no owner and its `@service`
 * injections would fail to resolve.
 *
 * Instead, give {@link StoreSetupOptions.handlers | handlers} a function. It
 * receives the {@link Store} instance being configured, which by the time the
 * function runs already has an owner assigned. Use `getOwner`/`setOwner` from
 * `@ember/owner` to transfer that owner onto your handler instance before
 * returning it, exactly as you would when constructing any other DI-aware
 * object outside of the container:
 *
 * ```ts
 * import { getOwner, setOwner } from '@ember/owner';
 * import { service } from '@ember/service';
 * import { useRecommendedStore } from '@warp-drive/core';
 * import type { NextFn } from '@warp-drive/core/request';
 * import type { RequestContext } from '@warp-drive/core/types/request';
 * import { JSONAPICache } from '@warp-drive/json-api';
 *
 * class AuthHandler {
 *   @service session;
 *
 *   request<T>(context: RequestContext, next: NextFn<T>) {
 *     const headers = new Headers(context.request.headers);
 *     headers.append('Authorization', `Bearer ${this.session.accessToken}`);
 *     return next(Object.assign({}, context.request, { headers }));
 *   }
 * }
 *
 * export default useRecommendedStore({
 *   cache: JSONAPICache,
 *   handlers: (store) => {
 *     const authHandler = new AuthHandler();
 *     setOwner(authHandler, getOwner(store)!);
 *     return [authHandler];
 *   },
 * });
 * ```
 *
 * The `handlers` function is invoked lazily and only once per store instance,
 * the first time `store.requestManager` is accessed, so it is safe to do
 * owner-dependent setup like this inside of it.
 *
 * ### Accessing the Store from a Handler's Context
 *
 * If a handler only needs to read something *off of the store itself*
 * (its cache, or a property/service you've attached to a custom store
 * subclass) rather than an unrelated Ember service, there is a second,
 * simpler option that requires no DI/`setOwner` wiring at all.
 *
 * Every request issued via {@link Store.request | store.request(...)}
 * automatically carries the originating store along as
 * {@link RequestInfo.store | context.request.store}. Any handler — a plain
 * object, a function-built handler, or a class — can read it directly,
 * without needing the `handlers` callback form shown above:
 *
 * ```ts
 * import { useRecommendedStore } from '@warp-drive/core';
 * import type { NextFn } from '@warp-drive/core/request';
 * import type { RequestContext } from '@warp-drive/core/types/request';
 * import { JSONAPICache } from '@warp-drive/json-api';
 *
 * const LoggingHandler = {
 *   request<T>(context: RequestContext, next: NextFn<T>) {
 *     // only present when the request was made via `store.request(...)`
 *     const store = context.request.store;
 *     if (store) {
 *       console.log(`[${store.constructor.name}] ${context.request.url ?? ''}`);
 *     }
 *     return next(context.request);
 *   },
 * };
 *
 * export default useRecommendedStore({
 *   cache: JSONAPICache,
 *   handlers: [LoggingHandler],
 * });
 * ```
 *
 * The trade-off versus the `getOwner`/`setOwner` pattern above is that
 * `context.request.store` is only populated for requests issued via
 * `store.request(...)`; a request made directly against a
 * {@link RequestManager} won't have it set unless the caller supplies it
 * explicitly, so a handler relying on it should treat it as optional (as
 * `LoggingHandler` does above).
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
  };
}
