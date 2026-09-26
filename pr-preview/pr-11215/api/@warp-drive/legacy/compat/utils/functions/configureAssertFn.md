---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11215/api/@warp-drive/legacy/compat/utils/functions/configureAssertFn.md
---

&#x20;

# &#x20;configureAssertFn()

```ts
function configureAssertFn(fn: (message: string, condition: unknown) => void): void;
```

Defined in: [warp-drive-packages/legacy/src/compat/utils.ts:53](https://github.com/warp-drive-data/warp-drive/blob/f4202d9dd05bfed96e9817932375376847507c24/warp-drive-packages/legacy/src/compat/utils.ts#L53)

Configure a function to be called when an id or type
fails validation. This is useful for instrumenting
to discover places where usage in the app is not consistent.

## Parameters

### fn

(`message`: `string`, `condition`: `unknown`) => `void`

a function which takes a message and a condition

## Returns

`void`
