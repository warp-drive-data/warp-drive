---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11285/api/@warp-drive/core/types/NotificationType.md
---

# &#x20;NotificationType

```ts
type NotificationType = 
  | "attributes"
  | "relationships"
  | "identity"
  | "errors"
  | "meta"
  | CacheOperation;
```

Defined in: [warp-drive-packages/core/src/store/-private/managers/notification-manager.ts:32](https://github.com/warp-drive-data/warp-drive/blob/a684b0bff04424079998b2ab945da7505a92652d/warp-drive-packages/core/src/store/-private/managers/notification-manager.ts#L32)

The full set of notification kinds the [NotificationManager](../store/types/NotificationManager.md) can emit for a resource,
including both [CacheOperation](CacheOperation.md)s and finer-grained field-level change notifications.
