---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11302/api/@warp-drive/core/types/json/raw/types/Value.md
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

Defined in: [warp-drive-packages/core/src/types/json/raw.ts:40](https://github.com/warp-drive-data/warp-drive/blob/efb887b3989a37a1b5644c05469fcfa30c38e5c4/warp-drive-packages/core/src/types/json/raw.ts#L40)

Any valid JSON value: a [PrimitiveValue](PrimitiveValue.md), an [ArrayValue](ArrayValue.md), or an
[ObjectValue](ObjectValue.md).
