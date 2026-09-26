---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11305/api/@warp-drive/core/types/schema/fields/types/ResourceSchema.md
description: >-
  Union of the PolarisMode and LegacyMode schema definitions for a primary
  resource type, as registered with the schema service.
---

# &#x20;ResourceSchema

```ts
type ResourceSchema = 
  | PolarisResourceSchema
  | LegacyResourceSchema;
```

Defined in: [warp-drive-packages/core/src/types/schema/fields.ts:2410](https://github.com/warp-drive-data/warp-drive/blob/9aac0cccca5b7489c38352b1f0d67d77818a333a/warp-drive-packages/core/src/types/schema/fields.ts#L2410)

A type which represents a valid JSON schema
definition for either a PolarisMode or a
LegacyMode resource.

Note, this is separate from the type returned
by the SchemaService which provides fields as a Map
instead of as an Array.
