---
url: /pr-preview/pr-11117/api/@warp-drive/core/types/params/types/Serializable.md
---

# &#x20;Serializable

```ts
type Serializable = 
  | SerializablePrimitive
  | SerializablePrimitive[];
```

Defined in: [warp-drive-packages/core/src/types/params.ts:14](https://github.com/warp-drive-data/warp-drive/blob/3e01a7f0373e29c82765d26c241a949bcf7d5b2d/warp-drive-packages/core/src/types/params.ts#L14)

A JSON-serializable value suitable for use as a query parameter value:
either a [SerializablePrimitive](SerializablePrimitive.md) or an array of them.
