/**
 * @module
 * @summary The `DefaultCachePolicy` and `parseCacheControl` for expiring cached requests, plus the
 * `NotificationManager` type for subscribing to cache change notifications.
 */

export {
  DefaultCachePolicy,
  type PolicyConfig,
  type CacheControlValue,
  parseCacheControl,
} from './store/-private/default-cache-policy';

export type { NotificationManager } from './store/-private/managers/notification-manager';
