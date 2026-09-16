---
url: >-
  /pr-preview/pr-11087/api/@warp-drive/core/types/schema/fields/type-aliases/LegacyRelationshipField.md
---

# &#x20;LegacyRelationshipField

```ts
type LegacyRelationshipField = 
  | LegacyBelongsToField
  | LegacyHasManyField
  | LinksModeBelongsToField
  | LinksModeHasManyField;
```

Defined in: [warp-drive-packages/core/src/types/schema/fields.ts:2581](https://github.com/warp-drive-data/warp-drive/blob/53f90949527307caf1710da014dad97fc5e3ab13/warp-drive-packages/core/src/types/schema/fields.ts#L2581)

A union of all legacy relationship field schemas, i.e. [LegacyField](LegacyField.md)
excluding [LegacyAttributeField](../interfaces/LegacyAttributeField.md).

Available field schemas are:

* [LegacyBelongsToField](../interfaces/LegacyBelongsToField.md)
* [LegacyHasManyField](../interfaces/LegacyHasManyField.md)
* [LinksModeBelongsToField](../interfaces/LinksModeBelongsToField.md)
* [LinksModeHasManyField](../interfaces/LinksModeHasManyField.md)
