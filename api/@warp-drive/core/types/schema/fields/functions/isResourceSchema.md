---
url: >-
  https://canary.warp-drive.io/api/@warp-drive/core/types/schema/fields/functions/isResourceSchema.md
description: >-
  Type guard that returns true when a schema is a resource schema, meaning its
  identity field is of kind `@id`.
---

# &#x20;isResourceSchema()

```ts
function isResourceSchema(schema: 
  | ObjectSchema
  | ResourceSchema): schema is ResourceSchema;
```

Defined in: [warp-drive-packages/core/src/types/schema/fields.ts:2617](https://github.com/warp-drive-data/warp-drive/blob/04cea93913a7a25c755902c8d51a14fc830e6695/warp-drive-packages/core/src/types/schema/fields.ts#L2617)

A type utility to narrow a schema to a ResourceSchema

## Parameters

### schema

| [`ObjectSchema`](../types/ObjectSchema.md)
| [`ResourceSchema`](../types/ResourceSchema.md)

## Returns

`schema is ResourceSchema`
