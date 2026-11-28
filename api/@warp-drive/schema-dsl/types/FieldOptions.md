---
url: https://canary.warp-drive.io/api/@warp-drive/schema-dsl/types/FieldOptions.md
description: >-
  Options for the `@field` decorator that set the compiled field's
  transformation `type` and `sourceKey`.
---

# &#x20;FieldOptions

```ts
interface FieldOptions {
  sourceKey?: string;
  type?: string;
}
```

Defined in: [fields/field.ts:12](https://github.com/warp-drive-data/warp-drive/blob/82d0c44ddc9be2d10e5e45f1f264e9d72673e78b/warp-drive-packages/schema-dsl/src/fields/field.ts#L12)

Options accepted by the [field](../functions/field.md) decorator.

## Properties

### sourceKey?

```ts
sourceKey?: string;
```

Defined in: [fields/field.ts:26](https://github.com/warp-drive-data/warp-drive/blob/82d0c44ddc9be2d10e5e45f1f264e9d72673e78b/warp-drive-packages/schema-dsl/src/fields/field.ts#L26)

The name of the field as returned by the API, if it differs from the
decorated property's name. Compiles onto the field's `sourceKey`.

***

### type?

```ts
type?: string;
```

Defined in: [fields/field.ts:18](https://github.com/warp-drive-data/warp-drive/blob/82d0c44ddc9be2d10e5e45f1f264e9d72673e78b/warp-drive-packages/schema-dsl/src/fields/field.ts#L18)

The name of a [Transformation](../../core/types/schema/concepts/types/Transformation.md) to compile onto the field's `type`.
