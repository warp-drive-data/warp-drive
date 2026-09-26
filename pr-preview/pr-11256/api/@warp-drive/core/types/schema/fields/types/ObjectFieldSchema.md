---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11256/api/@warp-drive/core/types/schema/fields/types/ObjectFieldSchema.md
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

Defined in: [warp-drive-packages/core/src/types/schema/fields.ts:2175](https://github.com/warp-drive-data/warp-drive/blob/eaabe67f41c439777a4aea3b876394f6f0c3bd02/warp-drive-packages/core/src/types/schema/fields.ts#L2175)

A union of all possible field schemas that can be
used in an ObjectSchema.
