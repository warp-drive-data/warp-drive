---
url: >-
  https://canary.warp-drive.io/api/@warp-drive/core/types/schema/fields/types/PolarisModeFieldSchema.md
description: >-
  Union of every field schema allowed on a PolarisMode resource schema, with
  relationships limited to their LinksMode forms.
---

# &#x20;PolarisModeFieldSchema

```ts
type PolarisModeFieldSchema = 
  | GenericField
  | PolarisAliasField
  | LocalField
  | ObjectField
  | SchemaObjectField
  | ArrayField
  | SchemaArrayField
  | DerivedField
  | LinksModeBelongsToField
  | LinksModeHasManyField;
```

Defined in: [warp-drive-packages/core/src/types/schema/fields.ts:2187](https://github.com/warp-drive-data/warp-drive/blob/82d0c44ddc9be2d10e5e45f1f264e9d72673e78b/warp-drive-packages/core/src/types/schema/fields.ts#L2187)

A union of all possible PolarisMode field schemas.

Available field schemas are:

* [GenericField](GenericField.md)
* [PolarisAliasField](PolarisAliasField.md)
* [LocalField](LocalField.md)
* [ObjectField](ObjectField.md)
* [SchemaObjectField](SchemaObjectField.md)
* [ArrayField](ArrayField.md)
* [SchemaArrayField](SchemaArrayField.md)
* [DerivedField](DerivedField.md)
* [ResourceField (not yet implemented)](ResourceField.md)
* [CollectionField (not yet implemented)](CollectionField.md)
* [LinksModeBelongsToField](LinksModeBelongsToField.md)
* [LinksModeHasManyField](LinksModeHasManyField.md)
