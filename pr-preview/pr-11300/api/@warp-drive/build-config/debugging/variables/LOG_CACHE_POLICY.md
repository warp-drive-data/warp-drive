---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11300/api/@warp-drive/build-config/debugging/variables/LOG_CACHE_POLICY.md
description: >-
  Debug logging flag that logs the decisions the default CachePolicy makes about
  whether cached requests are expired or stale.
---

&#x20;

# &#x20;LOG\_CACHE\_POLICY

:::warning Legacy package
`@warp-drive/build-config` is a legacy package. New code should use [`@warp-drive/core/build-config`](/api/@warp-drive/core/build-config/) instead.
:::

```ts
const LOG_CACHE_POLICY: boolean = false;
```

Defined in: [debugging.ts:73](https://github.com/warp-drive-data/warp-drive/blob/2060227ee98096ec39bd0c0d9fed4d0fe29fb087/warp-drive-packages/build-config/src/debugging.ts#L73)

Log decisions made by the Basic CachePolicy
