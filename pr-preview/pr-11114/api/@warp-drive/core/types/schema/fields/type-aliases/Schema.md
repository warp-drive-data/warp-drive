---
url: >-
  /pr-preview/pr-11114/api/@warp-drive/core/types/schema/fields/type-aliases/Schema.md
---

# &#x20;Schema

```ts
type Schema = 
  | ResourceSchema
  | ObjectSchema;
```

Defined in: [warp-drive-packages/core/src/types/schema/fields.ts:2411](https://github.com/warp-drive-data/warp-drive/blob/2a894723a738725713417f2a39f20d1a3c698f73/warp-drive-packages/core/src/types/schema/fields.ts#L2411)

A union of [ResourceSchema](ResourceSchema.md) and [ObjectSchema](../interfaces/ObjectSchema.md) representing
any schema that can be registered with or returned by the SchemaService.
