---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11291/api/@warp-drive/core/types/schema/fields/types/ObjectFieldSchema.md
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

Defined in: [warp-drive-packages/core/src/types/schema/fields.ts:2175](https://github.com/warp-drive-data/warp-drive/blob/aed3f52874c34501c8eb0b5a5a50cc1fceaf02b9/warp-drive-packages/core/src/types/schema/fields.ts#L2175)

A union of all possible field schemas that can be
used in an ObjectSchema.
