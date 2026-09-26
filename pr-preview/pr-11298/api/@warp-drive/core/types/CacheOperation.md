---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11298/api/@warp-drive/core/types/CacheOperation.md
description: >-
  The lifecycle notification kinds sent to resource subscribers: `added`,
  `removed`, `updated`, or `state`.
---

# &#x20;CacheOperation

```ts
type CacheOperation = "added" | "removed" | "updated" | "state";
```

Defined in: [warp-drive-packages/core/src/store/-private/managers/notification-manager.ts:19](https://github.com/warp-drive-data/warp-drive/blob/beb5a43c684bb64f8448b3f6ac02cc3682c9c9c0/warp-drive-packages/core/src/store/-private/managers/notification-manager.ts#L19)

The kinds of change notifications the [NotificationManager](../store/types/NotificationManager.md) can emit for a resource.
