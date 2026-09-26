---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11238/api/@warp-drive/core/types/schema/fields/types/LegacyRelationshipField.md
---

# &#x20;LegacyRelationshipField

```ts
type LegacyRelationshipField = 
  | LegacyBelongsToField
  | LegacyHasManyField
  | LinksModeBelongsToField
  | LinksModeHasManyField;
```

Defined in: [warp-drive-packages/core/src/types/schema/fields.ts:2670](https://github.com/warp-drive-data/warp-drive/blob/6380bdd49555e2e65e41f86fc2f4535226e95f84/warp-drive-packages/core/src/types/schema/fields.ts#L2670)

A union of all legacy relationship field schemas, i.e. [LegacyField](LegacyField.md)
excluding [LegacyAttributeField](LegacyAttributeField.md).

Available field schemas are:

* [LegacyBelongsToField](LegacyBelongsToField.md)
* [LegacyHasManyField](LegacyHasManyField.md)
* [LinksModeBelongsToField](LinksModeBelongsToField.md)
* [LinksModeHasManyField](LinksModeHasManyField.md)
