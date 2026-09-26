---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11303/api/@warp-drive/core/types/schema/fields/types/LegacyRelationshipField.md
description: >-
  Union of the legacy belongsTo and hasMany field schemas, including their
  LinksMode variants.
---

# &#x20;LegacyRelationshipField

```ts
type LegacyRelationshipField = 
  | LegacyBelongsToField
  | LegacyHasManyField
  | LinksModeBelongsToField
  | LinksModeHasManyField;
```

Defined in: [warp-drive-packages/core/src/types/schema/fields.ts:2670](https://github.com/warp-drive-data/warp-drive/blob/6a0f52f3db568b4389b2d95a71d94f0ddfce2d26/warp-drive-packages/core/src/types/schema/fields.ts#L2670)

A union of all legacy relationship field schemas, i.e. [LegacyField](LegacyField.md)
excluding [LegacyAttributeField](LegacyAttributeField.md).

Available field schemas are:

* [LegacyBelongsToField](LegacyBelongsToField.md)
* [LegacyHasManyField](LegacyHasManyField.md)
* [LinksModeBelongsToField](LinksModeBelongsToField.md)
* [LinksModeHasManyField](LinksModeHasManyField.md)
