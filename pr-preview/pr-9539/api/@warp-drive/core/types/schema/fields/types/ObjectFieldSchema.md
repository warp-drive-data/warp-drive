---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-9539/api/@warp-drive/core/types/schema/fields/types/ObjectFieldSchema.md
description: >-
  Union of the field schemas allowed in an `ObjectSchema`, which excludes
  identity and relationship fields.
---

# &#x20;ObjectFieldSchema

```ts
type ObjectFieldSchema = 
  | LegacyAttributeField
  | GenericField
  | ObjectAliasField
  | LocalField
  | ObjectField
  | SchemaObjectField
  | ArrayField
  | SchemaArrayField
  | DerivedField;
```

Defined in: [warp-drive-packages/core/src/types/schema/fields.ts:2230](https://github.com/warp-drive-data/warp-drive/blob/c039fb29fe72f3ac3b016ef16a9261222923fb96/warp-drive-packages/core/src/types/schema/fields.ts#L2230)

A union of all possible field schemas that can be
used in an ObjectSchema.
