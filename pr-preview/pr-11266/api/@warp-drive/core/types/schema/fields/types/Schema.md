---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11266/api/@warp-drive/core/types/schema/fields/types/Schema.md
description: >-
  Union of resource and object schemas, covering any schema that can be
  registered with or returned by the schema service.
---

# &#x20;Schema

```ts
type Schema = ResourceSchema | ObjectSchema;
```

Defined in: [warp-drive-packages/core/src/types/schema/fields.ts:2482](https://github.com/warp-drive-data/warp-drive/blob/49b7d5502612c6681613bd683d94c70417318756/warp-drive-packages/core/src/types/schema/fields.ts#L2482)

A union of [ResourceSchema](ResourceSchema.md) and [ObjectSchema](ObjectSchema.md) representing
any schema that can be registered with or returned by the SchemaService.
