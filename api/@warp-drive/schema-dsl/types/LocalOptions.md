---
url: https://canary.warp-drive.io/api/@warp-drive/schema-dsl/types/LocalOptions.md
description: >-
  Options for the `@local` decorator that set the local field's value before it
  is first set.
---

# &#x20;LocalOptions

```ts
interface LocalOptions {
  defaultValue?: PrimitiveValue;
}
```

Defined in: [fields/local.ts:13](https://github.com/warp-drive-data/warp-drive/blob/d5d42e1fa405f75c4c98f1176b6b7e27fc144fca/warp-drive-packages/schema-dsl/src/fields/local.ts#L13)

Options accepted by the [local](../functions/local.md) decorator.

## Properties

### defaultValue?

```ts
optional defaultValue?: PrimitiveValue;
```

Defined in: [fields/local.ts:20](https://github.com/warp-drive-data/warp-drive/blob/d5d42e1fa405f75c4c98f1176b6b7e27fc144fca/warp-drive-packages/schema-dsl/src/fields/local.ts#L20)

The value to use for the field until it is first set. Compiles onto
the [LocalField](../../core/types/schema/fields/types/LocalField.md)'s `options.defaultValue`.
