---
url: /pr-preview/pr-11111/api/@warp-drive/schema-dsl/interfaces/TraitOptions.md
---

# &#x20;TraitOptions

Defined in: [entities/trait.ts:17](https://github.com/warp-drive-data/warp-drive/blob/f4874b11d917637fc69e13d92cdd6e92ce16baa8/warp-drive-packages/schema-dsl/src/entities/trait.ts#L17)

Options accepted by the [Trait](../functions/Trait-1.md) decorator.

## Properties

### mode?

```ts
optional mode?: "legacy" | "polaris";
```

Defined in: [entities/trait.ts:24](https://github.com/warp-drive-data/warp-drive/blob/f4874b11d917637fc69e13d92cdd6e92ce16baa8/warp-drive-packages/schema-dsl/src/entities/trait.ts#L24)

The mode this trait is valid for use with: `'polaris'` compiles a
[PolarisTrait](../../core/types/schema/fields/interfaces/PolarisTrait.md), `'legacy'` compiles a [LegacyTrait](../../core/types/schema/fields/interfaces/LegacyTrait.md).
