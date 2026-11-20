---
url: >-
  https://canary.warp-drive.io/api/@warp-drive/core/types/schema/fields/types/ObjectFieldSchema.md
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

Defined in: [warp-drive-packages/core/src/types/schema/fields.ts:2265](https://github.com/warp-drive-data/warp-drive/blob/82d0c44ddc9be2d10e5e45f1f264e9d72673e78b/warp-drive-packages/core/src/types/schema/fields.ts#L2265)

A union of all possible field schemas that can be
used in an ObjectSchema.
