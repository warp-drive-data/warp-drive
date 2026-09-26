---
url: >-
  https://canary.warp-drive.io/api/@warp-drive/core/types/params/types/Serializable.md
description: 'A query parameter value: one serializable primitive or an array of them.'
---

# &#x20;Serializable

```ts
type Serializable = 
  | SerializablePrimitive
  | SerializablePrimitive[];
```

Defined in: [warp-drive-packages/core/src/types/params.ts:24](https://github.com/warp-drive-data/warp-drive/blob/84081dc1da3e764fc56a2cdce4df50ea41e2704c/warp-drive-packages/core/src/types/params.ts#L24)

A JSON-serializable value suitable for use as a query parameter value:
either a [SerializablePrimitive](SerializablePrimitive.md) or an array of them.
