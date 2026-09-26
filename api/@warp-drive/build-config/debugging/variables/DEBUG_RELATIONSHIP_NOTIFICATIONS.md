---
url: >-
  https://canary.warp-drive.io/api/@warp-drive/build-config/debugging/variables/DEBUG_RELATIONSHIP_NOTIFICATIONS.md
description: >-
  Debug logging flag that logs why a change notification fired while processing
  an update to a hasMany relationship.
---

&#x20;

:::warning Legacy package
`@warp-drive/build-config` is a legacy package. New code should use [`@warp-drive/core/build-config`](/api/@warp-drive/core/build-config/) instead.
:::

# &#x20;DEBUG\_RELATIONSHIP\_NOTIFICATIONS

```ts
const DEBUG_RELATIONSHIP_NOTIFICATIONS: boolean = false;
```

Defined in: [debugging.ts:140](https://github.com/warp-drive-data/warp-drive/blob/e3eb7533c9b678739ad1f65678b13bf640ce1833/warp-drive-packages/build-config/src/debugging.ts#L140)

Helps when debugging causes of a change notification
when processing an update to a hasMany relationship.
