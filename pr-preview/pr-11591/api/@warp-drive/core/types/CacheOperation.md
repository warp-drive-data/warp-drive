---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11591/api/@warp-drive/core/types/CacheOperation.md
description: >-
  The lifecycle notification kinds sent to resource subscribers: `added`,
  `removed`, `updated`, or `state`.
---

# &#x20;CacheOperation

```ts
type CacheOperation = "added" | "removed" | "updated" | "state";
```

Defined in: [warp-drive-packages/core/src/store/-private/managers/notification-manager.ts:19](https://github.com/warp-drive-data/warp-drive/blob/9c2735130cb7e538efd4f469011486719a416544/warp-drive-packages/core/src/store/-private/managers/notification-manager.ts#L19)

The kinds of change notifications the [NotificationManager](../store/types/NotificationManager.md) can emit for a resource.
