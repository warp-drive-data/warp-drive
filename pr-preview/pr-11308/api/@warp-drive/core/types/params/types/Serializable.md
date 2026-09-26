---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11308/api/@warp-drive/core/types/params/types/Serializable.md
description: 'A query parameter value: one serializable primitive or an array of them.'
---

# &#x20;Serializable

```ts
type Serializable = 
  | SerializablePrimitive
  | SerializablePrimitive[];
```

Defined in: [warp-drive-packages/core/src/types/params.ts:24](https://github.com/warp-drive-data/warp-drive/blob/8280ed61816b930e2f4b7b363858bbd832e09e17/warp-drive-packages/core/src/types/params.ts#L24)

A JSON-serializable value suitable for use as a query parameter value:
either a [SerializablePrimitive](SerializablePrimitive.md) or an array of them.
