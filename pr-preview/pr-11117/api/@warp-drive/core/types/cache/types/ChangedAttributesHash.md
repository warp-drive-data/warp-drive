---
url: >-
  /pr-preview/pr-11117/api/@warp-drive/core/types/cache/types/ChangedAttributesHash.md
---

# &#x20;ChangedAttributesHash

```ts
type ChangedAttributesHash = Record<string, [Value | undefined, Value]>;
```

Defined in: [warp-drive-packages/core/src/types/cache.ts:18](https://github.com/warp-drive-data/warp-drive/blob/efe23be24be92441a465081c00eff01e7e2cc0e8/warp-drive-packages/core/src/types/cache.ts#L18)

A hash of changed attributes with the key being the attribute name and the value being an
array of `[oldValue, newValue]`.
