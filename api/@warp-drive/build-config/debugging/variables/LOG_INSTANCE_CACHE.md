---
url: >-
  https://canary.warp-drive.io/api/@warp-drive/build-config/debugging/variables/LOG_INSTANCE_CACHE.md
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

Defined in: [debugging.ts:123](https://github.com/warp-drive-data/warp-drive/blob/e3eb7533c9b678739ad1f65678b13bf640ce1833/warp-drive-packages/build-config/src/debugging.ts#L123)

log creation/removal of RecordData and Record
instances.
