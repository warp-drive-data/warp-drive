---
url: https://canary.warp-drive.io/api/@warp-drive/schema-dsl/types/TraitOptions.md
description: >-
  Options for the `Trait` class decorator that select whether it compiles to a
  polaris-mode or a legacy-mode trait.
---

# &#x20;TraitOptions

```ts
interface TraitOptions {
  mode?: "legacy" | "polaris";
}
```

Defined in: [entities/trait.ts:19](https://github.com/warp-drive-data/warp-drive/blob/48dc0d277b98008082669dadc6a52e5c5682ef8e/warp-drive-packages/schema-dsl/src/entities/trait.ts#L19)

Options accepted by the [Trait](../functions/Trait-1.md) decorator.

## Properties

### mode?

```ts
optional mode?: "legacy" | "polaris";
```

Defined in: [entities/trait.ts:26](https://github.com/warp-drive-data/warp-drive/blob/48dc0d277b98008082669dadc6a52e5c5682ef8e/warp-drive-packages/schema-dsl/src/entities/trait.ts#L26)

The mode this trait is valid for use with: `'polaris'` compiles a
[PolarisTrait](../../core/types/schema/fields/types/PolarisTrait.md), `'legacy'` compiles a [LegacyTrait](../../core/types/schema/fields/types/LegacyTrait.md).
