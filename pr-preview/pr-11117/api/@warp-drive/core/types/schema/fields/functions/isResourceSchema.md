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

Defined in: [warp-drive-packages/core/src/types/schema/fields.ts:2533](https://github.com/warp-drive-data/warp-drive/blob/623a258c52ac8495e1a82b91f595393c2bc553ec/warp-drive-packages/core/src/types/schema/fields.ts#L2533)

A type utility to narrow a schema to a ResourceSchema

## Parameters

### schema

| [`ResourceSchema`](../types/ResourceSchema.md)
| [`ObjectSchema`](../types/ObjectSchema.md)

## Returns

`schema is ResourceSchema`
