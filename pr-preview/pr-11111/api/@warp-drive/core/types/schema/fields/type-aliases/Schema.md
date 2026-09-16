---
url: >-
  /pr-preview/pr-11111/api/@warp-drive/core/types/schema/fields/type-aliases/Schema.md
---

# &#x20;Schema

```ts
type Schema = 
  | ResourceSchema
  | ObjectSchema;
```

Defined in: [warp-drive-packages/core/src/types/schema/fields.ts:2411](https://github.com/warp-drive-data/warp-drive/blob/35e6f11f90cd6cbcd7085d46039c7832ce1352f4/warp-drive-packages/core/src/types/schema/fields.ts#L2411)

A union of [ResourceSchema](ResourceSchema.md) and [ObjectSchema](../interfaces/ObjectSchema.md) representing
any schema that can be registered with or returned by the SchemaService.
