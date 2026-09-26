---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11300/api/@warp-drive/build-config/deprecations/variables/DEPRECATE_MANY_ARRAY_DUPLICATES.md
description: >-
  Deprecation flag for adding duplicate records to a ManyArray; when `false`,
  adding duplicates throws an error instead of being deduped.
---

&#x20;

# &#x20;DEPRECATE\_MANY\_ARRAY\_DUPLICATES&#x20;

:::warning Legacy package
`@warp-drive/build-config` is a legacy package. New code should use [`@warp-drive/core/build-config`](/api/@warp-drive/core/build-config/) instead.
:::

```ts
const DEPRECATE_MANY_ARRAY_DUPLICATES: boolean = true;
```

Defined in: [deprecations.ts:423](https://github.com/warp-drive-data/warp-drive/blob/2060227ee98096ec39bd0c0d9fed4d0fe29fb087/warp-drive-packages/build-config/src/deprecations.ts#L423)

When the flag is `true` (default), adding duplicate records to a `ManyArray`
is deprecated in non-production environments. In production environments,
duplicate records added to a `ManyArray` will be deduped and no error will
be thrown.

When the flag is `false`, an error will be thrown when duplicates are added.

## Until

6.0
