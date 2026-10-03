---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11256/api/@warp-drive/core/types/schema/fields/types/LegacyModeFieldSchema.md
description: >-
  Union of every field schema allowed on a LegacyMode resource schema, including
  legacy attribute, belongsTo, and hasMany fields.
---

# &#x20;LegacyModeFieldSchema

```ts
type LegacyModeFieldSchema = 
  | GenericField
  | LegacyAliasField
  | LocalField
  | ObjectField
  | SchemaObjectField
  | ArrayField
  | SchemaArrayField
  | DerivedField
  | LegacyAttributeField
  | LegacyBelongsToField
  | LegacyHasManyField;
```

Defined in: [warp-drive-packages/core/src/types/schema/fields.ts:2150](https://github.com/warp-drive-data/warp-drive/blob/c095d2e6f55c70ee964e1a33fb501af9507bd094/warp-drive-packages/core/src/types/schema/fields.ts#L2150)

A union of all possible LegacyMode field schemas.

Available field schemas are:

* [GenericField](GenericField.md)
* [LegacyAliasField](LegacyAliasField.md)
* [LocalField](LocalField.md)
* [ObjectField](ObjectField.md)
* [SchemaObjectField](SchemaObjectField.md)
* [ArrayField](ArrayField.md)
* [SchemaArrayField](SchemaArrayField.md)
* [DerivedField](DerivedField.md)
* [ResourceField (not yet implemented)](ResourceField.md)
* [CollectionField (not yet implemented)](CollectionField.md)
* [LegacyAttributeField](LegacyAttributeField.md)
* [LegacyBelongsToField](LegacyBelongsToField.md)
* [LegacyHasManyField](LegacyHasManyField.md)
