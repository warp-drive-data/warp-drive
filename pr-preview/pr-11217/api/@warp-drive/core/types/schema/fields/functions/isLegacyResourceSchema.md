---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11217/api/@warp-drive/core/types/schema/fields/functions/isLegacyResourceSchema.md
---

# &#x20;isLegacyResourceSchema()

```ts
function isLegacyResourceSchema(schema: 
  | ObjectSchema
  | ResourceSchema): schema is LegacyResourceSchema;
```

Defined in: [warp-drive-packages/core/src/types/schema/fields.ts:2629](https://github.com/warp-drive-data/warp-drive/blob/d56108b6552caa25009474ead19f4e2b6cec590b/warp-drive-packages/core/src/types/schema/fields.ts#L2629)

A type utility to narrow a schema to LegacyResourceSchema

## Parameters

### schema

| [`ObjectSchema`](../types/ObjectSchema.md)
| [`ResourceSchema`](../types/ResourceSchema.md)

## Returns

`schema is LegacyResourceSchema`
