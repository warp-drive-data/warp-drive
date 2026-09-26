---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11218/api/@warp-drive/schema-dsl/types/LocalOptions.md
---

# &#x20;LocalOptions

```ts
interface LocalOptions {
  defaultValue?: PrimitiveValue;
}
```

Defined in: [fields/local.ts:12](https://github.com/warp-drive-data/warp-drive/blob/9a1ba598bf4f66d8348de75c9ad9359698e5c8ba/warp-drive-packages/schema-dsl/src/fields/local.ts#L12)

Options accepted by the [local](../functions/local.md) decorator.

## Properties

### defaultValue?

```ts
optional defaultValue?: PrimitiveValue;
```

Defined in: [fields/local.ts:19](https://github.com/warp-drive-data/warp-drive/blob/9a1ba598bf4f66d8348de75c9ad9359698e5c8ba/warp-drive-packages/schema-dsl/src/fields/local.ts#L19)

The value to use for the field until it is first set. Compiles onto
the [LocalField](../../core/types/schema/fields/types/LocalField.md)'s `options.defaultValue`.
