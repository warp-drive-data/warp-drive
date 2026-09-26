import { assert } from '@warp-drive/core/build-config/macros';

import {
  defineGate,
  defineSignal,
  notifyInternalSignal,
  peekInternalSignal,
  withSignalStore,
} from '../../signals/-private.ts';
import type { NotificationType } from '../../store/-private/managers/notification-manager.ts';
import type { RequestCacheRequestState } from '../../store/-private/network/request-cache.ts';
import type { Store } from '../../store/-private/store-service.ts';
import { getOrSetGlobal } from '../../types/-private.ts';
import type { Cache } from '../../types/cache.ts';
import type { ResourceKey } from '../../types/identifier.ts';
import type { ApiError } from '../../types/spec/error.ts';
import { Type } from '../../types/symbols.ts';
import type { ReactiveResource } from './record.ts';
import { Context } from './symbols.ts';

const ResourceStates = getOrSetGlobal('ResourceStates', new WeakMap<ReactiveResource, ReactiveResourceState>());

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
 * if (user.$state.isSaving) {
 *   // show a spinner
 * }
 * ```
 *
 * Every property is reactive: reading it in a template, component or
 * other reactive context will update when the underlying state changes.
 *
 * `$state` describes the resource in the cache, not a particular view of
 * it, so an immutable resource and its editable checkout report the
 * same state. A resource is only ever materialized once its data is in
 * the cache, so there is no "loading" or "empty" state here: loading is
 * a property of a request, see {@link getRequestState}.
 *
 * @summary The reactive lifecycle state (new, deleted, dirty, saving, invalid, errored) that PolarisMode resources expose as `$state`.
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
   * attributes or relationships have been changed.
   *
   * A new resource that is deleted before it is ever saved, and a
   * resource whose deletion has been committed, are not dirty.
   *
   * @public
   */
  readonly isDirty: boolean;

  /**
   * `true` while a mutation request (e.g. a save or delete issued via
   * `store.request` with this resource in `records`) is in flight.
   *
   * @public
   */
  readonly isSaving: boolean;

  /**
   * `true` if the cache holds no validation errors for this resource.
   *
   * @public
   */
  readonly isValid: boolean;

  /**
   * The validation errors the cache holds for this resource, in
   * JSON:API error format. Each error's `source.pointer` identifies
   * the field it applies to, when present.
   *
   * @public
   */
  readonly errors: ApiError[];

  /**
   * `true` if the most recent mutation request for this resource was
   * rejected with a non-validation error. Reset when a later mutation
   * succeeds or is rejected with validation errors.
   *
   * @public
   */
  readonly isError: boolean;

  /**
   * The error the most recent mutation request for this resource was
   * rejected with, or `null` if it succeeded or was rejected with
   * validation errors (see {@link ReactiveResourceState.errors}).
   *
   * @public
   */
  readonly error: unknown;
}

interface InternalResourceState extends ReactiveResourceState {
  store: Store;
  cache: Cache;
  key: ResourceKey;
  handlers: object[];
  requestHandler: ((req: RequestCacheRequestState) => void) | null;
  isSaving: boolean;
  error: unknown;
}

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

    const handleRequest = (req: RequestCacheRequestState) => {
      if (req.type !== 'mutation') return;
      switch (req.state) {
        case 'pending':
          self.isSaving = true;
          break;
        case 'rejected':
          self.isSaving = false;
          self.error = isValidationError(req) ? null : (req.response?.data ?? null);
          break;
        case 'fulfilled':
          self.isSaving = false;
          self.error = null;
          break;
      }
    };
    self.requestHandler = handleRequest;

    const requests = store.getRequestStateService();
    requests.subscribeForRecord(key, handleRequest);
    // we instantiate lazily, so pick up the outcome of the last completed
    // mutation, and any mutation already in flight
    const lastRequest = requests.getLastRequestForRecord(key);
    if (lastRequest) {
      handleRequest(lastRequest);
    }
    for (const req of requests.getPendingRequestsForRecord(key)) {
      handleRequest(req);
    }

    const onNotification = (_key: ResourceKey, type: NotificationType) => {
      switch (type) {
        case 'state':
          notify(self, 'isNew');
          notify(self, 'isDeleted');
          notify(self, 'isDeletionCommitted');
          notify(self, 'isDirty');
          break;
        case 'attributes':
        case 'relationships':
          notify(self, 'isDirty');
          break;
        case 'errors':
          notify(self, 'errors');
          break;
      }
    };
    // Dirtiness can change on either projection: a local edit changes the local
    // view, while a remote update that matches the local value changes only
    // the remote one. So we listen to both channels.
    self.handlers = [
      store.notifications.subscribe(key, onNotification, 'local'),
      store.notifications.subscribe(key, onNotification, 'remote'),
    ];
  }

  get isValid(): boolean {
    return (this as unknown as InternalResourceState).errors.length === 0;
  }

  get isError(): boolean {
    return (this as unknown as InternalResourceState).error !== null;
  }

  toJSON(): object {
    const self = this as unknown as InternalResourceState;
    return {
      isNew: self.isNew,
      isDeleted: self.isDeleted,
      isDeletionCommitted: self.isDeletionCommitted,
      isDirty: self.isDirty,
      isSaving: self.isSaving,
      isValid: self.isValid,
      isError: self.isError,
    };
  }
}

defineSignal(ResourceState.prototype, 'isSaving', false);
defineSignal(ResourceState.prototype, 'error', null);
defineGate(ResourceState.prototype, 'isNew', {
  get(this: InternalResourceState): boolean {
    return this.cache.isNew(this.key);
  },
});
defineGate(ResourceState.prototype, 'isDeleted', {
  get(this: InternalResourceState): boolean {
    return this.cache.isDeleted(this.key);
  },
});
defineGate(ResourceState.prototype, 'isDeletionCommitted', {
  get(this: InternalResourceState): boolean {
    return this.cache.isDeletionCommitted(this.key);
  },
});
defineGate(ResourceState.prototype, 'isDirty', {
  get(this: InternalResourceState): boolean {
    const { cache, key } = this;
    const isNew = cache.isNew(key);
    const isDeleted = cache.isDeleted(key);
    if (cache.isDeletionCommitted(key) || (isDeleted && isNew)) {
      return false;
    }
    return isDeleted || isNew || cache.hasChangedAttrs(key) || cache.hasChangedRelationships(key);
  },
});
defineGate(ResourceState.prototype, 'errors', {
  get(this: InternalResourceState): ApiError[] {
    return this.cache.getErrors(this.key);
  },
});

function notify(state: InternalResourceState, key: keyof ReactiveResourceState): void {
  const signal = peekInternalSignal(withSignalStore(state), key);
  if (signal) {
    notifyInternalSignal(signal);
  }
}

// A rejection that carried validation errors for the cache is surfaced via
// `errors`/`isValid`, not `error`/`isError`, matching LegacyMode. We inspect
// the rejection itself rather than the cache, because the cache retains
// validation errors from an earlier rejection until they are resolved.
function isValidationError(req: RequestCacheRequestState): boolean {
  const data = req.response?.data as
    | { isAdapterError?: boolean; code?: string; content?: { errors?: unknown } }
    | null
    | undefined;
  if (!data || typeof data !== 'object') {
    return false;
  }
  if (data.isAdapterError === true && data.code === 'InvalidError') {
    return true;
  }
  const errors = data.content?.errors;
  return Array.isArray(errors) && errors.length > 0;
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
  ResourceStates.delete(record);
  for (const handler of state.handlers) {
    state.store.notifications.unsubscribe(handler);
  }
  if (state.requestHandler) {
    state.store.getRequestStateService()._unsubscribeForRecord(state.key, state.requestHandler);
    state.requestHandler = null;
  }
}
