import { assert } from '@warp-drive/core/build-config/macros';
import {
  assertPrivateStore,
  ensureStringId,
  type InstanceCache,
  recordIdentifierFor,
} from '@warp-drive/core/store/-private';
import { getOrSetGlobal } from '@warp-drive/core/types/-private';
import type { Cache } from '@warp-drive/core/types/cache';
import type { NewResourceKey, ResourceKey } from '@warp-drive/core/types/identifier';
import type { Value } from '@warp-drive/core/types/json/raw';
import type { OpaqueRecordInstance, TypedRecordInstance, TypeFromInstance } from '@warp-drive/core/types/record';
import type {
  LegacyAttributeField,
  LegacyRelationshipField,
  LegacyRelationshipField as RelationshipSchema,
} from '@warp-drive/core/types/schema/fields';
import type {
  ExistingResourceIdentifierObject,
  ExistingResourceObject,
  InnerRelationshipDocument,
} from '@warp-drive/core/types/spec/json-api-raw';

import type { Store } from '../store.ts';

/*
    When a find request is triggered on the store, the user can optionally pass in
    attributes and relationships to be preloaded. These are meant to behave as if they
    came back from the server, except the user obtained them out of band and is informing
    the store of their existence. The most common use case is for supporting client side
    nested URLs, such as `/posts/1/comments/2` so the user can do
    `store.findRecord('comment', 2, { preload: { post: 1 } })` without having to fetch the post.

    Preloaded data can be attributes and relationships passed in either as IDs or as actual
    models.
  */
type PreloadRelationshipValue = OpaqueRecordInstance | string;
export function preloadData(store: Store, identifier: NewResourceKey, preload: Record<string, Value>): void {
  const jsonPayload: Partial<ExistingResourceObject> = {};
  //TODO(Igor) consider the polymorphic case
  const schemas = store.schema;
  const fields = schemas.fields(identifier);
  Object.keys(preload).forEach((key) => {
    const preloadValue = preload[key];

    const field = fields.get(key);
    if (field && (field.kind === 'hasMany' || field.kind === 'belongsTo')) {
      if (!jsonPayload.relationships) {
        jsonPayload.relationships = {};
      }
      jsonPayload.relationships[key] = preloadRelationship(field, preloadValue);
    } else {
      if (!jsonPayload.attributes) {
        jsonPayload.attributes = {};
      }
      jsonPayload.attributes[key] = preloadValue;
    }
  });
  const cache = store.cache;
  assertPrivateStore(store);
  const hasRecord = Boolean(store._instanceCache.peek(identifier));
  cache.upsert(identifier, jsonPayload, hasRecord);
}

function preloadRelationship(
  schema: RelationshipSchema,
  preloadValue: PreloadRelationshipValue | null | Array<PreloadRelationshipValue>
): InnerRelationshipDocument<ExistingResourceIdentifierObject> {
  const relatedType = schema.type;

  if (schema.kind === 'hasMany') {
    assert('You need to pass in an array to set a hasMany property on a record', Array.isArray(preloadValue));
    return { data: preloadValue.map((value) => _convertPreloadRelationshipToJSON(value, relatedType)) };
  }

  assert('You should not pass in an array to set a belongsTo property on a record', !Array.isArray(preloadValue));
  return { data: preloadValue ? _convertPreloadRelationshipToJSON(preloadValue, relatedType) : null };
}

/*
  findRecord('user', '1', { preload: { friends: ['1'] }});
  findRecord('user', '1', { preload: { friends: [record] }});
*/
function _convertPreloadRelationshipToJSON(
  value: OpaqueRecordInstance | string,
  type: string
): ExistingResourceIdentifierObject {
  if (typeof value === 'string' || typeof value === 'number') {
    return { type, id: ensureStringId(value) };
  }
  // TODO if not a record instance assert it's an identifier
  // and allow identifiers to be used
  return recordIdentifierFor(value) as ExistingResourceIdentifierObject;
}

export interface BaseFinderOptions {
  reload?: boolean;
  backgroundReload?: boolean;
  include?: string | string[];
  adapterOptions?: Record<string, unknown>;
}
export interface FindRecordOptions extends BaseFinderOptions {
  /**
   * Data to preload into the store before the request is made.
   * This feature is *highly* discouraged and has no corresponding
   * feature when using builders and handlers.
   *
   * Excepting relationships: the data should be in the form of a
   * JSON object where the keys are fields on the record and the value
   * is the raw value to be added to the cache.
   *
   * Relationships can either be provided as string IDs from which
   * an identifier will be built base upon the relationship's expected
   * resource type, or be record instances from which the identifier
   * will be extracted.
   *
   */
  preload?: Record<string, Value>;
}

export type QueryOptions = {
  [K in string | 'adapterOptions']?: K extends 'adapterOptions' ? Record<string, unknown> : unknown;
};

export type FindAllOptions = BaseFinderOptions;
export type LegacyResourceQuery = {
  include?: string | string[];
  [key: string]: Value | undefined;
};

export type KeyOrString<T> = keyof T & string extends never ? string : keyof T & string;

/**
 * Minimum subset of static schema methods and properties on the
 * "model" class.
 *
 * Only used when using the legacy schema-service implementation
 * for @ember-data/model or when wrapping schema for legacy
 * Adapters/Serializers.
 *
 */
export interface ModelSchema<T = unknown> {
  modelName: T extends TypedRecordInstance ? TypeFromInstance<T> : string;
  fields: Map<KeyOrString<T>, 'attribute' | 'belongsTo' | 'hasMany'>;
  attributes: Map<KeyOrString<T>, LegacyAttributeField>;
  relationshipsByName: Map<KeyOrString<T>, LegacyRelationshipField>;
  eachAttribute<K extends KeyOrString<T>>(
    callback: (this: ModelSchema<T>, key: K, attribute: LegacyAttributeField) => void,
    binding?: T
  ): void;
  eachRelationship<K extends KeyOrString<T>>(
    callback: (this: ModelSchema<T>, key: K, relationship: LegacyRelationshipField) => void,
    binding?: T
  ): void;
  eachTransformedAttribute<K extends KeyOrString<T>>(
    callback: (this: ModelSchema<T>, key: K, type: string | null) => void,
    binding?: T
  ): void;
}

function _resourceIsFullDeleted(identifier: ResourceKey, cache: Cache): boolean {
  return cache.isDeletionCommitted(identifier) || (cache.isNew(identifier) && cache.isDeleted(identifier));
}

export function resourceIsFullyDeleted(instanceCache: InstanceCache, identifier: ResourceKey): boolean {
  const cache = instanceCache.cache;
  return !cache || _resourceIsFullDeleted(identifier, cache);
}

// if modelFor turns out to be a bottleneck we should replace with a Map
// and clear it during store teardown.
const AvailableShims = getOrSetGlobal('AvailableShims', new WeakMap<Store, Record<string, ShimModelClass>>());

export function getShimClass<T>(
  store: Store,
  modelName: T extends TypedRecordInstance ? TypeFromInstance<T> : string
): ShimModelClass<T> {
  let shims = AvailableShims.get(store);

  if (!shims) {
    shims = Object.create(null) as Record<string, ShimModelClass>;
    AvailableShims.set(store, shims);
  }

  let shim = shims[modelName];
  if (shim === undefined) {
    shim = shims[modelName] = new ShimModelClass<unknown>(store, modelName);
  }

  return shim;
}

// Mimics the static apis of @ember-data/model
export class ShimModelClass<T = unknown> implements ModelSchema<T> {
  declare __store: Store;
  declare modelName: T extends TypedRecordInstance ? TypeFromInstance<T> : string;
  constructor(store: Store, modelName: T extends TypedRecordInstance ? TypeFromInstance<T> : string) {
    this.__store = store;
    this.modelName = modelName;
  }

  get fields(): Map<KeyOrString<T>, 'attribute' | 'belongsTo' | 'hasMany'> {
    const fields = new Map<KeyOrString<T>, 'attribute' | 'belongsTo' | 'hasMany'>();
    const fieldSchemas = this.__store.schema.fields({ type: this.modelName });

    fieldSchemas.forEach((schema, key) => {
      if (schema.kind === 'attribute' || schema.kind === 'belongsTo' || schema.kind === 'hasMany') {
        fields.set(key as KeyOrString<T>, schema.kind);
      }
    });

    return fields;
  }

  get attributes(): Map<KeyOrString<T>, LegacyAttributeField> {
    const attrs = new Map<KeyOrString<T>, LegacyAttributeField>();
    const fields = this.__store.schema.fields({ type: this.modelName });

    fields.forEach((schema, key) => {
      if (schema.kind === 'attribute') {
        attrs.set(key as KeyOrString<T>, schema);
      }
    });

    return attrs;
  }

  get relationshipsByName(): Map<KeyOrString<T>, LegacyRelationshipField> {
    const rels = new Map<KeyOrString<T>, LegacyRelationshipField>();
    const fields = this.__store.schema.fields({ type: this.modelName });

    fields.forEach((schema, key) => {
      if (schema.kind === 'belongsTo' || schema.kind === 'hasMany') {
        rels.set(key as KeyOrString<T>, schema);
      }
    });

    return rels;
  }

  eachAttribute<K extends KeyOrString<T>>(
    callback: (key: K, attribute: LegacyAttributeField) => void,
    binding?: T
  ): void {
    this.__store.schema.fields({ type: this.modelName }).forEach((schema, key) => {
      if (schema.kind === 'attribute') {
        callback.call(binding, key as K, schema);
      }
    });
  }

  eachRelationship<K extends KeyOrString<T>>(
    callback: (key: K, relationship: LegacyRelationshipField) => void,
    binding?: T
  ): void {
    this.__store.schema.fields({ type: this.modelName }).forEach((schema, key) => {
      if (schema.kind === 'belongsTo' || schema.kind === 'hasMany') {
        callback.call(binding, key as K, schema);
      }
    });
  }

  eachTransformedAttribute<K extends KeyOrString<T>>(
    callback: (key: K, type: string | null) => void,
    binding?: T
  ): void {
    this.__store.schema.fields({ type: this.modelName }).forEach((schema, key) => {
      if (schema.kind === 'attribute') {
        const type = schema.type;
        if (type) callback.call(binding, key as K, type);
      }
    });
  }
}
