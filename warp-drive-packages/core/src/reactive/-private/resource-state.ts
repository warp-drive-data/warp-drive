import { assert } from '@warp-drive/core/build-config/macros';

import {
  consumeInternalSignal,
  getOrCreateInternalSignal,
  notifyInternalSignal,
  peekInternalSignal,
  withSignalStore,
} from '../../signals/-private.ts';
import type { NotificationType } from '../../store/-private/managers/notification-manager.ts';
import type { Store } from '../../store/-private/store-service.ts';
import { getOrSetGlobal } from '../../types/-private.ts';
import type { Cache, RelationshipDiff } from '../../types/cache.ts';
import type { ResourceKey } from '../../types/identifier.ts';
import type { Value } from '../../types/json/raw.ts';
import type { FieldSchema } from '../../types/schema/fields.ts';
import { Type } from '../../types/symbols.ts';
import { getFieldCacheKey, isNonIdentityCacheableField } from './fields/get-field-key.ts';
import type { ReactiveResource } from './record.ts';
import { Context } from './symbols.ts';

const ResourceStates = getOrSetGlobal('ResourceStates', new WeakMap<ReactiveResource, ReactiveResourceState>());

/**
 * The local change to a single non-relationship field of a resource, as
 * reported by {@link ReactiveResourceState.changes}.
 *
 * Values are in the form the cache stores them, before any
 * {@link Transformation} is applied, the same as `cache.changedAttrs`.
 *
 * @public
 */
export interface FieldChange {
  /** identifies this change as a non-relationship field change */
  kind: 'field';
  /** the field's value as last known from the API, or `undefined` if it has none */
  remoteState: Value | undefined;
  /** the field's value including the local (uncommitted) change */
  localState: Value;
}

/**
 * The local change to a single field of a resource: a {@link FieldChange}
 * for a non-relationship field, or a {@link RelationshipDiff} for a
 * relationship.
 *
 * @public
 */
export type ResourceFieldChange = FieldChange | RelationshipDiff;

/**
 * The reactive lifecycle state of a {@link ReactiveResource}, available
 * as `$state` on any resource whose schema was built with
 * {@link withDefaults} (and whose derivations were registered with
 * {@link registerDerivations}).
 *
 * @example
 * ```ts
 * const user = store.peekRecord<User>('user', '1');
 *
 * if (user.$state.isDirty) {
 *   // offer to save or discard
 * }
 *
 * if (user.$state.changes.name) {
 *   // only the name field has local changes
 * }
 * ```
 *
 * Every property is reactive: reading it in a template, component or
 * other reactive context will update when the underlying state changes.
 *
 * `$state` describes the resource in the cache, not a particular view of
 * it, so an immutable resource and its editable checkout report the
 * same state. Request state, such as whether a save is in flight or
 * failed, is a property of the request, see {@link getRequestState}.
 *
 * @summary The reactive lifecycle state (new, empty, deleted, dirty, and per-field changes) that PolarisMode resources expose as `$state`.
 * @public
 */
export interface ReactiveResourceState {
  /**
   * `true` if the resource was created locally and has not yet been
   * successfully persisted, e.g. via `store.createRecord`.
   *
   * @public
   */
  readonly isNew: boolean;

  /**
   * `true` if the cache reports the resource as empty, i.e.
   * `cache.isEmpty` for a resource that is not new. A new resource is
   * never empty.
   *
   * For the JSON:API cache, a resource is empty when it has no field
   * data at all, which a materialized PolarisMode resource typically
   * only reaches when it is removed from the store, e.g. via
   * `store.unloadRecord`, while something still holds a reference to
   * the record.
   *
   * @public
   */
  readonly isEmpty: boolean;

  /**
   * `true` if the resource has been marked for deletion locally.
   *
   * This remains `true` once the deletion has been committed, use
   * {@link ReactiveResourceState.isDeletionCommitted} to distinguish.
   *
   * @public
   */
  readonly isDeleted: boolean;

  /**
   * `true` if a deletion of the resource has been successfully
   * persisted.
   *
   * @public
   */
  readonly isDeletionCommitted: boolean;

  /**
   * `true` if the resource has local changes that have not been
   * persisted: it is new, it is marked for deletion, or any of its
   * fields or relationships have been changed.
   *
   * A new resource that is deleted before it is ever saved, and a
   * resource whose deletion has been committed, are not dirty.
   *
   * @public
   */
  readonly isDirty: boolean;

  /**
   * The local changes to the resource's fields, keyed by field name.
   *
   * Each entry is reactive on its own: reading `changes.name` only
   * updates when `name` changes, not when another field does. Reading
   * the set of keys (e.g. `Object.keys(changes)`) updates when any field
   * changes.
   *
   * A field without local changes has no entry. Only fields the cache
   * stores data for are tracked: identity, `derived`, `alias` and
   * `@local` fields never have an entry.
   *
   * @public
   */
  readonly changes: Readonly<Record<string, ResourceFieldChange | undefined>>;
}

interface InternalResourceState extends ReactiveResourceState {
  store: Store;
  cache: Cache;
  key: ResourceKey;
  handlers: object[];
  changes: Record<string, ResourceFieldChange | undefined>;
  changesTarget: object;
  fields: Map<string, FieldSchema>;
  fieldsByCacheKey: Map<string, string>;
}

/** the signal key, on the changes target, for the set of changed fields */
const ChangedKeys = Symbol('changed-keys');

const RelationshipKinds = new Set(['belongsTo', 'hasMany', 'resource', 'collection']);

// A class is used instead of a closure so that the signals live on
// a stable prototype, the same way the legacy RecordState does.
class ResourceState {
  constructor(record: ReactiveResource) {
    const self = this as unknown as InternalResourceState;
    const store = record[Context].store;
    const key = record[Context].resourceKey;

    self.store = store;
    self.cache = store.cache;
    self.key = key;

    const fields = new Map<string, FieldSchema>();
    const fieldsByCacheKey = new Map<string, string>();
    for (const [name, field] of store.schema.fields(key)) {
      if (!isNonIdentityCacheableField(field)) continue;
      fields.set(name, field);
      fieldsByCacheKey.set(getFieldCacheKey(field) ?? name, name);
    }
    self.fields = fields;
    self.fieldsByCacheKey = fieldsByCacheKey;
    self.changesTarget = Object.create(null) as object;
    self.changes = createChanges(self);

    const onNotification = (_key: ResourceKey, type: NotificationType, cacheKey?: string | string[]) => {
      switch (type) {
        case 'state':
          notify(self, 'isNew');
          notify(self, 'isEmpty');
          notify(self, 'isDeleted');
          notify(self, 'isDeletionCommitted');
          notify(self, 'isDirty');
          // committing or rolling back can change any field
          notifyAllChanges(self);
          break;
        case 'attributes':
          notify(self, 'isEmpty');
          notify(self, 'isDirty');
          notifyChange(self, cacheKey);
          break;
        case 'relationships':
          notify(self, 'isDirty');
          notifyChange(self, cacheKey);
          break;
      }
    };
    // Changes can show up on either projection: a local edit changes the local
    // view, while a remote update that matches a local value resolves that
    // edit while changing only the remote one. So we also listen to the remote
    // channel. Channels only filter attributes and relationships; every other
    // notification already reaches the local subscription. The manager rejects
    // subscribing the same callback twice, so the remote subscription gets its own.
    const onRemoteNotification = (_key: ResourceKey, type: NotificationType, cacheKey?: string | string[]) => {
      if (type === 'attributes' || type === 'relationships') {
        notify(self, 'isDirty');
        notifyChange(self, cacheKey);
      }
    };
    self.handlers = [
      store.notifications.subscribe(key, onNotification, 'local'),
      store.notifications.subscribe(key, onRemoteNotification, 'remote'),
    ];
  }

  toJSON(): object {
    const self = this as unknown as InternalResourceState;
    return {
      isNew: self.isNew,
      isEmpty: self.isEmpty,
      isDeleted: self.isDeleted,
      isDeletionCommitted: self.isDeletionCommitted,
      isDirty: self.isDirty,
      changes: Object.keys(self.changes),
    };
  }
}

defineTrackedGetter('isNew', function (this: InternalResourceState): boolean {
  return this.cache.isNew(this.key);
});
defineTrackedGetter('isEmpty', function (this: InternalResourceState): boolean {
  const { cache, key } = this;
  return !cache.isNew(key) && cache.isEmpty(key);
});
defineTrackedGetter('isDeleted', function (this: InternalResourceState): boolean {
  return this.cache.isDeleted(this.key);
});
defineTrackedGetter('isDeletionCommitted', function (this: InternalResourceState): boolean {
  return this.cache.isDeletionCommitted(this.key);
});
defineTrackedGetter('isDirty', function (this: InternalResourceState): boolean {
  const { cache, key } = this;
  const isNew = cache.isNew(key);
  const isDeleted = cache.isDeleted(key);
  if (cache.isDeletionCommitted(key) || (isDeleted && isNew)) {
    return false;
  }
  return isDeleted || isNew || hasChangedAttrs(cache, key) || cache.hasChangedRelationships(key);
});

// The cache asserts when asked about attribute changes for a resource it
// holds no data for, e.g. once it has been unloaded.
function hasChangedAttrs(cache: Cache, key: ResourceKey): boolean {
  return !cache.isEmpty(key) && cache.hasChangedAttrs(key);
}

/**
 * Defines a reactive getter on the ResourceState prototype.
 *
 * The value is computed fresh from the cache on every read, so a read
 * immediately after a change is correct even though store notifications
 * are delivered in batches. Reading consumes a signal that the
 * notification handlers dirty, so reactive consumers re-read on change.
 */
function defineTrackedGetter(
  key: keyof ReactiveResourceState,
  compute: (this: InternalResourceState) => unknown
): void {
  Object.defineProperty(ResourceState.prototype, key, {
    enumerable: true,
    configurable: false,
    get(this: InternalResourceState) {
      track(this, key);
      return compute.call(this);
    },
  });
}

function createChanges(state: InternalResourceState): Record<string, ResourceFieldChange | undefined> {
  const target = state.changesTarget;
  return new Proxy(target, {
    get(_target, prop) {
      if (typeof prop !== 'string' || !state.fields.has(prop)) {
        return undefined;
      }
      track(target, prop);
      return computeChange(state, prop);
    },
    has(_target, prop) {
      if (typeof prop !== 'string' || !state.fields.has(prop)) {
        return false;
      }
      track(target, prop);
      return computeChange(state, prop) !== undefined;
    },
    ownKeys() {
      track(target, ChangedKeys);
      return computeChangedKeys(state);
    },
    getOwnPropertyDescriptor(_target, prop) {
      if (typeof prop !== 'string' || !state.fields.has(prop)) {
        return undefined;
      }
      track(target, prop);
      const value = computeChange(state, prop);
      return value === undefined ? undefined : { value, writable: false, enumerable: true, configurable: true };
    },
    set(_target, prop) {
      assert(`Cannot set '${String(prop)}' on $state.changes, it is read-only`);
      return false;
    },
    deleteProperty(_target, prop) {
      assert(`Cannot delete '${String(prop)}' on $state.changes, it is read-only`);
      return false;
    },
  }) as Record<string, ResourceFieldChange | undefined>;
}

function computeChange(state: InternalResourceState, name: string): ResourceFieldChange | undefined {
  const field = state.fields.get(name)!;
  const cacheKey = getFieldCacheKey(field) ?? name;
  const { cache, key } = state;
  if (RelationshipKinds.has(field.kind)) {
    return cache.hasChangedRelationships(key) ? cache.changedRelationships(key).get(cacheKey) : undefined;
  }
  if (!hasChangedAttrs(cache, key)) {
    return undefined;
  }
  const change = cache.changedAttrs(key)[cacheKey];
  return change ? { kind: 'field', remoteState: change[0], localState: change[1] } : undefined;
}

function computeChangedKeys(state: InternalResourceState): string[] {
  const { cache, key, fieldsByCacheKey } = state;
  const keys: string[] = [];
  if (hasChangedAttrs(cache, key)) {
    for (const cacheKey of Object.keys(cache.changedAttrs(key))) {
      const name = fieldsByCacheKey.get(cacheKey);
      if (name) keys.push(name);
    }
  }
  if (cache.hasChangedRelationships(key)) {
    for (const cacheKey of cache.changedRelationships(key).keys()) {
      const name = fieldsByCacheKey.get(cacheKey);
      if (name) keys.push(name);
    }
  }
  return keys;
}

/** Consumes the signal for `key` on `obj`, creating it if needed. */
function track(obj: object, key: string | symbol): void {
  consumeInternalSignal(getOrCreateInternalSignal(withSignalStore(obj), obj, key, undefined));
}

function notify(state: InternalResourceState, key: keyof ReactiveResourceState): void {
  const signal = peekInternalSignal(withSignalStore(state), key);
  if (signal) {
    notifyInternalSignal(signal);
  }
}

// A notification's key is the cache key of the field that changed, or a
// path whose first segment is, for a change nested inside a field. With no
// key, any field may have changed.
function notifyChange(state: InternalResourceState, cacheKey: string | string[] | undefined): void {
  const topLevelKey = Array.isArray(cacheKey) ? cacheKey[0] : cacheKey;
  if (topLevelKey === undefined) {
    notifyAllChanges(state);
    return;
  }
  const signals = withSignalStore(state.changesTarget);
  const name = state.fieldsByCacheKey.get(topLevelKey);
  if (name) {
    notifyInternalSignal(peekInternalSignal(signals, name));
  }
  notifyInternalSignal(peekInternalSignal(signals, ChangedKeys));
}

function notifyAllChanges(state: InternalResourceState): void {
  const signals = withSignalStore(state.changesTarget);
  for (const name of state.fields.keys()) {
    notifyInternalSignal(peekInternalSignal(signals, name));
  }
  notifyInternalSignal(peekInternalSignal(signals, ChangedKeys));
}

/**
 * The derivation backing the `$state` field added by {@link withDefaults}.
 *
 * @internal
 */
export function resourceState(record: ReactiveResource): ReactiveResourceState {
  assert(`Cannot compute @state for an embedded object`, record[Context].path === null);
  let state = ResourceStates.get(record);
  if (!state) {
    state = new ResourceState(record) as unknown as ReactiveResourceState;
    ResourceStates.set(record, state);
  }
  return state;
}
resourceState[Type] = '@state';

/**
 * Tears down the `$state` for a record, if one was ever created.
 *
 * @internal
 */
export function destroyResourceState(record: ReactiveResource): void {
  const state = ResourceStates.get(record) as unknown as InternalResourceState | undefined;
  if (!state) return;
  for (const handler of state.handlers) {
    state.store.notifications.unsubscribe(handler);
  }
  state.handlers = [];
  // The record is torn down before the cache releases its data, and nothing
  // will notify us once our subscriptions are gone. So we dirty `isEmpty`
  // now: a UI still holding the record re-reads it once the unload has
  // finished, and learns the record was removed from the store.
  notify(state, 'isEmpty');
}
