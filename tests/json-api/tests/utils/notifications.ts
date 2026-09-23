import type { NotificationChannel, NotificationType, Store } from '@warp-drive/core';
import type { ResourceKey } from '@warp-drive/core/types/identifier';

/**
 * Helpers for tests that observe what `NotificationManager` actually delivers to a subscriber:
 * how it coalesces calls, filters them by channel, and orders them. `assert.notified` and
 * `assert.notifiedOn` count calls *into* `notify()`, before any of that happens, so a test of the
 * manager's own behavior records deliveries instead.
 */

interface TestableNotifications {
  _scheduleNotify: () => boolean;
  _flush: () => void;
}

// subscriber callbacks are typed as `key?: string`, but a keyless/wildcard
// dispatch passes `null` through at runtime (see `_flushNotification`), so
// the tuple type here must allow for it.
export type Delivery = [type: NotificationType, key: string | null | undefined];

/**
 * `NotificationManager#notify` only buffers multiple calls together (instead
 * of each individually flushing on its own) when a consumer (e.g. an app
 * using `@warp-drive/ember`/`@warp-drive/react`) has configured signal hooks
 * and is inside an active async-flush window. Rather than depending on that
 * unrelated, environment-specific machinery to test the buffer's merge and
 * dispatch logic in isolation, we stub out `_scheduleNotify` (the method
 * responsible for deciding *when* to flush) to always defer, so every
 * `notify()` call in a test merges into the pending buffer without
 * triggering a flush. Calling the real, private `_flush()` afterwards (see
 * `flush` below) then lets a test assert on exactly what was buffered and in
 * what order it is dispatched.
 *
 * Returns a function that restores the original `_scheduleNotify`.
 */
export function deferFlushes(store: Store): () => void {
  const notifications = store.notifications as unknown as TestableNotifications;
  const original = notifications._scheduleNotify;
  notifications._scheduleNotify = () => false;
  return () => {
    notifications._scheduleNotify = original;
  };
}

/** Dispatches everything buffered while `deferFlushes` was in effect. */
export function flush(store: Store): void {
  (store.notifications as unknown as TestableNotifications)._flush();
}

/**
 * Subscribes to `identifier` and returns the list every delivery is appended
 * to, in dispatch order. `channel` is passed through to `subscribe`; omit it
 * for the default (`'local'`) subscriber. The subscription lives as long as
 * the store, so create a fresh store per test.
 */
export function recordDeliveries(store: Store, identifier: ResourceKey, channel?: NotificationChannel): Delivery[] {
  const deliveries: Delivery[] = [];
  store.notifications.subscribe(
    identifier,
    (_key: ResourceKey, type: NotificationType, key?: string | null) => {
      deliveries.push([type, key]);
    },
    channel
  );
  return deliveries;
}
