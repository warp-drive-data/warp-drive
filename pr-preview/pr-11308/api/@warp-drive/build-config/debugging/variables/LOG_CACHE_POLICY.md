---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11308/api/@warp-drive/build-config/debugging/variables/LOG_CACHE_POLICY.md
description: >-
  Debug logging flag that logs the decisions the default CachePolicy makes about
  whether cached requests are expired or stale.
---

&#x20;

:::warning Legacy package
`@warp-drive/build-config` is a legacy package. New code should use [`@warp-drive/core/build-config`](/api/@warp-drive/core/build-config/) instead.
:::

# &#x20;LOG\_CACHE\_POLICY

```ts
const LOG_CACHE_POLICY: boolean = false;
```

Defined in: [debugging.ts:73](https://github.com/warp-drive-data/warp-drive/blob/8280ed61816b930e2f4b7b363858bbd832e09e17/warp-drive-packages/build-config/src/debugging.ts#L73)

Log decisions made by the Basic CachePolicy
