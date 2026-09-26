---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11300/api/@warp-drive/build-config/debugging/variables/DEBUG_RELATIONSHIP_NOTIFICATIONS.md
description: >-
  Debug logging flag that logs why a change notification fired while processing
  an update to a hasMany relationship.
---

&#x20;

# &#x20;DEBUG\_RELATIONSHIP\_NOTIFICATIONS

:::warning Legacy package
`@warp-drive/build-config` is a legacy package. New code should use [`@warp-drive/core/build-config`](/api/@warp-drive/core/build-config/) instead.
:::

```ts
const DEBUG_RELATIONSHIP_NOTIFICATIONS: boolean = false;
```

Defined in: [debugging.ts:140](https://github.com/warp-drive-data/warp-drive/blob/2060227ee98096ec39bd0c0d9fed4d0fe29fb087/warp-drive-packages/build-config/src/debugging.ts#L140)

Helps when debugging causes of a change notification
when processing an update to a hasMany relationship.
