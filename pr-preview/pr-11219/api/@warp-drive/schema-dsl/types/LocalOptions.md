---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11219/api/@warp-drive/schema-dsl/types/LocalOptions.md
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

Defined in: [fields/local.ts:13](https://github.com/warp-drive-data/warp-drive/blob/1a0bda2da6f096b75fcf2e9d9f327a94858a5304/warp-drive-packages/schema-dsl/src/fields/local.ts#L13)

Options accepted by the [local](../functions/local.md) decorator.

## Properties

### defaultValue?

```ts
defaultValue?: PrimitiveValue;
```

Defined in: [fields/local.ts:20](https://github.com/warp-drive-data/warp-drive/blob/1a0bda2da6f096b75fcf2e9d9f327a94858a5304/warp-drive-packages/schema-dsl/src/fields/local.ts#L20)

The value to use for the field until it is first set. Compiles onto
the [LocalField](../../core/types/schema/fields/types/LocalField.md)'s `options.defaultValue`.
