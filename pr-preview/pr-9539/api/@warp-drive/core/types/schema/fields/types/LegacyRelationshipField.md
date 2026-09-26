---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-9539/api/@warp-drive/core/types/schema/fields/types/LegacyRelationshipField.md
---

# &#x20;LegacyRelationshipField

```ts
type LegacyRelationshipField = 
  | LegacyBelongsToField
  | LegacyHasManyField
  | LinksModeBelongsToField
  | LinksModeHasManyField;
```

Defined in: [warp-drive-packages/core/src/types/schema/fields.ts:2587](https://github.com/warp-drive-data/warp-drive/blob/323cb08c6f42aefbe421e128ab4c4e6fbb31a57d/warp-drive-packages/core/src/types/schema/fields.ts#L2587)

A union of all legacy relationship field schemas, i.e. [LegacyField](LegacyField.md)
excluding [LegacyAttributeField](LegacyAttributeField.md).

Available field schemas are:

* [LegacyBelongsToField](LegacyBelongsToField.md)
* [LegacyHasManyField](LegacyHasManyField.md)
* [LinksModeBelongsToField](LinksModeBelongsToField.md)
* [LinksModeHasManyField](LinksModeHasManyField.md)
