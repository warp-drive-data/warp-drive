---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11308/api/@warp-drive/core/types/schema/fields/types/Schema.md
description: >-
  Union of resource and object schemas, covering any schema that can be
  registered with or returned by the schema service.
---

# &#x20;Schema

```ts
type Schema = ResourceSchema | ObjectSchema;
```

Defined in: [warp-drive-packages/core/src/types/schema/fields.ts:2482](https://github.com/warp-drive-data/warp-drive/blob/8280ed61816b930e2f4b7b363858bbd832e09e17/warp-drive-packages/core/src/types/schema/fields.ts#L2482)

A union of [ResourceSchema](ResourceSchema.md) and [ObjectSchema](ObjectSchema.md) representing
any schema that can be registered with or returned by the SchemaService.
