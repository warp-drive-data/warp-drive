---
url: /api/@warp-drive/core/types/schema/fields/type-aliases/Schema.md
---

# &#x20;Schema

```ts
type Schema = 
  | ResourceSchema
  | ObjectSchema;
```

Defined in: [warp-drive-packages/core/src/types/schema/fields.ts:2411](https://github.com/warp-drive-data/warp-drive/blob/3f5536455a585951f2252138f2bb555d8ad844bf/warp-drive-packages/core/src/types/schema/fields.ts#L2411)

A union of [ResourceSchema](ResourceSchema.md) and [ObjectSchema](../interfaces/ObjectSchema.md) representing
any schema that can be registered with or returned by the SchemaService.
