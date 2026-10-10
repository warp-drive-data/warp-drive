---
url: https://canary.warp-drive.io/api/@warp-drive/core/types/CacheOperation.md
description: >-
  The lifecycle notification kinds sent to resource subscribers: `added`,
  `removed`, `updated`, or `state`.
---

# &#x20;CacheOperation

```ts
type CacheOperation = "added" | "removed" | "updated" | "state";
```

Defined in: [warp-drive-packages/core/src/store/-private/managers/notification-manager.ts:19](https://github.com/warp-drive-data/warp-drive/blob/48dc0d277b98008082669dadc6a52e5c5682ef8e/warp-drive-packages/core/src/store/-private/managers/notification-manager.ts#L19)

The kinds of change notifications the [NotificationManager](../store/types/NotificationManager.md) can emit for a resource.
