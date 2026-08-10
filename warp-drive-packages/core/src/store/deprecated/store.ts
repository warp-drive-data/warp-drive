import { deprecate } from '@ember/debug';

import { ENABLE_LEGACY_REQUEST_METHODS } from '@warp-drive/build-config/deprecations';
import { assert } from '@warp-drive/build-config/macros';

import type { ResourceKey } from '../../types/identifier';
import type { OpaqueRecordInstance, TypedRecordInstance, TypeFromInstance } from '../../types/record';
import { SkipCache } from '../../types/request';
import type { ResourceIdentifierObject } from '../../types/spec/json-api-raw';
import type { LegacyLiveArray, LegacyQueryArray } from '../-private';
import { constructResource, ensureStringId, recordIdentifierFor, storeFor } from '../-private';
import type { Caches } from '../-private/caches/instance-cache';
import { isMaybeIdentifier, Store } from '../-private/store-service';
import { normalizeModelName } from '../-private/utils/normalize-model-name';
import type { FindAllOptions, FindRecordOptions, LegacyResourceQuery, ModelSchema, QueryOptions } from './-private';
import { getShimClass, preloadData, RecordReference, resourceIsFullyDeleted } from './-private';

if (ENABLE_LEGACY_REQUEST_METHODS) {
  Store.prototype.findRecord = function (
    resource: string | ResourceIdentifierObject,
    id?: string | number | FindRecordOptions,
    options?: FindRecordOptions
  ): Promise<unknown> {
    deprecate(`store.findRecord is deprecated. Use store.request instead.`, false, {
      id: 'warp-drive:deprecate-legacy-request-methods',
      until: '6.0',
      for: '@warp-drive/core',
      url: 'https://docs.warp-drive.io/api/@warp-drive/core/build-config/deprecations/variables/ENABLE_LEGACY_REQUEST_METHODS',
      since: {
        enabled: '5.7',
        available: '5.7',
      },
    });
    assert(
      `Attempted to call store.findRecord(), but the store instance has already been destroyed.`,
      !(this.isDestroying || this.isDestroyed)
    );

    assert(
      `You need to pass a modelName or resource identifier as the first argument to the store's findRecord method`,
      resource
    );
    if (isMaybeIdentifier(resource)) {
      options = id as FindRecordOptions | undefined;
    } else {
      assert(
        `Passing classes to store methods has been removed. Please pass a dasherized string instead of ${resource}`,
        typeof resource === 'string'
      );
      const type = normalizeModelName(resource);
      const normalizedId = ensureStringId(id as string | number);
      resource = constructResource(type, normalizedId);
    }

    const identifier = this.cacheKeyManager.getOrCreateRecordIdentifier(resource);
    options = options || {};

    if (options.preload) {
      // force reload if we preload to ensure we don't resolve the promise
      // until we are complete, else we will end up background-reloading
      // even for initial load.
      if (!this._instanceCache.recordIsLoaded(identifier)) {
        options.reload = true;
      }
      this._join(() => {
        preloadData(this, identifier, options.preload!);
      });
    }

    const promise = this.request<OpaqueRecordInstance>({
      op: 'findRecord',
      data: {
        record: identifier,
        options,
      },
      cacheOptions: { [SkipCache]: true },
    });

    return promise.then((document) => {
      return document.content;
    });
  };

  Store.prototype.findAll = function <T>(
    type: TypeFromInstance<T> | string,
    options: FindAllOptions = {}
  ): Promise<LegacyLiveArray<T>> {
    deprecate(`store.findAll is deprecated. Use store.request instead.`, false, {
      id: 'warp-drive:deprecate-legacy-request-methods',
      until: '6.0',
      for: '@warp-drive/core',
      url: 'https://docs.warp-drive.io/api/@warp-drive/core/build-config/deprecations/variables/ENABLE_LEGACY_REQUEST_METHODS',
      since: {
        enabled: '5.7',
        available: '5.7',
      },
    });
    assert(
      `Attempted to call store.findAll(), but the store instance has already been destroyed.`,
      !(this.isDestroying || this.isDestroyed)
    );
    assert(`You need to pass a model name to the store's findAll method`, type);
    assert(
      `Passing classes to store methods has been removed. Please pass a dasherized string instead of ${type}`,
      typeof type === 'string'
    );

    const promise = this.request<LegacyLiveArray<T>>({
      op: 'findAll',
      data: {
        type: normalizeModelName(type),
        options: options || {},
      },
      cacheOptions: { [SkipCache]: true },
    });

    return promise.then((document) => document.content);
  };

  Store.prototype.query = function (
    type: string,
    query: LegacyResourceQuery,
    options: QueryOptions = {}
  ): Promise<LegacyQueryArray> {
    deprecate(`store.query is deprecated. Use store.request instead.`, false, {
      id: 'warp-drive:deprecate-legacy-request-methods',
      until: '6.0',
      for: '@warp-drive/core',
      url: 'https://docs.warp-drive.io/api/@warp-drive/core/build-config/deprecations/variables/ENABLE_LEGACY_REQUEST_METHODS',
      since: {
        enabled: '5.7',
        available: '5.7',
      },
    });
    assert(
      `Attempted to call store.query(), but the store instance has already been destroyed.`,
      !(this.isDestroying || this.isDestroyed)
    );
    assert(`You need to pass a model name to the store's query method`, type);
    assert(`You need to pass a query hash to the store's query method`, query);
    assert(
      `Passing classes to store methods has been removed. Please pass a dasherized string instead of ${type}`,
      typeof type === 'string'
    );

    const promise = this.request<LegacyQueryArray>({
      op: 'query',
      data: {
        type: normalizeModelName(type),
        query,
        options: options,
      },
      cacheOptions: { [SkipCache]: true },
    });

    return promise.then((document) => document.content);
  };

  Store.prototype.queryRecord = function (
    type: string,
    query: Record<string, unknown>,
    options?: QueryOptions
  ): Promise<OpaqueRecordInstance | null> {
    deprecate(`store.queryRecord is deprecated. Use store.request instead.`, false, {
      id: 'warp-drive:deprecate-legacy-request-methods',
      until: '6.0',
      for: '@warp-drive/core',
      url: 'https://docs.warp-drive.io/api/@warp-drive/core/build-config/deprecations/variables/ENABLE_LEGACY_REQUEST_METHODS',
      since: {
        enabled: '5.7',
        available: '5.7',
      },
    });
    assert(
      `Attempted to call store.queryRecord(), but the store instance has already been destroyed.`,
      !(this.isDestroying || this.isDestroyed)
    );
    assert(`You need to pass a model name to the store's queryRecord method`, type);
    assert(`You need to pass a query hash to the store's queryRecord method`, query);
    assert(
      `Passing classes to store methods has been removed. Please pass a dasherized string instead of ${type}`,
      typeof type === 'string'
    );

    const promise = this.request<OpaqueRecordInstance | null>({
      op: 'queryRecord',
      data: {
        type: normalizeModelName(type),
        query,
        options: options || {},
      },
      cacheOptions: { [SkipCache]: true },
    });

    return promise.then((document) => document.content);
  };

  Store.prototype.getReference = function (
    resource: string | ResourceIdentifierObject,
    id: string | number
  ): RecordReference {
    deprecate(
      `store.getReference is deprecated. There is no direct replacement. For working with the cache and relationships, use the cache with the appropriate identifiers. To load, use store.request.`,
      false,
      {
        id: 'warp-drive:deprecate-legacy-request-methods',
        until: '6.0',
        for: '@warp-drive/core',
        url: 'https://docs.warp-drive.io/api/@warp-drive/core/build-config/deprecations/variables/ENABLE_LEGACY_REQUEST_METHODS',
        since: {
          enabled: '5.7',
          available: '5.7',
        },
      }
    );
    assert(
      `Attempted to call store.getReference(), but the store instance has already been destroyed.`,
      !(this.isDestroying || this.isDestroyed)
    );

    let resourceIdentifier: ResourceIdentifierObject;
    if (arguments.length === 1 && isMaybeIdentifier(resource)) {
      resourceIdentifier = resource;
    } else {
      const type = normalizeModelName(resource as string);
      const normalizedId = ensureStringId(id);
      resourceIdentifier = constructResource(type, normalizedId);
    }

    assert(
      'getReference expected to receive either a resource identifier or type and id as arguments',
      isMaybeIdentifier(resourceIdentifier)
    );

    const identifier: ResourceKey = this.cacheKeyManager.getOrCreateRecordIdentifier(resourceIdentifier);

    const cache = upgradeInstanceCaches(this._instanceCache.__instances).reference;
    let reference = cache.get(identifier);

    if (!reference) {
      reference = new RecordReference(this, identifier);
      cache.set(identifier, reference);
    }
    return reference;
  };

  Store.prototype.modelFor = function <T>(
    type: T extends TypedRecordInstance ? TypeFromInstance<T> : string
  ): ModelSchema<T> {
    deprecate(
      `store.modelFor is deprecated, please use store.schema.fields({ type: '${type}' }) to access schema information instead.`,
      false,
      {
        id: 'warp-drive:deprecate-legacy-request-methods',
        until: '6.0',
        for: '@warp-drive/core',
        url: 'https://docs.warp-drive.io/api/@warp-drive/core/build-config/deprecations/variables/ENABLE_LEGACY_REQUEST_METHODS',
        since: {
          enabled: '5.7',
          available: '5.7',
        },
      }
    );
    assert(`Attempted to call store.modelFor(), but the store instance has already been destroyed.`, !this.isDestroyed);
    assert(`You need to pass <type> to the store's modelFor method`, typeof type === 'string' && type.length);
    assert(`No model was found for '${type}' and no schema handles the type`, this.schema.hasResource({ type }));

    return getShimClass<T>(this, type);
  };

  Store.prototype.saveRecord = function <T>(record: T, options: Record<string, unknown> = {}): Promise<T> {
    deprecate(`store.saveRecord is deprecated, please use store.request to initiate a save request instead.`, false, {
      id: 'warp-drive:deprecate-legacy-request-methods',
      until: '6.0',
      for: '@warp-drive/core',
      url: 'https://docs.warp-drive.io/api/@warp-drive/core/build-config/deprecations/variables/ENABLE_LEGACY_REQUEST_METHODS',
      since: {
        enabled: '5.7',
        available: '5.7',
      },
    });
    assert(
      `Attempted to call store.saveRecord(), but the store instance has already been destroyed.`,
      !(this.isDestroying || this.isDestroyed)
    );
    assert(`Unable to initiate save for a record in a disconnected state`, storeFor(record, true));
    const identifier = recordIdentifierFor(record);
    const cache = this.cache;

    if (!identifier) {
      // this commonly means we're disconnected
      // but just in case we reject here to prevent bad things.
      return Promise.reject(new Error(`Record Is Disconnected`));
    }
    assert(
      `Cannot initiate a save request for an unloaded record: ${identifier.lid}`,
      this._instanceCache.recordIsLoaded(identifier)
    );
    if (resourceIsFullyDeleted(this._instanceCache, identifier)) {
      return Promise.resolve(record);
    }

    if (!options) {
      options = {};
    }
    let operation: 'createRecord' | 'deleteRecord' | 'updateRecord' = 'updateRecord';

    if (cache.isNew(identifier)) {
      operation = 'createRecord';
    } else if (cache.isDeleted(identifier)) {
      operation = 'deleteRecord';
    }

    const request = {
      op: operation,
      data: {
        options,
        record: identifier,
      },
      records: [identifier],
      cacheOptions: { [SkipCache]: true },
    };

    return this.request<T>(request).then((document) => document.content);
  };
}

export { Store };

function upgradeInstanceCaches(cache: Caches): Caches & { reference: WeakMap<ResourceKey, RecordReference> } {
  const withReferences = cache as Caches & { reference: WeakMap<ResourceKey, RecordReference> };
  if (!withReferences.reference) {
    withReferences.reference = new WeakMap();
  }

  return withReferences;
}
