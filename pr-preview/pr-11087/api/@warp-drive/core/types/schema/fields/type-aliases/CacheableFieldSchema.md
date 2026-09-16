---
url: >-
  /pr-preview/pr-11087/api/@warp-drive/core/types/schema/fields/type-aliases/CacheableFieldSchema.md
---

# &#x20;CacheableFieldSchema

```ts
type CacheableFieldSchema = 
  | IdentityField
  | GenericField
  | ObjectField
  | SchemaObjectField
  | ArrayField
  | SchemaArrayField
  | ResourceField
  | CollectionField
  | LegacyAttributeField
  | LegacyBelongsToField
  | LegacyHasManyField
  | LinksModeBelongsToField
  | LinksModeHasManyField;
```

Defined in: [warp-drive-packages/core/src/types/schema/fields.ts:2148](https://github.com/warp-drive-data/warp-drive/blob/a37221ebf6a3775fa6d7b559641a9238e4f43660/warp-drive-packages/core/src/types/schema/fields.ts#L2148)

A union of all possible LegacyMode and PolarisMode
field schemas that represent data that could be in
the cache.

In other words this will not include types like alias
fields, local fields, or derived fields.
