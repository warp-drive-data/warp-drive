---
url: /api/@warp-drive/core/types/schema/fields/type-aliases/LegacyField.md
---

# &#x20;LegacyField

```ts
type LegacyField = 
  | LegacyAttributeField
  | LegacyBelongsToField
  | LegacyHasManyField
  | LinksModeBelongsToField
  | LinksModeHasManyField;
```

Defined in: [warp-drive-packages/core/src/types/schema/fields.ts:2561](https://github.com/warp-drive-data/warp-drive/blob/366068ebc56a664fb2411fcf7b3b351cc19cd54a/warp-drive-packages/core/src/types/schema/fields.ts#L2561)

A union of all field schemas considered "legacy", i.e. those historically
associated with `@warp-drive/legacy/model`'s Attribute, BelongsTo and
HasMany fields, including their LinksMode variants.

Available field schemas are:

* [LegacyAttributeField](../interfaces/LegacyAttributeField.md)
* [LegacyBelongsToField](../interfaces/LegacyBelongsToField.md)
* [LegacyHasManyField](../interfaces/LegacyHasManyField.md)
* [LinksModeBelongsToField](../interfaces/LinksModeBelongsToField.md)
* [LinksModeHasManyField](../interfaces/LinksModeHasManyField.md)
