---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-9539/api/@warp-drive/core/types/schema/fields/types/LegacyModeFieldSchema.md
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

Defined in: [warp-drive-packages/core/src/types/schema/fields.ts:2066](https://github.com/warp-drive-data/warp-drive/blob/323cb08c6f42aefbe421e128ab4c4e6fbb31a57d/warp-drive-packages/core/src/types/schema/fields.ts#L2066)

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
