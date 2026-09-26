---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11219/api/@warp-drive/core/types/schema/fields/functions/resourceSchema.md
---

# &#x20;resourceSchema()

```ts
function resourceSchema<T extends 
  | PolarisResourceSchema
  | LegacyResourceSchema>(schema: 
  | PolarisResourceSchema
  | LegacyResourceSchema): T;
```

Defined in: [warp-drive-packages/core/src/types/schema/fields.ts:2570](https://github.com/warp-drive-data/warp-drive/blob/6638c699171a70d967515a5e333c695a52540144/warp-drive-packages/core/src/types/schema/fields.ts#L2570)

A no-op type utility that enables type-checking resource schema
definitions.

Will return the passed in schema.

This will not validate relationship inverses or related types,
as doing so would require a full schema graph to be passed in
and no cycles in the graph to be present.

## Type Parameters

### T

`T` *extends*
| [`PolarisResourceSchema`](../types/PolarisResourceSchema.md)
| [`LegacyResourceSchema`](../types/LegacyResourceSchema.md)

## Parameters

### schema

| [`PolarisResourceSchema`](../types/PolarisResourceSchema.md)
| [`LegacyResourceSchema`](../types/LegacyResourceSchema.md)

## Returns

`T`
