---
url: >-
  /pr-preview/pr-11087/api/@warp-drive/schema-dsl/interfaces/ObjectFieldOptions.md
---

# &#x20;ObjectFieldOptions

Defined in: [fields/object.ts:11](https://github.com/warp-drive-data/warp-drive/blob/53f90949527307caf1710da014dad97fc5e3ab13/warp-drive-packages/schema-dsl/src/fields/object.ts#L11)

Options accepted by the [object](../functions/object.md) decorator.

## Properties

### sourceKey?

```ts
optional sourceKey?: string;
```

Defined in: [fields/object.ts:19](https://github.com/warp-drive-data/warp-drive/blob/53f90949527307caf1710da014dad97fc5e3ab13/warp-drive-packages/schema-dsl/src/fields/object.ts#L19)

The name of the field as returned by the API, if it differs from the
decorated property's name. Compiles onto the [ObjectField](../../core/types/schema/fields/interfaces/ObjectField.md)'s
`sourceKey`.

***

### type?

```ts
optional type?: string;
```

Defined in: [fields/object.ts:28](https://github.com/warp-drive-data/warp-drive/blob/53f90949527307caf1710da014dad97fc5e3ab13/warp-drive-packages/schema-dsl/src/fields/object.ts#L28)

The name of a [Transformation](../../core/types/schema/concepts/type-aliases/Transformation.md) to pass the entire object through
before displaying or serializing it. Compiles onto the
[ObjectField](../../core/types/schema/fields/interfaces/ObjectField.md)'s `type`.
