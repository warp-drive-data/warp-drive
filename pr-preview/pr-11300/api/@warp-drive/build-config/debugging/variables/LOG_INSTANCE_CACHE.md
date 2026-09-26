---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11300/api/@warp-drive/build-config/debugging/variables/LOG_INSTANCE_CACHE.md
description: >-
  Debug logging flag that logs when the store creates or removes record
  instances and their cache entries.
---

&#x20;

# &#x20;LOG\_INSTANCE\_CACHE

:::warning Legacy package
`@warp-drive/build-config` is a legacy package. New code should use [`@warp-drive/core/build-config`](/api/@warp-drive/core/build-config/) instead.
:::

```ts
const LOG_INSTANCE_CACHE: boolean = false;
```

Defined in: [debugging.ts:123](https://github.com/warp-drive-data/warp-drive/blob/2060227ee98096ec39bd0c0d9fed4d0fe29fb087/warp-drive-packages/build-config/src/debugging.ts#L123)

log creation/removal of RecordData and Record
instances.
