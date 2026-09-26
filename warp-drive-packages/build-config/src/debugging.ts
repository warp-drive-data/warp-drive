/**
 * While build-config is its own package, it should always be
 * used via `@warp-drive/core`.
 *
 * Visit {@link @warp-drive/core!build-config/debugging | @warp-drive/core debugging} for documentation of the debugging features.
 *
 * @summary Flags for turning on WarpDrive debug logging per area, such as cache, requests, and notifications; use it
 * via `@warp-drive/core/build-config/debugging`.
 * @module
 */
/**
 * log cache updates for both local
 * and remote state. Note in some older versions
 * this was called `LOG_PAYLOADS` and was one
 * of three flags that controlled logging of
 * cache updates. This is now the only flag.
 *
 * The others were `LOG_OPERATIONS` and `LOG_MUTATIONS`.
 *
 * @summary Debug logging flag that logs cache updates to both local and remote state; it replaces `LOG_PAYLOADS`,
 * `LOG_OPERATIONS`, and `LOG_MUTATIONS`.
 * @public
 * @since 5.5
 */
export const LOG_CACHE: boolean = false;

/**
 * <Badge type="danger" text="removed" />
 *
 * This flag no longer has any effect.
 *
 * Use {@link LOG_CACHE} instead.
 *
 * @summary Removed debug logging flag that no longer has any effect; use `LOG_CACHE` to log cache updates instead.
 * @deprecated removed in version 5.5
 * @public
 */
export const LOG_PAYLOADS: boolean = false;

/**
 * <Badge type="danger" text="removed" />
 *
 * This flag no longer has any effect.
 *
 * Use {@link LOG_CACHE} instead.
 *
 * @summary Removed debug logging flag that no longer has any effect; use `LOG_CACHE` to log cache updates instead.
 * @deprecated removed in version 5.5
 * @public
 */
export const LOG_OPERATIONS: boolean = false;

/**
 * <Badge type="danger" text="removed" />
 *
 * This flag no longer has any effect.
 *
 * Use {@link LOG_CACHE} instead.
 *
 * @summary Removed debug logging flag that no longer has any effect; use `LOG_CACHE` to log cache updates instead.
 * @deprecated removed in version 5.5
 * @public
 */
export const LOG_MUTATIONS: boolean = false;

/**
 * Log decisions made by the Basic CachePolicy
 *
 * @summary Debug logging flag that logs the decisions the default CachePolicy makes about whether cached requests are
 * expired or stale.
 * @public
 */
export const LOG_CACHE_POLICY: boolean = false;

/**
 * log notifications received by the NotificationManager
 *
 * @summary Debug logging flag that logs the change notifications the store's NotificationManager receives and delivers
 * to subscribers.
 * @public
 */
export const LOG_NOTIFICATIONS: boolean = false;
/**
 * log requests issued by the RequestManager
 *
 * @summary Debug logging flag that logs each request issued through the RequestManager.
 * @public
 */
export const LOG_REQUESTS: boolean = false;
/**
 * log updates to requests the store has issued to
 * the network (adapter) to fulfill.
 *
 * @summary Debug logging flag meant to log status updates for requests the store sends to the network (adapter);
 * it currently has no effect.
 * @public
 */
export const LOG_REQUEST_STATUS: boolean = false;
/**
 * log peek, generation and updates to
 * Record Identifiers.
 *

 * @summary Debug logging flag that logs lookups, generation, and updates of the identifiers (cache keys) WarpDrive
 * assigns to resources.
 * @public
 */
export const LOG_IDENTIFIERS: boolean = false;
/**
 * log updates received by the graph (relationship pointer storage)
 *
 * @summary Debug logging flag that logs the updates the relationship graph receives.
 * @public
 */
export const LOG_GRAPH: boolean = false;
/**
 * log creation/removal of RecordData and Record
 * instances.
 *
 * @summary Debug logging flag that logs when the store creates or removes record instances and their cache entries.
 * @public
 */
export const LOG_INSTANCE_CACHE: boolean = false;
/**
 * Log key count metrics, useful for performance
 * debugging.
 *
 * @summary Debug logging flag that logs counts of key internal operations, for performance debugging.
 * @public
 */
export const LOG_METRIC_COUNTS: boolean = false;
/**
 * Helps when debugging causes of a change notification
 * when processing an update to a hasMany relationship.
 *
 * @summary Debug logging flag that logs why a change notification fired while processing an update to a hasMany
 * relationship.
 * @public
 */
export const DEBUG_RELATIONSHIP_NOTIFICATIONS: boolean = false;

/**
 * A private flag to enable logging of the native Map/Set
 * constructor and method calls.
 *
 * EXTREMELY MALPERFORMANT
 *
 * LOG_METRIC_COUNTS must also be enabled.
 *
 * @private
 */
export const __INTERNAL_LOG_NATIVE_MAP_SET_COUNTS: boolean = false;

/**
 * Helps when debugging React specific reactivity issues.
 *
 * @summary Debug logging flag that logs how the React integration watches signals and notifies React of updates, for
 * debugging React reactivity issues.
 */
export const LOG_REACT_SIGNAL_INTEGRATION: boolean = false;
