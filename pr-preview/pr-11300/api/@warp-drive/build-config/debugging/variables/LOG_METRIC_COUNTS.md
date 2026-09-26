---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11300/api/@warp-drive/build-config/debugging/variables/LOG_METRIC_COUNTS.md
description: >-
  Debug logging flag that logs counts of key internal operations, for
  performance debugging.
---

&#x20;

# &#x20;LOG\_METRIC\_COUNTS

:::warning Legacy package
`@warp-drive/build-config` is a legacy package. New code should use [`@warp-drive/core/build-config`](/api/@warp-drive/core/build-config/) instead.
:::

```ts
const LOG_METRIC_COUNTS: boolean = false;
```

Defined in: [debugging.ts:131](https://github.com/warp-drive-data/warp-drive/blob/2060227ee98096ec39bd0c0d9fed4d0fe29fb087/warp-drive-packages/build-config/src/debugging.ts#L131)

Log key count metrics, useful for performance
debugging.
