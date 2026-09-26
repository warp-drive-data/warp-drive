---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11217/api/@warp-drive/build-config/canary-features/variables/ENFORCE_STRICT_RESOURCE_FINALIZATION.md
---

# &#x20;ENFORCE\_STRICT\_RESOURCE\_FINALIZATION&#x20;

```ts
const ENFORCE_STRICT_RESOURCE_FINALIZATION: boolean | null = false;
```

Defined in: [canary-features.ts:150](https://github.com/warp-drive-data/warp-drive/blob/d56108b6552caa25009474ead19f4e2b6cec590b/warp-drive-packages/build-config/src/canary-features.ts#L150)

This upcoming feature adds a validation step when `schema.fields({ type })`
is called for the first time for a resource.

When active, if any trait specified by the resource or one of its traits is
missing an error will be thrown in development.
