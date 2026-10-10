---
url: >-
  https://canary.warp-drive.io/api/@warp-drive/core/types/schema/fields/types/Schema.md
description: >-
  Union of resource and object schemas, covering any schema that can be
  registered with or returned by the schema service.
---

# &#x20;Schema

```ts
type Schema = ResourceSchema | ObjectSchema;
```

Defined in: [warp-drive-packages/core/src/types/schema/fields.ts:2526](https://github.com/warp-drive-data/warp-drive/blob/48dc0d277b98008082669dadc6a52e5c5682ef8e/warp-drive-packages/core/src/types/schema/fields.ts#L2526)

A union of [ResourceSchema](ResourceSchema.md) and [ObjectSchema](ObjectSchema.md) representing
any schema that can be registered with or returned by the SchemaService.
