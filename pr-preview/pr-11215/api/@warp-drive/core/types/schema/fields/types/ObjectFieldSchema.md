---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11215/api/@warp-drive/core/types/schema/fields/types/ObjectFieldSchema.md
description: >-
  Union of the field schemas allowed in an `ObjectSchema`, which excludes
  identity and relationship fields.
---

# &#x20;ObjectFieldSchema

```ts
type ObjectFieldSchema = 
  | LegacyAttributeField
  | GenericField
  | ObjectAliasField
  | LocalField
  | ObjectField
  | SchemaObjectField
  | ArrayField
  | SchemaArrayField
  | DerivedField;
```

Defined in: [warp-drive-packages/core/src/types/schema/fields.ts:2311](https://github.com/warp-drive-data/warp-drive/blob/3fb763e19f5f060976d06cd16557afeadd2b32c6/warp-drive-packages/core/src/types/schema/fields.ts#L2311)

A union of all possible field schemas that can be
used in an ObjectSchema.
