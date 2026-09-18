---
url: /api/@warp-drive/schema-dsl/types/ObjectSchemaOptions.md
---

# &#x20;ObjectSchemaOptions

```ts
interface ObjectSchemaOptions {
  hash?: boolean;
}
```

Defined in: [entities/object-schema.ts:12](https://github.com/warp-drive-data/warp-drive/blob/2147c43395d4507f6b19c72a4b94f1d81379737b/warp-drive-packages/schema-dsl/src/entities/object-schema.ts#L12)

Options accepted by the [ObjectSchema](../functions/ObjectSchema.md) decorator.

## Properties

### hash?

```ts
optional hash?: boolean;
```

Defined in: [entities/object-schema.ts:20](https://github.com/warp-drive-data/warp-drive/blob/2147c43395d4507f6b19c72a4b94f1d81379737b/warp-drive-packages/schema-dsl/src/entities/object-schema.ts#L20)

Reserved for future use. The compiled schema's `identity` is currently
determined solely by whether a property on the class is decorated with
[hash](#hash), not by this option.
