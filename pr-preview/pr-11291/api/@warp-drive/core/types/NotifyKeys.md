---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11291/api/@warp-drive/core/types/NotifyKeys.md
description: >-
  A set of field names passed to `notify` or `notifyChange` to report many
  `attributes` or `relationships` changes in one call.
---

# &#x20;NotifyKeys&#x20;

```ts
type NotifyKeys = Set<string>;
```

Defined in: [warp-drive-packages/core/src/store/-private/managers/notification-manager.ts:54](https://github.com/warp-drive-data/warp-drive/blob/386ea92f352abcdc370b266f4efd3b092b378453/warp-drive-packages/core/src/store/-private/managers/notification-manager.ts#L54)

The shape accepted by NotificationManager.notify and
CacheCapabilitiesManager.notifyChange for delivering many keys for
the `'attributes'` or `'relationships'` namespaces in a single call
instead of once per key.
