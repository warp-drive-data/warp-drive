---
url: >-
  /pr-preview/pr-11111/api/@warp-drive/schema-dsl/interfaces/ObjectSchemaOptions.md
---

# &#x20;ObjectSchemaOptions

Defined in: [entities/object-schema.ts:12](https://github.com/warp-drive-data/warp-drive/blob/35e6f11f90cd6cbcd7085d46039c7832ce1352f4/warp-drive-packages/schema-dsl/src/entities/object-schema.ts#L12)

Options accepted by the [ObjectSchema](../functions/ObjectSchema.md) decorator.

## Properties

### hash?

```ts
optional hash?: boolean;
```

Defined in: [entities/object-schema.ts:20](https://github.com/warp-drive-data/warp-drive/blob/35e6f11f90cd6cbcd7085d46039c7832ce1352f4/warp-drive-packages/schema-dsl/src/entities/object-schema.ts#L20)

Reserved for future use. The compiled schema's `identity` is currently
determined solely by whether a property on the class is decorated with
[hash](#hash), not by this option.
