---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11285/api/@warp-drive/core/types/schema/fields/functions/isLegacyResourceSchema.md
---

# &#x20;isLegacyResourceSchema()

```ts
function isLegacyResourceSchema(schema: 
  | ObjectSchema
  | ResourceSchema): schema is LegacyResourceSchema;
```

Defined in: [warp-drive-packages/core/src/types/schema/fields.ts:2548](https://github.com/warp-drive-data/warp-drive/blob/a684b0bff04424079998b2ab945da7505a92652d/warp-drive-packages/core/src/types/schema/fields.ts#L2548)

A type utility to narrow a schema to LegacyResourceSchema

## Parameters

### schema

| [`ObjectSchema`](../types/ObjectSchema.md)
| [`ResourceSchema`](../types/ResourceSchema.md)

## Returns

`schema is LegacyResourceSchema`
