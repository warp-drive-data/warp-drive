---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11248/api/@warp-drive/core/types/schema/fields/types/PolarisModeFieldSchema.md
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
  | ResourceField
  | CollectionField
  | LinksModeBelongsToField
  | LinksModeHasManyField;
```

Defined in: [warp-drive-packages/core/src/types/schema/fields.ts:2155](https://github.com/warp-drive-data/warp-drive/blob/f062a076bc8863498969a21610d42251c8546673/warp-drive-packages/core/src/types/schema/fields.ts#L2155)

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
* [ResourceField](ResourceField.md)
* [CollectionField](CollectionField.md)
* [LinksModeBelongsToField](LinksModeBelongsToField.md)
* [LinksModeHasManyField](LinksModeHasManyField.md)
