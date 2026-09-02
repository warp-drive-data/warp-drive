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

/**
 * A change to a resource's `attributes` or `relationships` can be relevant to
 * a "local" view of the resource (its mutable/editable state), a "remote" view
 * (its last-known-persisted state), or both.
 *
 * Because a resource's local view is derived from its remote state (remote
 * state plus any pending local mutations), a change to remote state also
 * potentially changes what a local view shows -- but a purely local mutation
 * never changes what a remote-only view shows. Channel filtering is therefore
 * one-directional: the only notification a subscriber can opt out of is a
 * purely-local change, by subscribing `'remote'`.
 *
 * - Subscribing `'remote'` means "only tell me about changes that could
 *   affect remote state" -- used by a reader that only ever displays remote
 *   state (e.g. PolarisMode's default immutable record), so it isn't woken
 *   for purely-local edits it can't see anyway. Subscribing `'local'` and
 *   omitting the channel are the same thing: both receive every
 *   notification, exactly as every subscriber did before channels existed.
 * - Notifying `'local'` declares "only local state changed" -- the one tag
 *   that lets `'remote'` subscribers be skipped. Notifying `'remote'` or
 *   omitting the channel reaches every subscriber: an unscoped notify cannot
 *   guarantee the change was local-only, so it must assume it wasn't. This
 *   keeps every pre-channel `notify` callsite (and any custom cache that
 *   doesn't know about channels) fully compatible.
 *
 * The full delivery matrix:
 *
 * | notify ↓ subscribe → | `'local'` | `'remote'` | omitted (= `'local'`) |
 * | -------------------- | --------- | ---------- | --------------------- |
 * | `'local'`            | ✅        | ❌         | ✅                    |
 * | `'remote'`           | ✅        | ✅         | ✅                    |
 * | omitted              | ✅        | ✅         | ✅                    |
 *
 * Channel only applies to the `'attributes'` and `'relationships'`
 * notification types. All other types (`'errors'`,
 * `'identity'`, `'state'`, and the various `CacheOperation`/
 * `DocumentCacheOperation` values) are never filtered by channel since they
 * have no local/remote duality.
 *
 * @public
 */
export type NotificationChannel = 'local' | 'remote';

/**
 * The set of channels (if any) a given `'attributes'`/`'relationships'` touch
 * was tagged with while buffered. `undefined` is included in this set when at
 * least one of the coalesced touches was itself unscoped (no channel given),
 * since an unscoped touch always reaches every subscriber regardless of what
 * channel(s) it was also touched with.
 */
type ChannelSet = Set<NotificationChannel | undefined>;

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
 * `'state'`, etc.) to a "bucket". Using a `Map` means the *first* time a
 * namespace is touched during this flush window fixes its position in
 * iteration order; every subsequent touch to that same namespace (regardless
 * of how much later, or how many other namespaces fired in between) updates
 * its value in place without moving it. This preserves the relative order in
 * which *different* namespaces first fired, while intentionally not tracking
 * the arrival order of repeated touches to the *same* namespace - those are
 * provably safe to coalesce because subscribers never receive anything about
 * a notification beyond `(cacheKey, type, key?)`.
 *
 * For every namespace other than `'attributes'`/`'relationships'`, subscriber
 * callbacks never receive a key at all (and channel never applies to them -
 * see {@link NotificationChannel}), so the bucket is simply `null`, used
 * purely as a "this namespace fired at least once" presence marker; multiple
 * firings within one flush all collapse to the same single marker.
 *
 * For `'attributes'`/`'relationships'`, a key (or channel) *does* matter, so
 * the bucket is one of:
 * - a `Map<string, ChannelSet>`: the normal case, mapping each specific key
 *   touched to the set of channels it was touched with (`undefined` in that
 *   set means at least one of those touches was itself unscoped).
 * - a `ChannelSet` directly: a wildcard meaning "an unspecified set of keys
 *   changed" - a strict superset of any specific key list, per the existing
 *   contract of {@link CacheCapabilitiesManager.notifyChange} - tagged with
 *   the set of channels any of the coalesced keyless (or post-wildcard
 *   keyed) touches carried.
 *
 * A keyless call always upgrades the bucket to the wildcard form. When
 * upgrading away from a `Map`, every channel ever recorded against any of
 * its specific keys is folded into the new wildcard `ChannelSet` - the
 * wildcard must remain a superset not just key-wise but channel-wise too, or
 * a channel-scoped subscriber that would have heard about one of those
 * specific keys could silently stop hearing about it once the bucket flips
 * to wildcard. Once a bucket is a wildcard it can never downgrade back to a
 * `Map`; a keyed touch that arrives after that point still folds its channel
 * into the wildcard's `ChannelSet` (the specific key itself is discarded,
 * since the wildcard already covers it).
 */
function mergeIntoBuffer(
  buffer: Map<NotificationType | DocumentCacheOperation, Map<string, ChannelSet> | ChannelSet | null>,
  value: NotificationType | CacheOperation | DocumentCacheOperation,
  key: string | NotifyKeys | null | undefined,
  channel: NotificationChannel | undefined
): void {
  if (value !== 'attributes' && value !== 'relationships') {
    // presence-only namespaces: multiple firings within one flush are
    // lossless to coalesce into a single marker.
    buffer.set(value, null);
    return;
  }

  const existing = buffer.get(value) as Map<string, ChannelSet> | ChannelSet | undefined;

  if (key === null || key === undefined) {
    // a keyless call is a wildcard: fold this touch's channel (and, if
    // upgrading from a keyed Map, every channel ever recorded against any of
    // its specific keys) into the wildcard ChannelSet.
    const channels: ChannelSet = existing instanceof Set ? existing : new Set();
    if (existing instanceof Map) {
      for (const channelsForKey of existing.values()) {
        for (const ch of channelsForKey) channels.add(ch);
      }
    }
    channels.add(channel);
    buffer.set(value, channels);
    return;
  }

  if (existing instanceof Set) {
    // already a wildcard: specific keys can never downgrade it back to a
    // Map, but this touch's channel still needs to be folded in.
    existing.add(channel);
    return;
  }

  const map = existing ?? new Map<string, ChannelSet>();
  if (!existing) {
    buffer.set(value, map);
  }

  const keys = key instanceof Set ? key : [key];
  for (const k of keys) {
    let channels = map.get(k);
    if (!channels) {
      channels = new Set();
      map.set(k, channels);
    }
    channels.add(channel);
  }
}

/**
 * Given the set of channels a touch (or coalesced group of touches) was
 * recorded with, determines whether a subscriber scoped to `subscriberChannel`
 * should be delivered to. Only one combination is ever skipped (see the
 * delivery matrix on {@link NotificationChannel}): a `'remote'` subscriber
 * and a touch-set that was exclusively tagged `'local'`. A `'local'` (or
 * defaulted) subscriber receives everything.
 */
function shouldDeliverToChannel(channels: ChannelSet, subscriberChannel: NotificationChannel): boolean {
  return subscriberChannel !== 'remote' || channels.has(undefined) || channels.has('remote');
}

function count(label: string) {
  // @ts-expect-error
  // oxlint-disable-next-line
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
      // oxlint-disable-next-line no-console
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
    Map<NotificationType | DocumentCacheOperation, Map<string, ChannelSet> | ChannelSet | null>
  >;
  /** @internal */
  declare private _cache: Map<
    RequestKey | ResourceKey | 'resource' | 'document',
    Array<NotificationCallback | ResourceOperationCallback | DocumentOperationCallback>
  >;
  /** @internal */
  declare private _hasFlush: boolean;
  /** @internal */
  declare private _hasTransactionFlush: boolean;
  /** @internal */
  declare private _onFlushCB?: () => void;

  constructor(store: Store) {
    this.store = store;
    this.isDestroyed = false;
    this._buffered = new Map();
    this._hasFlush = false;
    this._hasTransactionFlush = false;
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
   * A `channel` may be provided when subscribing to a `ResourceKey`. Its only
   * effect is that a `'remote'` subscription skips `'attributes'`/`'relationships'`
   * notifications explicitly tagged `'local'`; notifications for all other
   * notification types are never filtered by channel and always reach the
   * subscriber. Subscribing `'local'` and omitting the channel are the same
   * thing: both receive every notification. See {@link NotificationChannel}.
   *
   * | notify ↓ subscribe → | `'local'` | `'remote'` | omitted (= `'local'`) |
   * | -------------------- | --------- | ---------- | --------------------- |
   * | `'local'`            | ✅        | ❌         | ✅                    |
   * | `'remote'`           | ✅        | ✅         | ✅                    |
   * | omitted              | ✅        | ✅         | ✅                    |
   *
   * @public
   * @return an opaque token to be used with unsubscribe
   */
  subscribe(cacheKey: ResourceKey, callback: NotificationCallback, channel?: NotificationChannel): UnsubscribeToken;
  subscribe(cacheKey: 'resource', callback: ResourceOperationCallback): UnsubscribeToken;
  subscribe(cacheKey: 'document' | RequestKey, callback: DocumentOperationCallback): UnsubscribeToken;
  subscribe(
    cacheKey: RequestKey | ResourceKey | 'resource' | 'document',
    callback: NotificationCallback | ResourceOperationCallback | DocumentOperationCallback,
    channel?: NotificationChannel
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
    //@ts-expect-error stashed only for ResourceKey subscriptions; see shouldDeliverToChannel.
    // Defaults to 'local' rather than leaving it unscoped -- see NotificationChannel.
    callback.channel = channel ?? 'local';

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
   * A `channel` may be supplied for the `'attributes'`/`'relationships'`
   * namespaces. Tagging a notification `'local'` declares "only local state
   * changed", letting `'remote'`-scoped subscribers skip it. Notifying
   * `'remote'` or omitting the channel reaches every subscriber regardless
   * of its channel. See {@link NotificationChannel}.
   *
   * | notify ↓ subscribe → | `'local'` | `'remote'` | omitted (= `'local'`) |
   * | -------------------- | --------- | ---------- | --------------------- |
   * | `'local'`            | ✅        | ❌         | ✅                    |
   * | `'remote'`           | ✅        | ✅         | ✅                    |
   * | omitted              | ✅        | ✅         | ✅                    |
   *
   * @private
   */
  notify(
    cacheKey: ResourceKey,
    value: 'attributes' | 'relationships',
    key?: string | NotifyKeys | null,
    channel?: NotificationChannel
  ): boolean;
  notify(cacheKey: ResourceKey, value: 'errors' | 'meta' | 'identity' | 'state', key?: null): boolean;
  notify(cacheKey: ResourceKey, value: CacheOperation, key?: null): boolean;
  notify(cacheKey: RequestKey, value: DocumentCacheOperation, key?: null): boolean;
  notify(
    cacheKey: ResourceKey | RequestKey,
    value: NotificationType | CacheOperation | DocumentCacheOperation,
    key?: string | NotifyKeys | null,
    channel?: NotificationChannel
  ): boolean {
    if (this.isDestroyed) {
      return false;
    }
    assert(
      `Notify does not accept a key argument for the namespace '${value}'. Received key '${keyToString(key)}'.`,
      !key || value === 'attributes' || value === 'relationships'
    );
    assert(
      `Notify does not accept a channel argument for the namespace '${value}'. Received channel '${channel || ''}'.`,
      !channel || value === 'attributes' || value === 'relationships'
    );
    if (!isResourceKey(cacheKey) && !isRequestKey(cacheKey)) {
      if (LOG_NOTIFICATIONS) {
        // oxlint-disable-next-line no-console
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

      mergeIntoBuffer(buffer, value, key, channel);

      if (LOG_METRIC_COUNTS) {
        count(`notify ${'type' in cacheKey ? cacheKey.type : '<document>'} ${value} ${keyToString(key)}`);
      }

      // relationship notifications that arrive while a store transaction
      // (store._run / store._join) is active — e.g. while the graph is still
      // syncing relationship state — are deferred into the transaction's
      // notify phase rather than dispatched mid-mutation. The notify phase
      // runs synchronously at the end of the transaction, so this never
      // delays delivery past the current calling context. All other
      // namespaces flush immediately (below): several consumers depend on
      // e.g. `'state'` notifications being delivered before a subsequent
      // teardown within the same transaction unsubscribes them.
      let scheduled = false;
      if (value === 'relationships' && this.store._cbs) {
        if (!this._hasTransactionFlush) {
          this._hasTransactionFlush = true;
          this.store._schedule('notify', () => this._flushTransaction());
        }
      } else {
        scheduled = this._scheduleNotify();
      }

      if (!scheduled) {
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

  /**
   * The deferred flush scheduled into a store transaction's notify phase
   * when a `'relationships'` notification arrives mid-transaction (see
   * {@link NotificationManager.notify}). Runs synchronously at the end of
   * the transaction, once the graph has finished syncing.
   *
   * @internal
   */
  private _flushTransaction(): void {
    this._hasTransactionFlush = false;
    // a request/push window (_enableAsyncFlush) ends in an explicit
    // _flush() of its own; leave delivery to it rather than flushing
    // mid-window.
    if (this.store._enableAsyncFlush && !willSyncFlushWatchers()) {
      this._hasFlush = true;
      return;
    }
    this._flush();
  }

  /** @internal */
  _flush(): void {
    const buffered = this._buffered;
    if (buffered.size) {
      if (this._hasTransactionFlush) {
        // a transaction-deferred relationships flush is still pending (see
        // `notify`): deliver everything else now but withhold relationship
        // buckets — they are owed to the transaction's notify phase and must
        // not be dispatched mid-mutation. Extract before delivering so that
        // notifies triggered by subscriber callbacks merge into the buffer
        // cleanly rather than into a collection being iterated.
        const pending: Array<
          [
            RequestKey | ResourceKey,
            NotificationType | DocumentCacheOperation,
            Map<string, ChannelSet> | ChannelSet | null,
          ]
        > = [];
        for (const [cacheKey, states] of buffered) {
          for (const [value, bucket] of states) {
            if (value === 'relationships') {
              continue;
            }
            pending.push([cacheKey, value, bucket]);
            states.delete(value);
          }
          if (states.size === 0) {
            buffered.delete(cacheKey);
          }
        }
        for (const [cacheKey, value, bucket] of pending) {
          this._deliver(cacheKey, value, bucket);
        }
      } else {
        this._buffered = new Map();
        for (const [cacheKey, states] of buffered) {
          // `states` iterates in the order each namespace first fired during
          // this flush window (see `mergeIntoBuffer`).
          for (const [value, bucket] of states) {
            this._deliver(cacheKey, value, bucket);
          }
        }
      }
    }

    this._hasFlush = false;
    this._onFlushCB?.();
    this._onFlushCB = undefined;
  }

  /** @internal */
  private _deliver(
    cacheKey: RequestKey | ResourceKey,
    value: NotificationType | DocumentCacheOperation,
    bucket: Map<string, ChannelSet> | ChannelSet | null
  ): void {
    if (bucket === null) {
      // @ts-expect-error overload doesn't narrow within body
      _flushNotification(this._cache, cacheKey, value, null);
    } else if (bucket instanceof Set) {
      // wildcard: one notification, key `null`, filtered by the union
      // of channels any of the coalesced keyless touches carried.
      // @ts-expect-error overload doesn't narrow within body
      _flushNotification(this._cache, cacheKey, value, null, bucket);
    } else {
      for (const [key, channels] of bucket) {
        // @ts-expect-error overload doesn't narrow within body
        _flushNotification(this._cache, cacheKey, value, key, channels);
      }
    }
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
  key: string | null,
  channels?: ChannelSet
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
  key: string | null,
  channels?: ChannelSet
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
    if (channels) {
      // @ts-expect-error channel is stashed on the callback only for ResourceKey subscriptions;
      // always concrete since `subscribe` defaults it to 'local'.
      const subscriberChannel = cb.channel as NotificationChannel;
      if (!shouldDeliverToChannel(channels, subscriberChannel)) {
        return;
      }
    }
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
