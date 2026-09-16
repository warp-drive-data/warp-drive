---
url: /api/@warp-drive/core/types/cache/type-aliases/ChangedAttributesHash.md
---

# &#x20;ChangedAttributesHash

```ts
type ChangedAttributesHash = Record<string, [Value | undefined, Value]>;
```

Defined in: [warp-drive-packages/core/src/types/cache.ts:18](https://github.com/warp-drive-data/warp-drive/blob/b6590b8852e5d32b32e3eece336d0f892e8b02a5/warp-drive-packages/core/src/types/cache.ts#L18)

A hash of changed attributes with the key being the attribute name and the value being an
array of `[oldValue, newValue]`.
