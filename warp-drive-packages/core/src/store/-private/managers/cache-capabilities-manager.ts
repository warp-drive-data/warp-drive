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
  declare _store: Store;

  constructor(_store: Store) {
    this._store = _store;
  }

  get cacheKeyManager(): CacheKeyManager {
    return this._store.cacheKeyManager;
  }

  /** @deprecated use {@link CacheCapabilitiesManager.cacheKeyManager} */
  get identifierCache(): CacheKeyManager {
    return this.cacheKeyManager;
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
