---
url: >-
  /pr-preview/pr-11087/api/@warp-drive/schema-dsl/interfaces/ArrayFieldOptions.md
---

# &#x20;ArrayFieldOptions

Defined in: [fields/array.ts:11](https://github.com/warp-drive-data/warp-drive/blob/53f90949527307caf1710da014dad97fc5e3ab13/warp-drive-packages/schema-dsl/src/fields/array.ts#L11)

Options accepted by the [array](../functions/array.md) decorator.

## Properties

### sourceKey?

```ts
optional sourceKey?: string;
```

Defined in: [fields/array.ts:19](https://github.com/warp-drive-data/warp-drive/blob/53f90949527307caf1710da014dad97fc5e3ab13/warp-drive-packages/schema-dsl/src/fields/array.ts#L19)

The name of the field as returned by the API, if it differs from the
decorated property's name. Compiles onto the [ArrayField](../../core/types/schema/fields/interfaces/ArrayField.md)'s
`sourceKey`.

***

### type?

```ts
optional type?: string;
```

Defined in: [fields/array.ts:28](https://github.com/warp-drive-data/warp-drive/blob/53f90949527307caf1710da014dad97fc5e3ab13/warp-drive-packages/schema-dsl/src/fields/array.ts#L28)

The name of a [Transformation](../../core/types/schema/concepts/type-aliases/Transformation.md) to pass each item in the array
through before displaying or serializing it. Compiles onto the
[ArrayField](../../core/types/schema/fields/interfaces/ArrayField.md)'s `type`.
