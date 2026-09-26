---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11266/api/@warp-drive/core/types/params/types/Serializable.md
---

# &#x20;Serializable

```ts
type Serializable = 
  | SerializablePrimitive
  | SerializablePrimitive[];
```

Defined in: [warp-drive-packages/core/src/types/params.ts:14](https://github.com/warp-drive-data/warp-drive/blob/1a7c85f0c565d334929c0f2dd26023bb9bbcb6f7/warp-drive-packages/core/src/types/params.ts#L14)

A JSON-serializable value suitable for use as a query parameter value:
either a [SerializablePrimitive](SerializablePrimitive.md) or an array of them.
