import { ENABLE_LEGACY_SCHEMA_SERVICE } from '@warp-drive/core/build-config/deprecations';
import { assert } from '@warp-drive/core/build-config/macros';

import type { CacheCapabilitiesManager as StoreWrapper } from '../../-types/q/cache-capabilities-manager.ts';
import type { RequestKey, ResourceKey } from '../../../types/identifier.ts';
import type { SchemaService } from '../../../types/schema/schema-service.ts';
import type { PrivateStore, Store } from '../store-service.ts';
import type { CacheKeyManager } from './cache-key-manager.ts';
import { isRequestKey, isResourceKey } from './cache-key-manager.ts';
import type { NotificationChannel, NotificationType, NotifyKeys } from './notification-manager.ts';

export interface CacheCapabilitiesManager {
  /** @deprecated - use {@link CacheCapabilitiesManager.schema} */
  getSchemaDefinitionService(): SchemaService;
}
export class CacheCapabilitiesManager implements StoreWrapper {
  /** @internal */
  declare private _willNotify: boolean;

  /** @internal */
  declare private _pendingNotifies: Map<ResourceKey, Map<string, Set<NotificationChannel | undefined>>>;

  /** @internal */
  declare _store: Store;

  constructor(_store: Store) {
    this._store = _store;
    this._willNotify = false;
    this._pendingNotifies = new Map();
  }

  get cacheKeyManager(): CacheKeyManager {
    return this._store.cacheKeyManager;
  }

  /** @deprecated use {@link CacheCapabilitiesManager.cacheKeyManager} */
  get identifierCache(): CacheKeyManager {
    return this.cacheKeyManager;
  }

  /** @internal */
  private _scheduleNotification(identifier: ResourceKey, key: string, channel: NotificationChannel | undefined): void {
    let pending = this._pendingNotifies.get(identifier);

    if (!pending) {
      pending = new Map();
      this._pendingNotifies.set(identifier, pending);
    }
    let channels = pending.get(key);
    if (!channels) {
      channels = new Set();
      pending.set(key, channels);
    }
    channels.add(channel);

    if (this._willNotify === true) {
      return;
    }

    this._willNotify = true;
    // it's possible a cache adhoc notifies us,
    // in which case we sync flush
    if (this._store._cbs) {
      this._store._schedule('notify', () => this._flushNotifications());
    } else {
      // TODO @runspired determine if relationship mutations should schedule
      // into join/run vs immediate flush
      this._flushNotifications();
    }
  }

  /** @internal */
  private _flushNotifications(): void {
    if (this._willNotify === false) {
      return;
    }

    const pending = this._pendingNotifies;
    this._pendingNotifies = new Map();
    this._willNotify = false;

    // deliver all relationship keys pending for a given identifier as a single
    // batch instead of one `notify` call per key: subscribers still receive one
    // notification per key (in Set-insertion order), but the per-call overhead
    // (subscriber lookups, buffer scheduling, etc) that `notify` would otherwise
    // repeat for every key is paid only once per identifier. This mirrors the
    // same N*M concern `attributes` notifications have (see `notifyAttributes`
    // in the json-api Cache): a single push/mutation pass can dirty many
    // relationships across many records at once, and each of those records
    // funnels through this same per-identifier `pending` Set.
    //
    // Keys touched with more than one distinct channel during this window
    // (e.g. once unscoped and once on `'local'`) are re-grouped by channel
    // below so that each distinct channel is still handed off to `notify` as
    // a single `Set<string>` batch call (never one call per key) -- `notify`'s
    // own buffer (see NotificationManager) is what dedupes/coalesces these
    // per-channel batches back down to a single delivery per subscriber.
    pending.forEach((channelsByKey, identifier) => {
      const keysByChannel = new Map<NotificationChannel | undefined, Set<string>>();
      channelsByKey.forEach((channels, key) => {
        channels.forEach((channel) => {
          let keys = keysByChannel.get(channel);
          if (!keys) {
            keys = new Set();
            keysByChannel.set(channel, keys);
          }
          keys.add(key);
        });
      });
      keysByChannel.forEach((keys, channel) => {
        this._store.notifications.notify(identifier, 'relationships', keys, channel);
      });
    });
  }

  notifyChange(identifier: ResourceKey, namespace: 'added' | 'removed', key: null): void;
  notifyChange(identifier: RequestKey, namespace: 'added' | 'updated' | 'removed', key: null): void;
  notifyChange(
    identifier: ResourceKey,
    namespace: 'attributes',
    key: string | NotifyKeys | null,
    channel?: NotificationChannel
  ): void;
  notifyChange(
    identifier: ResourceKey,
    namespace: NotificationType,
    key: string | null,
    channel?: NotificationChannel
  ): void;
  notifyChange(
    identifier: ResourceKey | RequestKey,
    namespace: NotificationType | 'added' | 'removed' | 'updated',
    key: string | NotifyKeys | null,
    channel?: NotificationChannel
  ): void {
    assert(`Expected a stable identifier`, isResourceKey(identifier) || isRequestKey(identifier));

    // TODO do we still get value from this?
    if (namespace === 'relationships' && key) {
      assert(`Expected a single relationship key`, typeof key === 'string');
      this._scheduleNotification(identifier as ResourceKey, key, channel);
      return;
    }

    // @ts-expect-error
    this._store.notifications.notify(identifier, namespace, key, channel);
  }

  get schema(): SchemaService {
    return this._store.schema;
  }

  setRecordId(identifier: ResourceKey, id: string): void {
    assert(`Expected a stable identifier`, isResourceKey(identifier));
    this._store._instanceCache.setRecordId(identifier, id);
  }

  hasRecord(identifier: ResourceKey): boolean {
    return Boolean(this._store._instanceCache.peek(identifier));
  }

  disconnectRecord(identifier: ResourceKey): void {
    assert(`Expected a stable identifier`, isResourceKey(identifier));
    this._store._instanceCache.disconnect(identifier);
    this._pendingNotifies.delete(identifier);
  }
}

/**
 * This type exists for internal use only for
 * where intimate contracts still exist either for
 * the Test Suite or for Legacy code.
 *
 * @private
 */
export interface PrivateCacheCapabilitiesManager extends CacheCapabilitiesManager {
  _store: PrivateStore;
}

if (ENABLE_LEGACY_SCHEMA_SERVICE) {
  CacheCapabilitiesManager.prototype.getSchemaDefinitionService = function () {
    // FIXME add deprecation for this
    return this.schema;
  };
}

/**
 * Upgrade the type for {@link CacheCapabilitiesManager} to {@link PrivateCacheCapabilitiesManager}.
 *
 * @private
 */
export function assertPrivateCapabilities(manager: unknown): asserts manager is PrivateCacheCapabilitiesManager {}
