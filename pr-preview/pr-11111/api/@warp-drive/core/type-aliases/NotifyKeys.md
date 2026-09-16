---
url: >-
  /warp-drive/pr-preview/pr-11111/api/@warp-drive/core/type-aliases/NotifyKeys.md
---

# &#x20;NotifyKeys&#x20;

```ts
type NotifyKeys = Set<string>;
```

Defined in: [warp-drive-packages/core/src/store/-private/managers/notification-manager.ts:43](https://github.com/warp-drive-data/warp-drive/blob/998da8d5cb68764b43a8503a38424bc85af654e3/warp-drive-packages/core/src/store/-private/managers/notification-manager.ts#L43)

The shape accepted by NotificationManager.notify and
CacheCapabilitiesManager.notifyChange for delivering many keys for
the `'attributes'` or `'relationships'` namespaces in a single call
instead of once per key.
