---
url: >-
  /api/@warp-drive/core/types/schema/fields/type-aliases/LegacyRelationshipField.md
---

# &#x20;LegacyRelationshipField

```ts
type LegacyRelationshipField = 
  | LegacyBelongsToField
  | LegacyHasManyField
  | LinksModeBelongsToField
  | LinksModeHasManyField;
```

Defined in: [warp-drive-packages/core/src/types/schema/fields.ts:2581](https://github.com/warp-drive-data/warp-drive/blob/b6590b8852e5d32b32e3eece336d0f892e8b02a5/warp-drive-packages/core/src/types/schema/fields.ts#L2581)

A union of all legacy relationship field schemas, i.e. [LegacyField](LegacyField.md)
excluding [LegacyAttributeField](../interfaces/LegacyAttributeField.md).

Available field schemas are:

* [LegacyBelongsToField](../interfaces/LegacyBelongsToField.md)
* [LegacyHasManyField](../interfaces/LegacyHasManyField.md)
* [LinksModeBelongsToField](../interfaces/LinksModeBelongsToField.md)
* [LinksModeHasManyField](../interfaces/LinksModeHasManyField.md)
