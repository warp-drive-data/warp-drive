---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11217/api/@warp-drive/core/types/schema/fields/types/ResourceSchema.md
---

# &#x20;ResourceSchema

```ts
type ResourceSchema = 
  | PolarisResourceSchema
  | LegacyResourceSchema;
```

Defined in: [warp-drive-packages/core/src/types/schema/fields.ts:2401](https://github.com/warp-drive-data/warp-drive/blob/d56108b6552caa25009474ead19f4e2b6cec590b/warp-drive-packages/core/src/types/schema/fields.ts#L2401)

A type which represents a valid JSON schema
definition for either a PolarisMode or a
LegacyMode resource.

Note, this is separate from the type returned
by the SchemaService which provides fields as a Map
instead of as an Array.
