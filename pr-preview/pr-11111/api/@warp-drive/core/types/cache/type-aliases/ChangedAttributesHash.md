---
url: >-
  /warp-drive/pr-preview/pr-11111/api/@warp-drive/core/types/cache/type-aliases/ChangedAttributesHash.md
---

# &#x20;ChangedAttributesHash

```ts
type ChangedAttributesHash = Record<string, [Value | undefined, Value]>;
```

Defined in: [warp-drive-packages/core/src/types/cache.ts:18](https://github.com/warp-drive-data/warp-drive/blob/b666081685917e201667ff79e86b876c0e12fb8c/warp-drive-packages/core/src/types/cache.ts#L18)

A hash of changed attributes with the key being the attribute name and the value being an
array of `[oldValue, newValue]`.
