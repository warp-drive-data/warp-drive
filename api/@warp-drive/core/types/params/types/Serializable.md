---
url: /api/@warp-drive/core/types/params/types/Serializable.md
---

# &#x20;Serializable

```ts
type Serializable = 
  | SerializablePrimitive
  | SerializablePrimitive[];
```

Defined in: [warp-drive-packages/core/src/types/params.ts:14](https://github.com/warp-drive-data/warp-drive/blob/315931ffedd7d94eeba0879ee531991fe4ca5179/warp-drive-packages/core/src/types/params.ts#L14)

A JSON-serializable value suitable for use as a query parameter value:
either a [SerializablePrimitive](SerializablePrimitive.md) or an array of them.
