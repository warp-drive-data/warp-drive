---
url: >-
  /pr-preview/pr-11117/api/@warp-drive/core/types/schema/fields/functions/isResourceSchema.md
---

# &#x20;isResourceSchema()

```ts
function isResourceSchema(schema: 
  | ResourceSchema
  | ObjectSchema): schema is ResourceSchema;
```

Defined in: [warp-drive-packages/core/src/types/schema/fields.ts:2533](https://github.com/warp-drive-data/warp-drive/blob/3e01a7f0373e29c82765d26c241a949bcf7d5b2d/warp-drive-packages/core/src/types/schema/fields.ts#L2533)

A type utility to narrow a schema to a ResourceSchema

## Parameters

### schema

| [`ResourceSchema`](../types/ResourceSchema.md)
| [`ObjectSchema`](../types/ObjectSchema.md)

## Returns

`schema is ResourceSchema`
