---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11298/api/@warp-drive/build-config/debugging/variables/LOG_PAYLOADS.md
description: >-
  Removed debug logging flag that no longer has any effect; use `LOG_CACHE` to
  log cache updates instead.
---

&#x20;

:::warning Legacy package
`@warp-drive/build-config` is a legacy package. New code should use [`@warp-drive/core/build-config`](/api/@warp-drive/core/build-config/) instead.
:::

# &#x20;~~LOG\_PAYLOADS~~&#x20;

```ts
const LOG_PAYLOADS: boolean = false;
```

Defined in: [debugging.ts:38](https://github.com/warp-drive-data/warp-drive/blob/4d4cead95c05ff5401f363d09091c24064d740c1/warp-drive-packages/build-config/src/debugging.ts#L38)

This flag no longer has any effect.

Use [LOG\_CACHE](LOG_CACHE.md) instead.

## Deprecated

removed in version 5.5
