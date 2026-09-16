---
url: >-
  /api/@warp-drive/core/types/schema/fields/type-aliases/LegacyModeFieldSchema.md
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

Defined in: [warp-drive-packages/core/src/types/schema/fields.ts:2060](https://github.com/warp-drive-data/warp-drive/blob/35d5b9d62db1dc40d1d36c9cfc0536e7cab16c11/warp-drive-packages/core/src/types/schema/fields.ts#L2060)

A union of all possible LegacyMode field schemas.

Available field schemas are:

* [GenericField](../interfaces/GenericField.md)
* [LegacyAliasField](../interfaces/LegacyAliasField.md)
* [LocalField](../interfaces/LocalField.md)
* [ObjectField](../interfaces/ObjectField.md)
* [SchemaObjectField](../interfaces/SchemaObjectField.md)
* [ArrayField](../interfaces/ArrayField.md)
* [SchemaArrayField](../interfaces/SchemaArrayField.md)
* [DerivedField](../interfaces/DerivedField.md)
* [ResourceField (not yet implemented)](../interfaces/ResourceField.md)
* [CollectionField (not yet implemented)](../interfaces/CollectionField.md)
* [LegacyAttributeField](../interfaces/LegacyAttributeField.md)
* [LegacyBelongsToField](../interfaces/LegacyBelongsToField.md)
* [LegacyHasManyField](../interfaces/LegacyHasManyField.md)
