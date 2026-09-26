---
url: >-
  https://canary.warp-drive.io/api/@warp-drive/build-config/deprecations/variables/DEPRECATE_NON_STRICT_ID.md
description: >-
  Deprecation flag for legacy support of numeric resource IDs that are coerced
  to strings; set it to `false` once resolved to strip that support.
---

&#x20;

:::warning Legacy package
`@warp-drive/build-config` is a legacy package. New code should use [`@warp-drive/core/build-config`](/api/@warp-drive/core/build-config/) instead.
:::

# &#x20;DEPRECATE\_NON\_STRICT\_ID&#x20;

```ts
const DEPRECATE_NON_STRICT_ID: boolean = true;
```

Defined in: [deprecations.ts:193](https://github.com/warp-drive-data/warp-drive/blob/e3eb7533c9b678739ad1f65678b13bf640ce1833/warp-drive-packages/build-config/src/deprecations.ts#L193)

Currently, WarpDrive expects that the `id` property associated with
a resource is a string.

However, for legacy support in many locations we would accept a number
which would then immediately be coerced into a string.

We are deprecating this legacy support for numeric IDs.

The goal is that in the future, you will be able to use any ID format
so long as everywhere you refer to the ID you use the same format.

However, for identifiers we will always use string IDs and so any
custom identifier configuration should provide a string ID.

## Until

6.0
