---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11220/api/@warp-drive/core/build-config/canary-features/variables/ENFORCE_STRICT_RESOURCE_FINALIZATION.md
description: >-
  Canary feature flag that throws in development when `schema.fields` is first
  called for a resource whose traits, or its traits' traits, are missing.
---

# &#x20;ENFORCE_STRICT_RESOURCE_FINALIZATION&#x20;

```ts
const ENFORCE_STRICT_RESOURCE_FINALIZATION: boolean | null;
```

Defined in: [warp-drive-packages/build-config/src/canary-features.ts:156](https://github.com/warp-drive-data/warp-drive/blob/37b729cb1f8483d0de8bbbe89258e7a61745f8ed/warp-drive-packages/build-config/src/canary-features.ts#L156)

This upcoming feature adds a validation step when `schema.fields({ type })`
is called for the first time for a resource.

When active, if any trait specified by the resource or one of its traits is
missing an error will be thrown in development.
