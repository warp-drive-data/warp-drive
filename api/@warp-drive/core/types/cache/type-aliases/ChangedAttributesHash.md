---
url: /api/@warp-drive/core/types/cache/type-aliases/ChangedAttributesHash.md
---

# &#x20;ChangedAttributesHash

```ts
type ChangedAttributesHash = Record<string, [Value | undefined, Value]>;
```

Defined in: [warp-drive-packages/core/src/types/cache.ts:18](https://github.com/warp-drive-data/warp-drive/blob/35d5b9d62db1dc40d1d36c9cfc0536e7cab16c11/warp-drive-packages/core/src/types/cache.ts#L18)

A hash of changed attributes with the key being the attribute name and the value being an
array of `[oldValue, newValue]`.
