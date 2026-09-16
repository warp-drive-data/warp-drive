---
url: /api/@warp-drive/core/types/schema/fields/type-aliases/Schema.md
---

# &#x20;Schema

```ts
type Schema = 
  | ResourceSchema
  | ObjectSchema;
```

Defined in: [warp-drive-packages/core/src/types/schema/fields.ts:2411](https://github.com/warp-drive-data/warp-drive/blob/b6590b8852e5d32b32e3eece336d0f892e8b02a5/warp-drive-packages/core/src/types/schema/fields.ts#L2411)

A union of [ResourceSchema](ResourceSchema.md) and [ObjectSchema](../interfaces/ObjectSchema.md) representing
any schema that can be registered with or returned by the SchemaService.
