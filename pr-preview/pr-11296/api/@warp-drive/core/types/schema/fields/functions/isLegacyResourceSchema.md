---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11296/api/@warp-drive/core/types/schema/fields/functions/isLegacyResourceSchema.md
description: >-
  Type guard that returns true when a schema is a LegacyMode resource schema,
  meaning it is a resource schema with `legacy: true`.
---

# &#x20;isLegacyResourceSchema()

```ts
function isLegacyResourceSchema(schema: 
  | ObjectSchema
  | ResourceSchema): schema is LegacyResourceSchema;
```

Defined in: [warp-drive-packages/core/src/types/schema/fields.ts:2628](https://github.com/warp-drive-data/warp-drive/blob/185e8bf5c5a4c2c19efa2ba51317e95dc2f53384/warp-drive-packages/core/src/types/schema/fields.ts#L2628)

A type utility to narrow a schema to LegacyResourceSchema

## Parameters

### schema

| [`ObjectSchema`](../types/ObjectSchema.md)
| [`ResourceSchema`](../types/ResourceSchema.md)

## Returns

`schema is LegacyResourceSchema`
