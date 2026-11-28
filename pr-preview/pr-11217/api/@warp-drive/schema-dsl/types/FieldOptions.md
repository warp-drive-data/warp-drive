---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11217/api/@warp-drive/schema-dsl/types/FieldOptions.md
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

Defined in: [fields/field.ts:12](https://github.com/warp-drive-data/warp-drive/blob/772e76c9e60235bf168e26d2d453560fca4e38c3/warp-drive-packages/schema-dsl/src/fields/field.ts#L12)

Options accepted by the [field](../functions/field.md) decorator.

## Properties

### sourceKey?

```ts
sourceKey?: string;
```

Defined in: [fields/field.ts:26](https://github.com/warp-drive-data/warp-drive/blob/772e76c9e60235bf168e26d2d453560fca4e38c3/warp-drive-packages/schema-dsl/src/fields/field.ts#L26)

The name of the field as returned by the API, if it differs from the
decorated property's name. Compiles onto the field's `sourceKey`.

***

### type?

```ts
type?: string;
```

Defined in: [fields/field.ts:18](https://github.com/warp-drive-data/warp-drive/blob/772e76c9e60235bf168e26d2d453560fca4e38c3/warp-drive-packages/schema-dsl/src/fields/field.ts#L18)

The name of a [Transformation](../../core/types/schema/concepts/types/Transformation.md) to compile onto the field's `type`.
