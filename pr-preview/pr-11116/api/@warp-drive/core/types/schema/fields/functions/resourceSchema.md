---
url: >-
  /pr-preview/pr-11116/api/@warp-drive/core/types/schema/fields/functions/resourceSchema.md
---

# &#x20;resourceSchema()

```ts
function resourceSchema<T>(schema): T;
```

Defined in: [warp-drive-packages/core/src/types/schema/fields.ts:2510](https://github.com/warp-drive-data/warp-drive/blob/a2f722ccb570e610770f1d852308196c7b6a911e/warp-drive-packages/core/src/types/schema/fields.ts#L2510)

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
