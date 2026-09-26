---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11142/api/@warp-drive/core/types/cache/types/ChangedAttributesHash.md
---

# &#x20;ChangedAttributesHash

```ts
type ChangedAttributesHash = Record<string, [Value | undefined, Value]>;
```

Defined in: [warp-drive-packages/core/src/types/cache.ts:19](https://github.com/warp-drive-data/warp-drive/blob/fe5df5abab153c45663c00dfcbcd8d5192080e20/warp-drive-packages/core/src/types/cache.ts#L19)

A hash of changed attributes with the key being the attribute name and the value being an
array of `[oldValue, newValue]`.
