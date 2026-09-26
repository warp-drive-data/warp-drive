---
url: >-
  https://canary.warp-drive.io/api/@warp-drive/core/types/json/raw/types/Value.md
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

Defined in: [warp-drive-packages/core/src/types/json/raw.ts:40](https://github.com/warp-drive-data/warp-drive/blob/0491c8693bd1f37a23e5f2c61ac79e025249c535/warp-drive-packages/core/src/types/json/raw.ts#L40)

Any valid JSON value: a [PrimitiveValue](PrimitiveValue.md), an [ArrayValue](ArrayValue.md), or an
[ObjectValue](ObjectValue.md).
