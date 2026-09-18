---
url: /api/@warp-drive/core/types/schema/fields/functions/isLegacyResourceSchema.md
---

# &#x20;isLegacyResourceSchema()

```ts
function isLegacyResourceSchema(schema: 
  | ResourceSchema
  | ObjectSchema): schema is LegacyResourceSchema;
```

Defined in: [warp-drive-packages/core/src/types/schema/fields.ts:2542](https://github.com/warp-drive-data/warp-drive/blob/046b5e826d481c655eb9c1dd03a0fb171a65e0f3/warp-drive-packages/core/src/types/schema/fields.ts#L2542)

A type utility to narrow a schema to LegacyResourceSchema

## Parameters

### schema

| [`ResourceSchema`](../types/ResourceSchema.md)
| [`ObjectSchema`](../types/ObjectSchema.md)

## Returns

`schema is LegacyResourceSchema`
