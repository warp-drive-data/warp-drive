---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11308/api/@warp-drive/build-config/canary-features/variables/ENFORCE_STRICT_RESOURCE_FINALIZATION.md
description: >-
  Canary feature flag that throws in development when `schema.fields` is first
  called for a resource whose traits, or its traits' traits, are missing.
---

&#x20;

:::warning Legacy package
`@warp-drive/build-config` is a legacy package. New code should use [`@warp-drive/core/build-config`](/api/@warp-drive/core/build-config/) instead.
:::

# &#x20;ENFORCE\_STRICT\_RESOURCE\_FINALIZATION&#x20;

```ts
const ENFORCE_STRICT_RESOURCE_FINALIZATION: boolean | null = false;
```

Defined in: [canary-features.ts:156](https://github.com/warp-drive-data/warp-drive/blob/8280ed61816b930e2f4b7b363858bbd832e09e17/warp-drive-packages/build-config/src/canary-features.ts#L156)

This upcoming feature adds a validation step when `schema.fields({ type })`
is called for the first time for a resource.

When active, if any trait specified by the resource or one of its traits is
missing an error will be thrown in development.
