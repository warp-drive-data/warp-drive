---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11215/api/@warp-drive/core/types/cache/types/ChangedAttributesHash.md
---

# &#x20;ChangedAttributesHash

```ts
type ChangedAttributesHash = Record<string, [Value | undefined, Value]>;
```

Defined in: [warp-drive-packages/core/src/types/cache.ts:19](https://github.com/warp-drive-data/warp-drive/blob/f4202d9dd05bfed96e9817932375376847507c24/warp-drive-packages/core/src/types/cache.ts#L19)

A hash of changed attributes with the key being the attribute name and the value being an
array of `[oldValue, newValue]`.
