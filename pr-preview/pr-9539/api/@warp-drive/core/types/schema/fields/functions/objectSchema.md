---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-9539/api/@warp-drive/core/types/schema/fields/functions/objectSchema.md
---

# &#x20;objectSchema()

```ts
function objectSchema<T extends ObjectSchema>(schema: T): T;
```

Defined in: [warp-drive-packages/core/src/types/schema/fields.ts:2530](https://github.com/warp-drive-data/warp-drive/blob/323cb08c6f42aefbe421e128ab4c4e6fbb31a57d/warp-drive-packages/core/src/types/schema/fields.ts#L2530)

A no-op type utility that enables type-checking object schema
definitions.

Will return the passed in schema.

## Type Parameters

### T

`T` *extends* [`ObjectSchema`](../types/ObjectSchema.md)

## Parameters

### schema

`T`

## Returns

`T`
