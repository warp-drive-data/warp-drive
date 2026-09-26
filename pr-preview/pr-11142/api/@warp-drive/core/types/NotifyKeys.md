---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11142/api/@warp-drive/core/types/NotifyKeys.md
---

# &#x20;NotifyKeys&#x20;

```ts
type NotifyKeys = Set<string>;
```

Defined in: [warp-drive-packages/core/src/store/-private/managers/notification-manager.ts:43](https://github.com/warp-drive-data/warp-drive/blob/fe5df5abab153c45663c00dfcbcd8d5192080e20/warp-drive-packages/core/src/store/-private/managers/notification-manager.ts#L43)

The shape accepted by NotificationManager.notify and
CacheCapabilitiesManager.notifyChange for delivering many keys for
the `'attributes'` or `'relationships'` namespaces in a single call
instead of once per key.
