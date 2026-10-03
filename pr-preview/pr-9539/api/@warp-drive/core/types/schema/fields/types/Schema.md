---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-9539/api/@warp-drive/core/types/schema/fields/types/Schema.md
description: >-
  Union of resource and object schemas, covering any schema that can be
  registered with or returned by the schema service.
---

# &#x20;Schema

```ts
type Schema = ResourceSchema | ObjectSchema;
```

Defined in: [warp-drive-packages/core/src/types/schema/fields.ts:2482](https://github.com/warp-drive-data/warp-drive/blob/6d8462857f57c6682cc698dbfcf9b3ece5d8bfd2/warp-drive-packages/core/src/types/schema/fields.ts#L2482)

A union of [ResourceSchema](ResourceSchema.md) and [ObjectSchema](ObjectSchema.md) representing
any schema that can be registered with or returned by the SchemaService.
