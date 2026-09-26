---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-9539/api/@warp-drive/schema-dsl/types/LocalOptions.md
---

# &#x20;LocalOptions

```ts
interface LocalOptions {
  defaultValue?: PrimitiveValue;
}
```

Defined in: [fields/local.ts:12](https://github.com/warp-drive-data/warp-drive/blob/323cb08c6f42aefbe421e128ab4c4e6fbb31a57d/warp-drive-packages/schema-dsl/src/fields/local.ts#L12)

Options accepted by the [local](../functions/local.md) decorator.

## Properties

### defaultValue?

```ts
optional defaultValue?: PrimitiveValue;
```

Defined in: [fields/local.ts:19](https://github.com/warp-drive-data/warp-drive/blob/323cb08c6f42aefbe421e128ab4c4e6fbb31a57d/warp-drive-packages/schema-dsl/src/fields/local.ts#L19)

The value to use for the field until it is first set. Compiles onto
the [LocalField](../../core/types/schema/fields/types/LocalField.md)'s `options.defaultValue`.
