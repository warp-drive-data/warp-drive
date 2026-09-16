---
url: >-
  /pr-preview/pr-11114/api/@warp-drive/core/types/schema/fields/type-aliases/ResourceSchema.md
---

# &#x20;ResourceSchema

```ts
type ResourceSchema = 
  | PolarisResourceSchema
  | LegacyResourceSchema;
```

Defined in: [warp-drive-packages/core/src/types/schema/fields.ts:2343](https://github.com/warp-drive-data/warp-drive/blob/2a894723a738725713417f2a39f20d1a3c698f73/warp-drive-packages/core/src/types/schema/fields.ts#L2343)

A type which represents a valid JSON schema
definition for either a PolarisMode or a
LegacyMode resource.

Note, this is separate from the type returned
by the SchemaService which provides fields as a Map
instead of as an Array.
