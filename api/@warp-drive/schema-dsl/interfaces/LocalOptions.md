---
url: /api/@warp-drive/schema-dsl/interfaces/LocalOptions.md
---

# &#x20;LocalOptions

Defined in: [fields/local.ts:12](https://github.com/warp-drive-data/warp-drive/blob/b6590b8852e5d32b32e3eece336d0f892e8b02a5/warp-drive-packages/schema-dsl/src/fields/local.ts#L12)

Options accepted by the [local](../functions/local.md) decorator.

## Properties

### defaultValue?

```ts
optional defaultValue?: PrimitiveValue;
```

Defined in: [fields/local.ts:19](https://github.com/warp-drive-data/warp-drive/blob/b6590b8852e5d32b32e3eece336d0f892e8b02a5/warp-drive-packages/schema-dsl/src/fields/local.ts#L19)

The value to use for the field until it is first set. Compiles onto
the [LocalField](../../core/types/schema/fields/interfaces/LocalField.md)'s `options.defaultValue`.
