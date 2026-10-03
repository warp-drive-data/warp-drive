---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11256/api/@warp-drive/core/types/schema/fields/types/ResourceSchema.md
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

Defined in: [warp-drive-packages/core/src/types/schema/fields.ts:2451](https://github.com/warp-drive-data/warp-drive/blob/946e8e508ccc518b884ee84085a229c80a7f5eb4/warp-drive-packages/core/src/types/schema/fields.ts#L2451)

A type which represents a valid JSON schema
definition for either a PolarisMode or a
LegacyMode resource.

The [ResourceSchemas](/guides/the-manual/schemas/resources/) guide shows how to
create and register one.

Note, this is separate from the type returned
by the SchemaService which provides fields as a Map
instead of as an Array.
