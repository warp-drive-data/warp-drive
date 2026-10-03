---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11291/api/@warp-drive/core/types/json/raw/types/Value.md
description: >-
  Any JSON-serializable value (primitive, array, or object), used for raw field
  and payload data throughout WarpDrive.
---

# &#x20;Value

```ts
type Value = 
  | PrimitiveValue
  | ArrayValue
  | ObjectValue;
```

Defined in: [warp-drive-packages/core/src/types/json/raw.ts:40](https://github.com/warp-drive-data/warp-drive/blob/29ab359ab5e9593db23fe661b989f7544558d789/warp-drive-packages/core/src/types/json/raw.ts#L40)

Any valid JSON value: a [PrimitiveValue](PrimitiveValue.md), an [ArrayValue](ArrayValue.md), or an
[ObjectValue](ObjectValue.md).
