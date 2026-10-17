---
url: >-
  https://canary.warp-drive.io/api/@warp-drive/core/types/schema/fields/types/ResourceSchema.md
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

Defined in: [warp-drive-packages/core/src/types/schema/fields.ts:2451](https://github.com/warp-drive-data/warp-drive/blob/4418225138f47a5fe1f4d7ca2b61c01e985a415d/warp-drive-packages/core/src/types/schema/fields.ts#L2451)

A type which represents a valid JSON schema
definition for either a PolarisMode or a
LegacyMode resource.

The [ResourceSchemas](/guides/the-manual/schemas/resources/) guide shows how to
create and register one.

Note, this is separate from the type returned
by the SchemaService which provides fields as a Map
instead of as an Array.
