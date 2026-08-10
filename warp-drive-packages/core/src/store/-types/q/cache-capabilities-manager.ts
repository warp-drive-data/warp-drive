import type { CacheKeyManager } from '../../-private/managers/cache-key-manager.ts';
import type {
  NotificationChannel,
  NotificationType,
  NotifyKeys,
} from '../../-private/managers/notification-manager.ts';
import type { RequestKey, ResourceKey } from '../../../types/identifier.ts';
import type { SchemaService } from '../../../types/schema/schema-service.ts';

/**
 * CacheCapabilitiesManager provides encapsulated API access to the minimal
 * subset of the Store's functionality that Cache implementations
 * should interact with. It is provided to the Store's `createCache` hook.
 *
 * Cache implementations should not need more than this API provides.
 *
 * This class cannot be directly instantiated.
 *
 * @public
 */
export type CacheCapabilitiesManager = {
  /**
   * Provides access to the CacheKeyManager instance
   * for this Store instance.
   *
   * The CacheKeyManager can be used to peek, generate or
   * retrieve a stable unique identifier for any resource.
   *
   * @public
   */
  cacheKeyManager: CacheKeyManager;

  /** @deprecated use {@link CacheCapabilitiesManager.cacheKeyManager} */
  identifierCache: CacheKeyManager;

  /**
   * DEPRECATED - use the schema property
   *
   * Provides access to the SchemaService instance
   * for this Store instance.
   *
   * The SchemaService can be used to query for
   * information about the schema of a resource.
   *
   * @deprecated use {@link CacheCapabilitiesManager.schema}
   * @public
   */
  getSchemaDefinitionService(): SchemaService;

  /**
   * Provides access to the SchemaService instance
   * for this Store instance.
   *
   * The SchemaService can be used to query for
   * information about the schema of a resource.
   *
   * @property schema
   * @public
   */
  schema: SchemaService;

  /**
   * Update the `id` for the record corresponding to the identifier
   * This operation can only be done for records whose `id` is `null`.
   *
   * @public
   */
  setRecordId(identifier: ResourceKey, id: string): void;

  /**
   * Signal to the store that the specified record may be considered fully
   * removed from the cache. Generally this means that not only does no
   * data exist for the identified resource, no known relationships still
   * point to it either.
   *
   * @public
   */
  disconnectRecord(identifier: ResourceKey): void;

  /**
   * Use this method to determine if the Store has an instantiated record associated
   * with an identifier.
   *
   * @public
   */
  hasRecord(identifier: ResourceKey): boolean;

  /**
   * Notify subscribers of the NotificationManager that cache state has changed.
   *
   * This overload notifies that a resource has been added to or removed from
   * the cache. `key` is always `null` for these namespaces.
   *
   * @public
   */
  notifyChange(identifier: ResourceKey, namespace: 'added' | 'removed', key: null): void;
  /**
   * Notify subscribers that a request (as identified by a {@link RequestKey})
   * has been added, updated, or removed from the cache. `key` is always
   * `null` for these namespaces.
   *
   * @public
   */
  notifyChange(identifier: RequestKey, namespace: 'added' | 'updated' | 'removed', key: null): void;
  /**
   * Notify subscribers that one or more attributes on a resource have
   * changed. `key` may be a single attribute name, or - since 5.9.0 - a
   * `Set<string>` of attribute names. This is useful when many attributes on
   * the same resource have changed at once (for instance after applying a
   * bulk update): passing the full `Set` of changed keys in a single call is
   * equivalent to calling `notifyChange` once per key (subscribers still
   * receive one notification per key, in the same order), but avoids
   * repeating the per-call bookkeeping (subscriber lookups, buffer
   * scheduling, etc) for every key. The `Set` is iterated as-is and never
   * converted to or from an array.
   *
   * `channel` may additionally be provided to tag this notification as only
   * relevant to that {@link NotificationChannel}. Defaults to reaching every
   * subscriber (regardless of what channel, if any, they subscribed with)
   * when omitted.
   *
   * @since 5.9.0
   * @public
   */
  notifyChange(
    identifier: ResourceKey,
    namespace: 'attributes',
    key: string | NotifyKeys | null,
    channel?: NotificationChannel
  ): void;
  /**
   * Notify subscribers of a change to a resource for any other
   * {@link NotificationType}. `attributes` and `relationships` do not
   * require a key, but if one is specified it is assumed to be the name
   * of the attribute or relationship that has been updated.
   *
   * `channel` may be provided for the `'attributes'`/`'relationships'` namespaces to scope
   * this notification to only subscribers listening on that same channel (see
   * {@link NotificationChannel}). When omitted, the notification reaches every subscriber
   * regardless of what channel (if any) they subscribed with.
   *
   * @public
   */
  notifyChange(
    identifier: ResourceKey,
    namespace: NotificationType,
    key: string | null,
    channel?: NotificationChannel
  ): void;
  /**
   * Implementation signature for {@link CacheCapabilitiesManager.notifyChange}
   * covering all supported combinations of identifier, namespace, and key.
   *
   * @public
   */
  notifyChange(
    identifier: ResourceKey | RequestKey,
    namespace: NotificationType | 'added' | 'removed' | 'updated',
    key: string | NotifyKeys | null,
    channel?: NotificationChannel
  ): void;
};
