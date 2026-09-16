---
url: >-
  /warp-drive/pr-preview/pr-11111/api/@warp-drive/core/type-aliases/DocumentCacheOperation.md
---

# &#x20;DocumentCacheOperation

```ts
type DocumentCacheOperation = "invalidated" | "added" | "removed" | "updated" | "state";
```

Defined in: [warp-drive-packages/core/src/store/-private/managers/notification-manager.ts:20](https://github.com/warp-drive-data/warp-drive/blob/998da8d5cb68764b43a8503a38424bc85af654e3/warp-drive-packages/core/src/store/-private/managers/notification-manager.ts#L20)

The kinds of change notifications the [NotificationManager](../store/interfaces/NotificationManager.md) can emit for a request document.
