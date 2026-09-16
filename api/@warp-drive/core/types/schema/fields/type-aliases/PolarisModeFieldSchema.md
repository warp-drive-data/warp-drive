---
url: >-
  /api/@warp-drive/core/types/schema/fields/type-aliases/PolarisModeFieldSchema.md
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

Defined in: [warp-drive-packages/core/src/types/schema/fields.ts:2095](https://github.com/warp-drive-data/warp-drive/blob/3f5536455a585951f2252138f2bb555d8ad844bf/warp-drive-packages/core/src/types/schema/fields.ts#L2095)

A union of all possible PolarisMode field schemas.

Available field schemas are:

* [GenericField](../interfaces/GenericField.md)
* [PolarisAliasField](../interfaces/PolarisAliasField.md)
* [LocalField](../interfaces/LocalField.md)
* [ObjectField](../interfaces/ObjectField.md)
* [SchemaObjectField](../interfaces/SchemaObjectField.md)
* [ArrayField](../interfaces/ArrayField.md)
* [SchemaArrayField](../interfaces/SchemaArrayField.md)
* [DerivedField](../interfaces/DerivedField.md)
* [ResourceField (not yet implemented)](../interfaces/ResourceField.md)
* [CollectionField (not yet implemented)](../interfaces/CollectionField.md)
* [LinksModeBelongsToField](../interfaces/LinksModeBelongsToField.md)
* [LinksModeHasManyField](../interfaces/LinksModeHasManyField.md)
