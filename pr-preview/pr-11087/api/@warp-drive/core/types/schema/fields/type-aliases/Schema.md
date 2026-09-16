---
url: >-
  /pr-preview/pr-11087/api/@warp-drive/core/types/schema/fields/type-aliases/Schema.md
---

# &#x20;Schema

```ts
type Schema = 
  | ResourceSchema
  | ObjectSchema;
```

Defined in: [warp-drive-packages/core/src/types/schema/fields.ts:2411](https://github.com/warp-drive-data/warp-drive/blob/53f90949527307caf1710da014dad97fc5e3ab13/warp-drive-packages/core/src/types/schema/fields.ts#L2411)

A union of [ResourceSchema](ResourceSchema.md) and [ObjectSchema](../interfaces/ObjectSchema.md) representing
any schema that can be registered with or returned by the SchemaService.
