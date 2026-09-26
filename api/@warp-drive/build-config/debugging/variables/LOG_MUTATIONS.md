---
url: >-
  https://canary.warp-drive.io/api/@warp-drive/build-config/debugging/variables/LOG_MUTATIONS.md
description: >-
  Removed debug logging flag that no longer has any effect; use `LOG_CACHE` to
  log cache updates instead.
---

&#x20;

:::warning Legacy package
`@warp-drive/build-config` is a legacy package. New code should use [`@warp-drive/core/build-config`](/api/@warp-drive/core/build-config/) instead.
:::

# &#x20;~~LOG\_MUTATIONS~~&#x20;

```ts
const LOG_MUTATIONS: boolean = false;
```

Defined in: [debugging.ts:64](https://github.com/warp-drive-data/warp-drive/blob/ab446faa777b02e3f65bc760ce1b94788e490c4d/warp-drive-packages/build-config/src/debugging.ts#L64)

This flag no longer has any effect.

Use [LOG\_CACHE](LOG_CACHE.md) instead.

## Deprecated

removed in version 5.5
