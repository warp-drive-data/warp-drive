---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11298/api/@warp-drive/build-config/debugging/variables/LOG_INSTANCE_CACHE.md
description: >-
  Debug logging flag that logs when the store creates or removes record
  instances and their cache entries.
---

&#x20;

:::warning Legacy package
`@warp-drive/build-config` is a legacy package. New code should use [`@warp-drive/core/build-config`](/api/@warp-drive/core/build-config/) instead.
:::

# &#x20;LOG\_INSTANCE\_CACHE

```ts
const LOG_INSTANCE_CACHE: boolean = false;
```

Defined in: [debugging.ts:123](https://github.com/warp-drive-data/warp-drive/blob/4d4cead95c05ff5401f363d09091c24064d740c1/warp-drive-packages/build-config/src/debugging.ts#L123)

log creation/removal of RecordData and Record
instances.
