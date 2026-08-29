import { LOG_METRIC_COUNTS, LOG_NOTIFICATIONS } from '@warp-drive/core/build-config/debugging';
import { assert } from '@warp-drive/core/build-config/macros';

import { willSyncFlushWatchers } from '../../../signals/-private.ts';
import type { RequestKey, ResourceKey } from '../../../types/identifier.ts';
import { log } from '../debug/utils.ts';
import type { Store } from '../store-service.ts';
import { isRequestKey, isResourceKey } from './cache-key-manager.ts';

export type UnsubscribeToken = object;

/**
 * The kinds of change notifications the {@link NotificationManager} can emit for a resource.
 */
export type CacheOperation = 'added' | 'removed' | 'updated' | 'state';
/**
 * The kinds of change notifications the {@link NotificationManager} can emit for a request document.
 */
export type DocumentCacheOperation = 'invalidated' | 'added' | 'removed' | 'updated' | 'state';

function isCacheOperationValue(value: NotificationType | DocumentCacheOperation): value is DocumentCacheOperation {
  return (
    value === 'added' || value === 'state' || value === 'updated' || value === 'removed' || value === 'invalidated'
  );
}

/**
 * The full set of notification kinds the {@link NotificationManager} can emit for a resource,
 * including both {@link CacheOperation}s and finer-grained field-level change notifications.
 */
export type NotificationType = 'attributes' | 'relationships' | 'identity' | 'errors' | 'meta' | CacheOperation;

/**
 * The shape accepted by {@link NotificationManager.notify} and
 * {@link CacheCapabilitiesManager.notifyChange} for delivering many keys for
 * the `'attributes'` or `'relationships'` namespaces in a single call
 * instead of once per key.
 *
 * @since 5.9.0
 * @public
 */
export type NotifyKeys = Set<string>;

export interface NotificationCallback {
  (cacheKey: ResourceKey, notificationType: 'attributes' | 'relationships', key?: string): void;
  (cacheKey: ResourceKey, notificationType: 'errors' | 'meta' | 'identity' | 'state'): void;
  (cacheKey: ResourceKey, notificationType: CacheOperation): void;
  // (cacheKey: ResourceKey, notificationType: NotificationType, key?: string): void;
}

export interface ResourceOperationCallback {
  // resource updates
  (cacheKey: ResourceKey, notificationType: CacheOperation): void;
}

export interface DocumentOperationCallback {
  // document updates
  (cacheKey: RequestKey, notificationType: DocumentCacheOperation): void;
}

function keyToString(key: string | NotifyKeys | null | undefined): string {
  return key instanceof Set ? Array.from(key).join(', ') : key || '';
}

/**
 * Merges an incoming `notify()` call for a single identifier into that
 * identifier's pending-notifications buffer, coalescing redundant work within
 * a single flush window.
 *
 * The buffer is a `Map` from namespace (`'attributes'`, `'relationships'`,
 * `'state'`, etc.) to either a `Set<string>` of pending keys or `null`. Using
 * a `Map` means the *first* time a namespace is touched during this flush
 * window fixes its position in iteration order; every subsequent touch to
 * that same namespace (regardless of how much later, or how many other
 * namespaces fired in between) updates its value in place without moving it.
 * This preserves the relative order in which *different* namespaces first
 * fired, while intentionally not tracking the arrival order of repeated
 * touches to the *same* namespace - those are provably safe to coalesce
 * because subscribers never receive anything about a notification beyond
 * `(cacheKey, type, key?)`.
 *
 * For `'attributes'`/`'relationships'`, `null` is a wildcard meaning "an
 * unspecified set of keys changed" - a strict superset of any specific key
 * list, per the existing contract of {@link CacheCapabilitiesManager.notifyChange}.
 * A keyless call always upgrades the bucket to `null`, discarding any
 * specific keys already collected; a keyed call is a no-op once the bucket
 * is already `null`.
 *
 * For every other namespace, subscriber callbacks never receive a key at
 * all, so `null` is used purely as a "this namespace fired at least once"
 * presence marker; multiple firings within one flush all collapse to the
 * same single marker.
 */
function mergeIntoBuffer(
  buffer: Map<NotificationType | DocumentCacheOperation, Set<string> | null>,
  value: NotificationType | CacheOperation | DocumentCacheOperation,
  key: string | NotifyKeys | null | undefined
): void {
  if (value !== 'attributes' && value !== 'relationships') {
    // presence-only namespaces: multiple firings within one flush are
    // lossless to coalesce into a single marker.
    buffer.set(value, null);
    return;
  }

  const existing = buffer.get(value);

  if (key === null || key === undefined) {
    // a keyless call is a wildcard: it always wins, discarding any
    // specific keys already accumulated for this namespace.
    buffer.set(value, null);
    return;
  }

  if (existing === null) {
    // already a wildcard: specific keys can never downgrade it back to a Set.
    return;
  }

  const set = existing ?? new Set<string>();
  if (!existing) {
    buffer.set(value, set);
  }

  if (key instanceof Set) {
    for (const k of key) {
      set.add(k);
    }
  } else {
    set.add(key);
  }
}

function count(label: string) {
  // @ts-expect-error
  // eslint-disable-next-line
  globalThis.__WarpDriveMetricCountData[label] = (globalThis.__WarpDriveMetricCountData[label] || 0) + 1;
}

function asInternalToken(token: unknown): asserts token is {
  for: RequestKey | ResourceKey | 'resource' | 'document';
} & (NotificationCallback | ResourceOperationCallback | DocumentOperationCallback) {
  assert(`Expected a token with a 'for' property`, token && typeof token === 'function' && 'for' in token);
}

function _unsubscribe(
  token: UnsubscribeToken,
  cache: Map<
    'resource' | 'document' | RequestKey | ResourceKey,
    Array<NotificationCallback | ResourceOperationCallback | DocumentOperationCallback>
  >
) {
  asInternalToken(token);
  const cacheKey = token.for;
  if (LOG_NOTIFICATIONS) {
    if (!cacheKey) {
      // eslint-disable-next-line no-console
      console.log('Passed unknown unsubscribe token to unsubscribe', cacheKey);
    }
  }
  if (cacheKey) {
    const callbacks = cache.get(cacheKey);
    if (!callbacks) {
      return;
    }

    const index = callbacks.indexOf(token);
    if (index === -1) {
      assert(`Cannot unsubscribe a token that is not subscribed`, index !== -1);
      return;
    }

    callbacks.splice(index, 1);
  }
}

/**
 * The NotificationManager provides the ability to subscribe to
 * changes to Cache state.
 *
 * This Feature is what allows WarpDrive to create subscriptions that
 * work with any framework or change-notification system.
 *
 * @hideconstructor
 * @public
 */
export class NotificationManager {
  /** @internal */
  declare private store: Store;
  /** @internal */
  declare private isDestroyed: boolean;
  /** @internal */
  declare private _buffered: Map<
    RequestKey | ResourceKey,
    Map<NotificationType | DocumentCacheOperation, Set<string> | null>
  >;
  /** @internal */
  declare private _cache: Map<
    RequestKey | ResourceKey | 'resource' | 'document',
    Array<NotificationCallback | ResourceOperationCallback | DocumentOperationCallback>
  >;
  /** @internal */
  declare private _hasFlush: boolean;
  /** @internal */
  declare private _onFlushCB?: () => void;

  constructor(store: Store) {
    this.store = store;
    this.isDestroyed = false;
    this._buffered = new Map();
    this._hasFlush = false;
    this._cache = new Map();
  }

  /**
   * Subscribe to changes for a given ResourceKey, RequestKey, or addition/removal of any resource
   * or document.
   *
   * ```ts
   * export type CacheOperation = 'added' | 'removed' | 'updated' | 'state';
   *
   * export interface NotificationCallback {
   *   (cacheKey: ResourceKey, notificationType: 'attributes' | 'relationships', key?: string): void;
   *   (cacheKey: ResourceKey, notificationType: 'errors' | 'meta' | 'identity' | 'state'): void;
   *   (cacheKey: ResourceKey, notificationType: NotificationType, key?: string): void;
   * }
   * export interface ResourceOperationCallback {
   *   // resource updates
   *   (cacheKey: ResourceKey, notificationType: CacheOperation): void;
   * }
   * export interface DocumentOperationCallback {
   *   // document updates
   *   (cacheKey: RequestKey, notificationType: CacheOperation): void;
   * }
   * ```
   *
   * @public
   * @return an opaque token to be used with unsubscribe
   */
  subscribe(cacheKey: ResourceKey, callback: NotificationCallback): UnsubscribeToken;
  subscribe(cacheKey: 'resource', callback: ResourceOperationCallback): UnsubscribeToken;
  subscribe(cacheKey: 'document' | RequestKey, callback: DocumentOperationCallback): UnsubscribeToken;
  subscribe(
    cacheKey: RequestKey | ResourceKey | 'resource' | 'document',
    callback: NotificationCallback | ResourceOperationCallback | DocumentOperationCallback
  ): UnsubscribeToken {
    assert(`Expected not to be destroyed`, !this.isDestroyed);
    assert(
      `Expected to receive a stable Identifier to subscribe to`,
      cacheKey === 'resource' || cacheKey === 'document' || isResourceKey(cacheKey) || isRequestKey(cacheKey)
    );
    let callbacks = this._cache.get(cacheKey);
    assert(`expected to receive a valid callback`, typeof callback === 'function');
    assert(`cannot subscribe with the same callback twice`, !callbacks || !callbacks.includes(callback));
    // we use the callback as the cancellation token
    //@ts-expect-error
    callback.for = cacheKey;

    if (!callbacks) {
      callbacks = [];
      this._cache.set(cacheKey, callbacks);
    }

    callbacks.push(callback);
    return callback;
  }

  /**
   * remove a previous subscription
   *
   * @public
   */
  unsubscribe(token: UnsubscribeToken): void {
    if (!this.isDestroyed) {
      _unsubscribe(token, this._cache);
    }
  }

  /**
   * Custom Caches and Application Code should not call this method directly.
   *
   * When notifying `'attributes'` or `'relationships'` for many keys on the
   * same `cacheKey` at once (for instance, when a bulk update to a single
   * record touches many fields) `key` may be supplied as a `Set<string>`
   * instead of being called once per key. The `Set` is iterated as-is (it is
   * never converted to or from an array internally). This delivers the
   * exact same sequence of individual notifications to subscribers (each
   * subscriber callback is still invoked once per key, in order) while
   * paying the per-call overhead (validity checks, subscriber lookups,
   * buffer/flush scheduling) only once for the whole batch instead of once
   * per key.
   *
   * @private
   */
  notify(cacheKey: ResourceKey, value: 'attributes' | 'relationships', key?: string | NotifyKeys | null): boolean;
  notify(cacheKey: ResourceKey, value: 'errors' | 'meta' | 'identity' | 'state', key?: null): boolean;
  notify(cacheKey: ResourceKey, value: CacheOperation, key?: null): boolean;
  notify(cacheKey: RequestKey, value: DocumentCacheOperation, key?: null): boolean;
  notify(
    cacheKey: ResourceKey | RequestKey,
    value: NotificationType | CacheOperation | DocumentCacheOperation,
    key?: string | NotifyKeys | null
  ): boolean {
    if (this.isDestroyed) {
      return false;
    }
    assert(
      `Notify does not accept a key argument for the namespace '${value}'. Received key '${keyToString(key)}'.`,
      !key || value === 'attributes' || value === 'relationships'
    );
    if (!isResourceKey(cacheKey) && !isRequestKey(cacheKey)) {
      if (LOG_NOTIFICATIONS) {
        // eslint-disable-next-line no-console
        console.log(
          `Notifying: Expected to receive a stable Identifier to notify '${value}' '${keyToString(
            key
          )}' with, but ${String(cacheKey)} is not in the cache`,
          cacheKey
        );
      }
      return false;
    }

    const _hasSubscribers = hasSubscribers(this._cache, cacheKey, value);
    if (_hasSubscribers) {
      let buffer = this._buffered.get(cacheKey);
      if (!buffer) {
        buffer = new Map();
        this._buffered.set(cacheKey, buffer);
      }

      mergeIntoBuffer(buffer, value, key);

      if (LOG_METRIC_COUNTS) {
        count(`notify ${'type' in cacheKey ? cacheKey.type : '<document>'} ${value} ${keyToString(key)}`);
      }

      if (!this._scheduleNotify()) {
        if (LOG_NOTIFICATIONS) {
          log(
            'notify',
            'buffered',
            `${'type' in cacheKey ? cacheKey.type : 'document'}`,
            cacheKey.lid,
            `${value}`,
            keyToString(key)
          );
        }
      }
    } else {
      if (LOG_NOTIFICATIONS) {
        log(
          'notify',
          'discarded',
          `${'type' in cacheKey ? cacheKey.type : 'document'}`,
          cacheKey.lid,
          `${value}`,
          keyToString(key)
        );
      }
      if (LOG_METRIC_COUNTS) {
        count(`DISCARDED notify ${'type' in cacheKey ? cacheKey.type : '<document>'} ${value} ${keyToString(key)}`);
      }
    }

    return _hasSubscribers;
  }

  /** @internal */
  _onNextFlush(cb: () => void): void {
    this._onFlushCB = cb;
  }

  /** @internal */
  private _scheduleNotify(): boolean {
    const asyncFlush = this.store._enableAsyncFlush;

    if (this._hasFlush) {
      if (asyncFlush !== false && !willSyncFlushWatchers()) {
        return false;
      }
    }

    if (asyncFlush && !willSyncFlushWatchers()) {
      this._hasFlush = true;
      return false;
    }

    this._flush();
    return true;
  }

  /** @internal */
  _flush(): void {
    const buffered = this._buffered;
    if (buffered.size) {
      this._buffered = new Map();
      for (const [cacheKey, states] of buffered) {
        // `states` iterates in the order each namespace first fired during
        // this flush window (see `mergeIntoBuffer`).
        for (const [value, keyOrKeys] of states) {
          if (keyOrKeys === null) {
            // @ts-expect-error overload doesn't narrow within body
            _flushNotification(this._cache, cacheKey, value, null);
          } else {
            for (const key of keyOrKeys) {
              // @ts-expect-error overload doesn't narrow within body
              _flushNotification(this._cache, cacheKey, value, key);
            }
          }
        }
      }
    }

    this._hasFlush = false;
    this._onFlushCB?.();
    this._onFlushCB = undefined;
  }

  /** @internal */
  destroy(): void {
    this.isDestroyed = true;
    this._cache.clear();
  }
}

/**
 * This type exists for internal use only for
 * where intimate contracts still exist either for
 * the Test Suite or for Legacy code.
 *
 * @private
 */
export interface PrivateNotificationManager extends NotificationManager {
  _flush(): void;
}

function _flushNotification(
  cache: NotificationManager['_cache'],
  cacheKey: ResourceKey,
  value: 'attributes' | 'relationships',
  key: string | null
): boolean;
function _flushNotification(
  cache: NotificationManager['_cache'],
  cacheKey: ResourceKey,
  value: 'errors' | 'meta' | 'identity' | 'state',
  key: null
): boolean;
function _flushNotification(
  cache: NotificationManager['_cache'],
  cacheKey: ResourceKey | RequestKey,
  value: CacheOperation,
  key: null
): boolean;
function _flushNotification(
  cache: NotificationManager['_cache'],
  cacheKey: ResourceKey | RequestKey,
  value: NotificationType | CacheOperation,
  key: string | null
): boolean {
  if (LOG_NOTIFICATIONS) {
    log('notify', '', `${'type' in cacheKey ? cacheKey.type : 'document'}`, cacheKey.lid, `${value}`, key || '');
  }

  // TODO for documents this will need to switch based on Identifier kind
  if (isCacheOperationValue(value)) {
    const callbackMap = cache.get(isRequestKey(cacheKey) ? 'document' : 'resource') as Array<
      ResourceOperationCallback | DocumentOperationCallback
    >;

    if (callbackMap) {
      callbackMap.forEach((cb: ResourceOperationCallback | DocumentOperationCallback) => {
        (cb as ResourceOperationCallback)(cacheKey as ResourceKey, value);
      });
    }
  }

  const callbacks = cache.get(cacheKey);
  if (!callbacks || !callbacks.length) {
    return false;
  }
  callbacks.forEach((cb) => {
    // @ts-expect-error overload doesn't narrow within body
    cb(cacheKey, value, key);
  });
  return true;
}

function hasSubscribers(
  cache: NotificationManager['_cache'],
  cacheKey: RequestKey | ResourceKey,
  value: NotificationType | CacheOperation | DocumentCacheOperation
): boolean {
  const hasSubscriber = Boolean(cache.get(cacheKey)?.length);

  if (hasSubscriber || !isCacheOperationValue(value)) {
    return hasSubscriber;
  }

  const callbackMap = cache.get(isRequestKey(cacheKey) ? 'document' : 'resource') as Array<
    ResourceOperationCallback | DocumentOperationCallback
  >;
  return Boolean(callbackMap?.length);
}
