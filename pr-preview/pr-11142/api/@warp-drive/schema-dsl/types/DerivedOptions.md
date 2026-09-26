---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11142/api/@warp-drive/schema-dsl/types/DerivedOptions.md
---

# &#x20;DerivedOptions

```ts
interface DerivedOptions {
  options?: Record<string, unknown>;
  type: string;
}
```

Defined in: [fields/derived.ts:11](https://github.com/warp-drive-data/warp-drive/blob/fe5df5abab153c45663c00dfcbcd8d5192080e20/warp-drive-packages/schema-dsl/src/fields/derived.ts#L11)

Options accepted by the [derived](../functions/derived.md) decorator.

## Properties

### options?

```ts
optional options?: Record<string, unknown>;
```

Defined in: [fields/derived.ts:27](https://github.com/warp-drive-data/warp-drive/blob/fe5df5abab153c45663c00dfcbcd8d5192080e20/warp-drive-packages/schema-dsl/src/fields/derived.ts#L27)

Options to pass to the derivation. Must comply with the specific
derivation's options schema.

***

### type

```ts
type: string;
```

Defined in: [fields/derived.ts:19](https://github.com/warp-drive-data/warp-drive/blob/fe5df5abab153c45663c00dfcbcd8d5192080e20/warp-drive-packages/schema-dsl/src/fields/derived.ts#L19)

The name of a [Derivation](../../core/types/schema/concepts/types/Derivation.md) registered with the schema service,
used to compute this field's value. Compiles onto the
[DerivedField](../../core/types/schema/fields/types/DerivedField.md)'s `type`.
