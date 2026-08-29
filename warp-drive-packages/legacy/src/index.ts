/**
 * @module
 * @mergeModuleWith <project>
 */

import {
  CacheHandler,
  Fetch,
  recordIdentifierFor,
  RequestManager,
  Store,
  type StoreSetupOptions,
} from '@warp-drive/core';
import { assert } from '@warp-drive/core/build-config/macros';
import { instantiateRecord, registerDerivations, SchemaService, teardownRecord } from '@warp-drive/core/reactive';
import type { Handler } from '@warp-drive/core/request';
import { DefaultCachePolicy } from '@warp-drive/core/store';
import type { CacheCapabilitiesManager, ModelSchema, ResourceKey } from '@warp-drive/core/types';
import type { Cache } from '@warp-drive/core/types/cache';
import type { TypeFromInstance } from '@warp-drive/core/types/record';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { RequestInfo } from '@warp-drive/core/types/request';
import type { ObjectSchema, ResourceSchema } from '@warp-drive/core/types/schema/fields';

import type { MinimumAdapterInterface } from './compat';
import {
  adapterFor,
  cleanup,
  LegacyNetworkHandler,
  normalize,
  pushPayload,
  serializeRecord,
  serializerFor,
} from './compat';
import { EmberArrayLikeExtension, EmberObjectArrayExtension, EmberObjectExtension } from './compat/extensions';
import type Model from './model';
import { instantiateRecord as instantiateModel, modelFor, teardownRecord as teardownModel } from './model';
import { FragmentArrayExtension, FragmentExtension } from './model-fragments';
import { fragmentsModelFor } from './model-fragments/hooks/model-for';
import { DelegatingSchemaService, registerDerivations as registerLegacyDerivations } from './model/migration-support';
import { restoreDeprecatedStoreBehaviors } from './store';

interface _LegacyStoreSetupOptions<T extends Cache> extends Omit<StoreSetupOptions<T>, 'schemas'> {
  /**
   * The {@link ResourceSchema | ResourceSchemas} or {@link ObjectSchema | ObjectSchemas} of entities
   * migrated to no longer use {@link Model}.
   *
   * :::caution
   * {@link Model} is still able to be used directly as a source of schema when using {@link useLegacyStore},
   * however, its reliance on EmberObject, classic computeds and resolver behaviors mean that Model
   * will stop working when these things are deprecated in Ember.
   * :::
   */
  schemas?: Array<ResourceSchema | ObjectSchema>;

  /**
   * Whether to include support for ModelFragments migrations.
   *
   * @default false
   */
  modelFragments?: boolean;
}

/**
 * Setup options for a legacy store configured to use `Model` with `linksMode`
 * enabled, meaning no legacy adapter/serializer request infrastructure is required.
 *
 * @public
 */
export interface LegacyModelStoreSetupOptions<T extends Cache> extends _LegacyStoreSetupOptions<T> {
  /**
   * If true, it is presumed that no requests require use of the LegacyNetworkHandler
   * and associated adapters/serializer methods.
   *
   * If legacyRequests is true, {@link linksMode} must be false
   *
   * @default false
   */
  linksMode: true;
  /**
   * if true, all legacy request methods and supporting infrastructure will
   * be available on the store.
   *
   * If legacyRequests is true, {@link linksMode} must be false
   *
   * @default false
   */
  legacyRequests?: false;
}

/**
 * Setup options for a legacy store configured to use `Model` along with the
 * legacy adapter/serializer network layer, but without the deprecated
 * `store.findRecord`/`findAll`/`query`/etc. request methods.
 *
 * @public
 */
export interface LegacyModelAndNetworkStoreSetupOptions<T extends Cache> extends _LegacyStoreSetupOptions<T> {
  /**
   * If true, it is presumed that no requests require use of the LegacyNetworkHandler
   * and associated adapters/serializer methods.
   *
   * @default false
   */
  linksMode: false;
  /**
   * if true, all legacy request methods and supporting infrastructure will
   * be available on the store.
   *
   * If legacyRequests is true, {@link linksMode} must be false
   *
   * @default false
   */
  legacyRequests?: false;
}

/**
 * Setup options for a legacy store configured to use `Model` along with the
 * legacy adapter/serializer network layer and the deprecated
 * `store.findRecord`/`findAll`/`query`/etc. request methods.
 *
 * @public
 */
export interface LegacyModelAndNetworkAndRequestStoreSetupOptions<T extends Cache> extends _LegacyStoreSetupOptions<T> {
  /**
   * If true, it is presumed that no requests require use of the LegacyNetworkHandler
   * and associated adapters/serializer methods.
   *
   * @default false
   */
  linksMode: false;
  /**
   * if true, all legacy request methods and supporting infrastructure will
   * be available on the store.
   *
   * If legacyRequests is true, {@link linksMode} must be false
   *
   * @default false
   */
  legacyRequests: true;
}

//export type ConfiguredStore<T = unknown> = typeof Store;

/**
 * The available options when setting up the legacy store,
 * one of:
 *
 * - {@link LegacyModelStoreSetupOptions}
 * - {@link LegacyModelAndNetworkStoreSetupOptions}
 * - {@link LegacyModelAndNetworkAndRequestStoreSetupOptions}
 */
export type LegacyStoreSetupOptions<T extends Cache = Cache> =
  | LegacyModelStoreSetupOptions<T>
  | LegacyModelAndNetworkStoreSetupOptions<T>
  | LegacyModelAndNetworkAndRequestStoreSetupOptions<T>;

export declare class ConfiguredStore<
  T extends {
    /**
     * The {@link Cache} implementation this store was configured with.
     */
    cache: Cache;
  },
> extends Store {
  // get cache(): T extends OptionsWithCache<infer R> ? R : never;
  createCache(capabilities: CacheCapabilitiesManager): T['cache'];
}

/**
 * Use the legacy store with the given options.
 *
 * See {@link LegacyStoreSetupOptions} for details on the available options.
 *
 * ```ts
 * import { useLegacyStore } from '@warp-drive/legacy';
 * import { JSONAPICache } from '@warp-drive/json-api';
 *
 * export default useLegacyStore({
 *   linksMode: false,
 *   legacyRequests: true,
 *   cache: JSONAPICache,
 *   schemas: [],
 * });
 * ```
 *
 * ### Adding Stateful Handlers
 *
 * A request {@link Handler} is sometimes more than a plain object or class
 * with a `request` method — it may need access to a stateful dependency such
 * as an Ember service (an auth token, a feature-flags service, an i18n
 * helper, etc.).
 *
 * A plain class handler that only relies on Ember's `@service` decorator will
 * not work here on its own: the handler is never instantiated *through*
 * Ember's container (it's just `new`'d up), so it has no owner and its
 * `@service` injections would fail to resolve.
 *
 * Instead, give `handlers` a function. It receives the {@link Store} instance
 * being configured, which by the time the function runs already has an owner
 * assigned. Use `getOwner`/`setOwner` from `@ember/owner` to transfer that
 * owner onto your handler instance before returning it, exactly as you would
 * when constructing any other DI-aware object outside of the container:
 *
 * ```ts
 * import { getOwner, setOwner } from '@ember/owner';
 * import { service } from '@ember/service';
 * import { useLegacyStore } from '@warp-drive/legacy';
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
 * export default useLegacyStore({
 *   linksMode: false,
 *   legacyRequests: true,
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
 * import { useLegacyStore } from '@warp-drive/legacy';
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
 * export default useLegacyStore({
 *   linksMode: false,
 *   legacyRequests: true,
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
export function useLegacyStore<T extends Cache>(
  options: LegacyModelStoreSetupOptions<T>,
  StoreKlass?: typeof Store
): typeof ConfiguredStore<{ cache: T }>;
export function useLegacyStore<T extends Cache>(
  options: LegacyModelAndNetworkStoreSetupOptions<T>,
  StoreKlass?: typeof Store
): typeof ConfiguredStore<{ cache: T }>;
export function useLegacyStore<T extends Cache>(
  options: LegacyModelAndNetworkAndRequestStoreSetupOptions<T>,
  StoreKlass?: typeof Store
): typeof ConfiguredStore<{ cache: T }>;
export function useLegacyStore<T extends Cache>(
  options: LegacyStoreSetupOptions<T>,
  StoreKlass: typeof Store = Store
): typeof ConfiguredStore<{ cache: T }> {
  assert(`If legacyRequests is true, linksMode must be false`, !(options.linksMode && options.legacyRequests));
  // we extend the store to ensure we don't leak our prototype overrides to other stores below.
  class BaseKlass extends StoreKlass {}
  class LegacyConfiguredStore extends BaseKlass {
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
            const handlersOption = options.handlers;
            const handlers = typeof handlersOption === 'function' ? handlersOption(this) : (handlersOption ?? []);
            requestManager = new RequestManager()
              .use([options.linksMode ? null : LegacyNetworkHandler, ...handlers, Fetch].filter(Boolean) as Handler[])
              .useCache(CacheHandler);
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

    createSchemaService(): DelegatingSchemaService {
      // prepare for PolarisMode
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

      // Add support for LegacyMode ReactiveResource with Maximal coverage
      // for upgrading from 4.x
      registerLegacyDerivations(schema);
      schema.CAUTION_MEGA_DANGER_ZONE_registerExtension(EmberArrayLikeExtension);
      schema.CAUTION_MEGA_DANGER_ZONE_registerExtension(EmberObjectArrayExtension);
      schema.CAUTION_MEGA_DANGER_ZONE_registerExtension(EmberObjectExtension);

      // add support for fragments
      if (options.modelFragments) {
        schema.CAUTION_MEGA_DANGER_ZONE_registerExtension?.(FragmentExtension);
        schema.CAUTION_MEGA_DANGER_ZONE_registerExtension?.(FragmentArrayExtension);
      }

      // Add fallback for Models
      return new DelegatingSchemaService(this, schema);
    }

    createCache(capabilities: CacheCapabilitiesManager) {
      // eslint-disable-next-line new-cap
      return new options.cache(capabilities);
    }

    instantiateRecord(key: ResourceKey, createArgs?: Record<string, unknown>) {
      if (this.schema.isDelegated(key)) {
        return instantiateModel.call(this, key, createArgs);
      }
      return instantiateRecord(this, key, createArgs);
    }

    teardownRecord(record: unknown): void {
      const key = recordIdentifierFor(record);
      if (this.schema.isDelegated(key)) {
        return teardownModel.call(this, record as Model);
      }
      return teardownRecord(record);
    }

    modelFor<InstanceType>(type: TypeFromInstance<InstanceType>): ModelSchema<InstanceType>;
    modelFor(type: string): ModelSchema;
    modelFor(type: string): ModelSchema {
      assertType(this.schema, type);

      const klass =
        // prefer real models if present
        (modelFor.call(this, type) as ModelSchema) ||
        // fallback to ShimModelClass specific to fragments if fragments support in use
        (options.modelFragments ? (fragmentsModelFor.call(this, type) as ModelSchema) : false) ||
        // fallback to ShimModelClass
        super.modelFor(type);

      return klass;
    }

    adapterFor(this: Store, modelName: string): MinimumAdapterInterface;
    adapterFor(this: Store, modelName: string, _allowMissing: true): MinimumAdapterInterface | undefined;
    adapterFor(this: Store, modelName: string, _allowMissing?: true): MinimumAdapterInterface | undefined {
      assert(
        `useLegacyStore was setup in linksMode. linksMode assumes that all requests have been migrated away from adapters and serializers.`,
        !options.linksMode
      );
      // @ts-expect-error
      return adapterFor.call(this, modelName, _allowMissing);
    }

    serializerFor(this: Store, ...args: Parameters<typeof serializerFor>): ReturnType<typeof serializerFor> {
      assert(
        `useLegacyStore was setup in linksMode. linksMode assumes that all requests have been migrated away from adapters and serializers.`,
        !options.linksMode
      );
      return serializerFor.call(this, ...args);
    }

    pushPayload(this: Store, ...args: Parameters<typeof pushPayload>): ReturnType<typeof pushPayload> {
      assert(
        `useLegacyStore was setup in linksMode. linksMode assumes that all requests have been migrated away from adapters and serializers.`,
        !options.linksMode
      );
      return pushPayload.call(this, ...args);
    }

    normalize(this: Store, ...args: Parameters<typeof normalize>): ReturnType<typeof normalize> {
      assert(
        `useLegacyStore was setup in linksMode. linksMode assumes that all requests have been migrated away from adapters and serializers.`,
        !options.linksMode
      );
      return normalize.call(this, ...args);
    }

    serializeRecord(this: Store, ...args: Parameters<typeof serializeRecord>): ReturnType<typeof serializeRecord> {
      assert(
        `useLegacyStore was setup in linksMode. linksMode assumes that all requests have been migrated away from adapters and serializers.`,
        !options.linksMode
      );
      return serializeRecord.call(this, ...args);
    }

    destroy() {
      if (!options.linksMode) {
        cleanup.call(this);
      }
      super.destroy();
    }
  }

  if (options.legacyRequests) {
    restoreDeprecatedStoreBehaviors(BaseKlass);
  }

  return LegacyConfiguredStore;
}

function assertType(schema: DelegatingSchemaService, type: string) {
  assert(`Expected type ${type} to be a valid ResourceType`, schema.hasResource({ type }));
}
