---
url: >-
  https://canary.warp-drive.io/api/@warp-drive/core/types/schema/fields/functions/isLegacyResourceSchema.md
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

Defined in: [warp-drive-packages/core/src/types/schema/fields.ts:2628](https://github.com/warp-drive-data/warp-drive/blob/7d14928562bb412c61b403e577095b9a3f9cb0b7/warp-drive-packages/core/src/types/schema/fields.ts#L2628)

A type utility to narrow a schema to LegacyResourceSchema

## Parameters

### schema

| [`ObjectSchema`](../types/ObjectSchema.md)
| [`ResourceSchema`](../types/ResourceSchema.md)

## Returns

`schema is LegacyResourceSchema`
