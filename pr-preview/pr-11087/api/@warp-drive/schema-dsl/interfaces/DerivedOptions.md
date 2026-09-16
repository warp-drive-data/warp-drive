---
url: /pr-preview/pr-11087/api/@warp-drive/schema-dsl/interfaces/DerivedOptions.md
---

# &#x20;DerivedOptions

Defined in: [fields/derived.ts:11](https://github.com/warp-drive-data/warp-drive/blob/53f90949527307caf1710da014dad97fc5e3ab13/warp-drive-packages/schema-dsl/src/fields/derived.ts#L11)

Options accepted by the [derived](../functions/derived.md) decorator.

## Properties

### options?

```ts
optional options?: Record<string, unknown>;
```

Defined in: [fields/derived.ts:27](https://github.com/warp-drive-data/warp-drive/blob/53f90949527307caf1710da014dad97fc5e3ab13/warp-drive-packages/schema-dsl/src/fields/derived.ts#L27)

Options to pass to the derivation. Must comply with the specific
derivation's options schema.

***

### type

```ts
type: string;
```

Defined in: [fields/derived.ts:19](https://github.com/warp-drive-data/warp-drive/blob/53f90949527307caf1710da014dad97fc5e3ab13/warp-drive-packages/schema-dsl/src/fields/derived.ts#L19)

The name of a [Derivation](../../core/types/schema/concepts/type-aliases/Derivation.md) registered with the schema service,
used to compute this field's value. Compiles onto the
[DerivedField](../../core/types/schema/fields/interfaces/DerivedField.md)'s `type`.
