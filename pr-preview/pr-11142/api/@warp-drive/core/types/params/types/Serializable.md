---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11142/api/@warp-drive/core/types/params/types/Serializable.md
---

# &#x20;Serializable

```ts
type Serializable = 
  | SerializablePrimitive
  | SerializablePrimitive[];
```

Defined in: [warp-drive-packages/core/src/types/params.ts:14](https://github.com/warp-drive-data/warp-drive/blob/fe5df5abab153c45663c00dfcbcd8d5192080e20/warp-drive-packages/core/src/types/params.ts#L14)

A JSON-serializable value suitable for use as a query parameter value:
either a [SerializablePrimitive](SerializablePrimitive.md) or an array of them.
