---
url: /pr-preview/pr-11117/api/@warp-drive/core/types/NotifyKeys.md
---

# &#x20;NotifyKeys&#x20;

```ts
type NotifyKeys = Set<string>;
```

Defined in: [warp-drive-packages/core/src/store/-private/managers/notification-manager.ts:43](https://github.com/warp-drive-data/warp-drive/blob/efe23be24be92441a465081c00eff01e7e2cc0e8/warp-drive-packages/core/src/store/-private/managers/notification-manager.ts#L43)

The shape accepted by NotificationManager.notify and
CacheCapabilitiesManager.notifyChange for delivering many keys for
the `'attributes'` or `'relationships'` namespaces in a single call
instead of once per key.
