---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11305/api/@warp-drive/build-config/debugging/variables/LOG_OPERATIONS.md
description: >-
  Removed debug logging flag that no longer has any effect; use `LOG_CACHE` to
  log cache updates instead.
---

&#x20;

:::warning Legacy package
`@warp-drive/build-config` is a legacy package. New code should use [`@warp-drive/core/build-config`](/api/@warp-drive/core/build-config/) instead.
:::

# &#x20;~~LOG\_OPERATIONS~~&#x20;

```ts
const LOG_OPERATIONS: boolean = false;
```

Defined in: [debugging.ts:51](https://github.com/warp-drive-data/warp-drive/blob/9aac0cccca5b7489c38352b1f0d67d77818a333a/warp-drive-packages/build-config/src/debugging.ts#L51)

This flag no longer has any effect.

Use [LOG\_CACHE](LOG_CACHE.md) instead.

## Deprecated

removed in version 5.5
