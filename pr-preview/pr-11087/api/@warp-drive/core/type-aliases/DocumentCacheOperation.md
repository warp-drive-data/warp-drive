---
url: >-
  /pr-preview/pr-11087/api/@warp-drive/core/type-aliases/DocumentCacheOperation.md
---

# &#x20;DocumentCacheOperation

```ts
type DocumentCacheOperation = "invalidated" | "added" | "removed" | "updated" | "state";
```

Defined in: [warp-drive-packages/core/src/store/-private/managers/notification-manager.ts:20](https://github.com/warp-drive-data/warp-drive/blob/53f90949527307caf1710da014dad97fc5e3ab13/warp-drive-packages/core/src/store/-private/managers/notification-manager.ts#L20)

The kinds of change notifications the [NotificationManager](../store/interfaces/NotificationManager.md) can emit for a request document.
