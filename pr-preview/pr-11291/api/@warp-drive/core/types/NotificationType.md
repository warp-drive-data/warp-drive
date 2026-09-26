---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11291/api/@warp-drive/core/types/NotificationType.md
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

Defined in: [warp-drive-packages/core/src/store/-private/managers/notification-manager.ts:32](https://github.com/warp-drive-data/warp-drive/blob/aed3f52874c34501c8eb0b5a5a50cc1fceaf02b9/warp-drive-packages/core/src/store/-private/managers/notification-manager.ts#L32)

The full set of notification kinds the [NotificationManager](../store/types/NotificationManager.md) can emit for a resource,
including both [CacheOperation](CacheOperation.md)s and finer-grained field-level change notifications.
