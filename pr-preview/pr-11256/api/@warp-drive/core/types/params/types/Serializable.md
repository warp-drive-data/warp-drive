---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11256/api/@warp-drive/core/types/params/types/Serializable.md
description: 'A query parameter value: one serializable primitive or an array of them.'
---

# &#x20;Serializable

```ts
type Serializable = 
  | SerializablePrimitive
  | SerializablePrimitive[];
```

Defined in: [warp-drive-packages/core/src/types/params.ts:24](https://github.com/warp-drive-data/warp-drive/blob/c095d2e6f55c70ee964e1a33fb501af9507bd094/warp-drive-packages/core/src/types/params.ts#L24)

A JSON-serializable value suitable for use as a query parameter value:
either a [SerializablePrimitive](SerializablePrimitive.md) or an array of them.
