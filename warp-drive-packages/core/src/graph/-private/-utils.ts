import { warn } from '@ember/debug';

import { JSON_API_CACHE_VALIDATION_ERRORS } from '@warp-drive/core/build-config/canary-features';
import { LOG_GRAPH } from '@warp-drive/core/build-config/debugging';
import { assert } from '@warp-drive/core/build-config/macros';

import type { Store } from '../../store/-private.ts';
import type { CacheCapabilitiesManager } from '../../types.ts';
import type { UpdateResourceRelationshipOperation } from '../../types/cache/operations.ts';
import type { UpdateRelationshipOperation } from '../../types/graph.ts';
import type { ResourceKey } from '../../types/identifier.ts';
import type { ResourceIdentifierObject } from '../../types/spec/json-api-raw.ts';
import type { UpgradedMeta } from './-edge-definition.ts';
import { coerceId } from './coerce-id.ts';
import type { CollectionEdge } from './edges/collection.ts';
import type { ImplicitEdge } from './edges/implicit.ts';
import type { ResourceEdge } from './edges/resource.ts';
import type { Graph, GraphEdge } from './graph.ts';

/** Retrieves the private {@link Store} instance from a capabilities manager (or any object exposing `_store`). */
export function getStore(wrapper: CacheCapabilitiesManager | { _store: Store }): Store {
  assert(`expected a private _store property`, '_store' in wrapper);
  return wrapper._store;
}

/** Reads a value from a two-level keyed cache, without creating the first-level entry if it is missing. */
export function expandingGet<T>(cache: Record<string, Record<string, T>>, key1: string, key2: string): T | undefined {
  const mainCache = (cache[key1] = cache[key1] || Object.create(null));
  return mainCache[key2];
}

/** Writes a value into a two-level keyed cache, lazily creating the first-level entry if it does not yet exist. */
export function expandingSet<T>(cache: Record<string, Record<string, T>>, key1: string, key2: string, value: T): void {
  const mainCache = (cache[key1] = cache[key1] || Object.create(null));
  mainCache[key2] = value;
}

/**
 * Asserts (dev-only) that a relationship update operation's payload is well-formed for the
 * relationship's kind (`belongsTo` vs `hasMany`), warning or asserting on common payload mistakes
 * such as a missing `data` alongside `links`, or `data` of the wrong shape.
 */
export function assertValidRelationshipPayload(
  graph: Graph,
  op: UpdateRelationshipOperation | UpdateResourceRelationshipOperation
): void {
  const relationship = graph.get(op.record, op.field);
  assert(`Cannot update an implicit relationship`, isHasMany(relationship) || isBelongsTo(relationship));
  const payload = op.value;
  const { definition, identifier, state } = relationship;
  const { type } = identifier;
  const { field } = op;
  const { isAsync, kind } = definition;

  if (payload.links) {
    // once JSON_API_CACHE_VALIDATION_ERRORS is active, this warning is instead
    // the responsibility of the new document validator (see validateResourceRelationships
    // in warp-drive-packages/json-api/src/-private/validator/1.1/7.2_resource-objects.ts)
    if (!JSON_API_CACHE_VALIDATION_ERRORS) {
      warn(
        `You pushed a record of type '${type}' with a relationship '${field}' configured as 'async: false'. You've included a link but no primary data, this may be an error in your payload. WarpDrive will treat this relationship as known-to-be-empty.`,
        isAsync || payload.data === null || !!payload.data || state.hasReceivedData,
        {
          id: 'ds.store.push-link-for-sync-relationship',
        }
      );
    }
  } else if (payload.data) {
    if (kind === 'belongsTo') {
      assert(
        `A ${type} record was pushed into the store with the value of ${field} being ${inspect(
          payload.data
        )}, but ${field} is a belongsTo relationship so the value must not be an array. You should probably check your data payload or serializer.`,
        !Array.isArray(payload.data)
      );
      assertRelationshipData(getStore(graph.store), identifier, payload.data, definition);
    } else if (kind === 'hasMany') {
      assert(
        `A ${type} record was pushed into the store with the value of ${field} being '${inspect(
          payload.data
        )}', but ${field} is a hasMany relationship so the value must be an array. You should probably check your data payload or serializer.`,
        Array.isArray(payload.data)
      );
      if (Array.isArray(payload.data)) {
        for (let i = 0; i < payload.data.length; i++) {
          assertRelationshipData(getStore(graph.store), identifier, payload.data[i], definition);
        }
      }
    }
  }
}

function inspect(value: unknown) {
  const type = typeof value;
  if (value === null) {
    return 'null';
  }
  if (type !== 'object') {
    return type;
  }
  if (Array.isArray(value)) {
    return 'Array';
  }
  if (value instanceof Date) {
    return 'Date';
  }
  if (value instanceof RegExp) {
    return 'RegExp';
  }
  if (value instanceof Map) {
    return 'Map';
  }
  if (value instanceof Set) {
    return 'Set';
  }
  return 'object';
}

/** Returns whether the given resource is new, i.e. it has no `id` or is flagged as new by the cache. */
export function checkIfNew(store: Store, resourceKey: ResourceKey): boolean {
  if (!resourceKey.id) {
    return true;
  }
  return store.cache.isNew(resourceKey);
}

/** A type-guard returning whether the given edge is a `belongsTo` {@link ResourceEdge}. */
export function isBelongsTo(relationship: GraphEdge): relationship is ResourceEdge {
  return relationship.definition.kind === 'belongsTo';
}

/** A type-guard returning whether the given edge is an {@link ImplicitEdge}. */
export function isImplicit(relationship: GraphEdge): relationship is ImplicitEdge {
  return relationship.definition.isImplicit;
}

/** A type-guard returning whether the given edge is a `hasMany` {@link CollectionEdge}. */
export function isHasMany(relationship: GraphEdge): relationship is CollectionEdge {
  return relationship.definition.kind === 'hasMany';
}

/** Invokes `cb` for every resource identifier currently related through `rel`, covering both local and remote membership regardless of the edge's kind. */
export function forAllRelatedIdentifiers(rel: GraphEdge, cb: (resourceKey: ResourceKey) => void): void {
  if (isBelongsTo(rel)) {
    if (rel.remoteState) {
      cb(rel.remoteState);
    }
    if (rel.localState && rel.localState !== rel.remoteState) {
      cb(rel.localState);
    }
  } else if (isHasMany(rel)) {
    // TODO
    // rel.remoteMembers.forEach(cb);
    // might be simpler if performance is not a concern
    for (let i = 0; i < rel.remoteState.length; i++) {
      const inverseIdentifier = rel.remoteState[i];
      cb(inverseIdentifier);
    }
    rel.additions?.forEach(cb);
  } else {
    rel.localMembers.forEach(cb);
    rel.remoteMembers.forEach((inverseIdentifier) => {
      if (!rel.localMembers.has(inverseIdentifier)) {
        cb(inverseIdentifier);
      }
    });
  }
}

/**
 * Removes the given identifier from BOTH remote AND local state.
 *
 * This method is useful when either a deletion or a rollback on a new record
 * needs to entirely purge itself from an inverse relationship.
 */
export function removeIdentifierCompletelyFromRelationship(
  graph: Graph,
  relationship: GraphEdge,
  value: ResourceKey,
  silenceNotifications?: boolean
): void {
  if (isBelongsTo(relationship)) {
    if (relationship.remoteState === value) {
      relationship.remoteState = null;
    }

    if (relationship.localState === value) {
      relationship.localState = null;
      // This allows dematerialized inverses to be rematerialized
      // we shouldn't be notifying here though, figure out where
      // a notification was missed elsewhere.
      if (!silenceNotifications) {
        notifyChange(graph, relationship);
      }
    }
  } else if (isHasMany(relationship)) {
    relationship.remoteMembers.delete(value);
    relationship.additions?.delete(value);
    const wasInRemovals = relationship.removals?.delete(value);

    const canonicalIndex = relationship.remoteState.indexOf(value);
    if (canonicalIndex !== -1) {
      relationship.remoteState.splice(canonicalIndex, 1);
    }

    if (!wasInRemovals) {
      const currentIndex = relationship.localState?.indexOf(value);
      if (currentIndex !== -1 && currentIndex !== undefined) {
        relationship.localState!.splice(currentIndex, 1);
        // This allows dematerialized inverses to be rematerialized
        // we shouldn't be notifying here though, figure out where
        // a notification was missed elsewhere.
        if (!silenceNotifications) {
          notifyChange(graph, relationship);
        }
      }
    }
  } else {
    relationship.remoteMembers.delete(value);
    relationship.localMembers.delete(value);
  }
}

/** Notifies the store that a relationship has changed, provided the relationship has been accessed and is not currently being removed. */
export function notifyChange(graph: Graph, relationship: CollectionEdge | ResourceEdge): void {
  if (!relationship.accessed) {
    return;
  }

  const resourceKey = relationship.identifier;
  const key = relationship.definition.key;

  if (resourceKey === graph._removing) {
    if (LOG_GRAPH) {
      console.log(`Graph: ignoring relationship change for removed identifier ${String(resourceKey)} ${key}`);
    }
    return;
  }
  if (LOG_GRAPH) {
    console.log(`Graph: notifying relationship change for ${String(resourceKey)} ${key}`);
  }

  graph.store.notifyChange(resourceKey, 'relationships', key);
}

/**
 * Asserts (dev-only) that a pushed relationship data payload conforms to the JSON:API resource
 * identifier shape (correct `type`/`id`, correct array-ness for the relationship's kind) and
 * references a resource type known to the schema.
 */
export function assertRelationshipData(
  store: Store,
  resourceKey: ResourceKey,
  data: ResourceIdentifierObject,
  meta: UpgradedMeta
): void {
  assert(
    `A ${resourceKey.type} record was pushed into the store with the value of ${meta.key} being '${JSON.stringify(
      data
    )}', but ${
      meta.key
    } is a belongsTo relationship so the value must not be an array. You should probably check your data payload or serializer.`,
    !Array.isArray(data)
  );
  assert(
    `Encountered a relationship identifier without a type for the ${meta.kind} relationship '${meta.key}' on <${
      resourceKey.type
    }:${String(resourceKey.id)}>, expected an identifier with type '${meta.type}' but found\n\n'${JSON.stringify(
      data,
      null,
      2
    )}'\n\nPlease check your serializer and make sure it is serializing the relationship payload into a JSON API format.`,
    data === null || ('type' in data && typeof data.type === 'string' && data.type.length)
  );
  assert(
    `Encountered a relationship identifier without an id for the ${meta.kind} relationship '${meta.key}' on <${
      resourceKey.type
    }:${String(resourceKey.id)}>, expected an identifier but found\n\n'${JSON.stringify(
      data,
      null,
      2
    )}'\n\nPlease check your serializer and make sure it is serializing the relationship payload into a JSON API format.`,
    data === null || !!coerceId(data.id)
  );
  if (data?.type === meta.type) {
    assert(
      `Missing Schema: Encountered a relationship identifier { type: '${data.type}', id: '${String(
        data.id
      )}' } for the '${resourceKey.type}.${meta.key}' ${meta.kind} relationship on <${resourceKey.type}:${String(
        resourceKey.id
      )}>, but no schema exists for that type.`,
      store.schema.hasResource(data)
    );
  } else {
    assert(
      `Missing Schema: Encountered a relationship identifier with type '${data.type}' for the ${
        meta.kind
      } relationship '${meta.key}' on <${resourceKey.type}:${String(
        resourceKey.id
      )}>, Expected an identifier with type '${meta.type}'. No schema was found for '${data.type}'.`,
      data === null || !data.type || store.schema.hasResource(data)
    );
  }
}
