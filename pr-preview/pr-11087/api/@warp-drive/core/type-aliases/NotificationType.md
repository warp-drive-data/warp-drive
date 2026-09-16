---
url: /pr-preview/pr-11087/api/@warp-drive/core/type-aliases/NotificationType.md
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

Defined in: [warp-drive-packages/core/src/store/-private/managers/notification-manager.ts:32](https://github.com/warp-drive-data/warp-drive/blob/53f90949527307caf1710da014dad97fc5e3ab13/warp-drive-packages/core/src/store/-private/managers/notification-manager.ts#L32)

The full set of notification kinds the [NotificationManager](../store/interfaces/NotificationManager.md) can emit for a resource,
including both [CacheOperation](CacheOperation.md)s and finer-grained field-level change notifications.
