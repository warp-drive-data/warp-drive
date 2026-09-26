---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11307/api/@warp-drive/core/types/schema/fields/types/FieldSchema.md
description: >-
  Union of every LegacyMode and PolarisMode field schema; prefer the
  mode-specific unions for more precise type-checking.
---

# &#x20;FieldSchema

```ts
type FieldSchema = 
  | GenericField
  | LegacyAliasField
  | PolarisAliasField
  | LocalField
  | ObjectField
  | SchemaObjectField
  | ArrayField
  | SchemaArrayField
  | DerivedField
  | ResourceField
  | CollectionField
  | LegacyAttributeField
  | LegacyBelongsToField
  | LegacyHasManyField
  | LinksModeBelongsToField
  | LinksModeHasManyField;
```

Defined in: [warp-drive-packages/core/src/types/schema/fields.ts:2179](https://github.com/warp-drive-data/warp-drive/blob/6f1df43b4ba710f4f5bb580d00709528f3aab57e/warp-drive-packages/core/src/types/schema/fields.ts#L2179)

A union of all possible LegacyMode and PolarisMode
field schemas.

You likely will want to use PolarisModeFieldSchema,
LegacyModeFieldSchema, or ObjectFieldSchema instead
as appropriate as they are more specific and will
provide better guidance around what is valid.
