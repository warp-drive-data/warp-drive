---
url: /api/@warp-drive/core/type-aliases/DocumentCacheOperation.md
---

# &#x20;DocumentCacheOperation

```ts
type DocumentCacheOperation = "invalidated" | "added" | "removed" | "updated" | "state";
```

Defined in: [warp-drive-packages/core/src/store/-private/managers/notification-manager.ts:20](https://github.com/warp-drive-data/warp-drive/blob/b6590b8852e5d32b32e3eece336d0f892e8b02a5/warp-drive-packages/core/src/store/-private/managers/notification-manager.ts#L20)

The kinds of change notifications the [NotificationManager](../store/interfaces/NotificationManager.md) can emit for a request document.
