---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11301/api/@warp-drive/build-config/debugging/variables/DEBUG_RELATIONSHIP_NOTIFICATIONS.md
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

Defined in: [debugging.ts:140](https://github.com/warp-drive-data/warp-drive/blob/837481248be90d10a9aca2fc068d7beb4bd3b31a/warp-drive-packages/build-config/src/debugging.ts#L140)

Helps when debugging causes of a change notification
when processing an update to a hasMany relationship.
