---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11300/api/@warp-drive/build-config/debugging/variables/LOG_MUTATIONS.md
description: >-
  Removed debug logging flag that no longer has any effect; use `LOG_CACHE` to
  log cache updates instead.
---

&#x20;

# &#x20;~~LOG\_MUTATIONS~~&#x20;

:::warning Legacy package
`@warp-drive/build-config` is a legacy package. New code should use [`@warp-drive/core/build-config`](/api/@warp-drive/core/build-config/) instead.
:::

```ts
const LOG_MUTATIONS: boolean = false;
```

Defined in: [debugging.ts:64](https://github.com/warp-drive-data/warp-drive/blob/2060227ee98096ec39bd0c0d9fed4d0fe29fb087/warp-drive-packages/build-config/src/debugging.ts#L64)

This flag no longer has any effect.

Use [LOG\_CACHE](LOG_CACHE.md) instead.

## Deprecated

removed in version 5.5
