---
url: >-
  /pr-preview/pr-11111/api/@warp-drive/core/types/schema/fields/functions/resourceSchema.md
---

# &#x20;resourceSchema()

```ts
function resourceSchema<T>(schema): T;
```

Defined in: [warp-drive-packages/core/src/types/schema/fields.ts:2510](https://github.com/warp-drive-data/warp-drive/blob/f4874b11d917637fc69e13d92cdd6e92ce16baa8/warp-drive-packages/core/src/types/schema/fields.ts#L2510)

A no-op type utility that enables type-checking resource schema
definitions.

Will return the passed in schema.

This will not validate relationship inverses or related types,
as doing so would require a full schema graph to be passed in
and no cycles in the graph to be present.

## Type Parameters

### T

`T` *extends*
| [`PolarisResourceSchema`](../interfaces/PolarisResourceSchema.md)
| [`LegacyResourceSchema`](../interfaces/LegacyResourceSchema.md)

## Parameters

### schema

| [`PolarisResourceSchema`](../interfaces/PolarisResourceSchema.md)
| [`LegacyResourceSchema`](../interfaces/LegacyResourceSchema.md)

## Returns

`T`
