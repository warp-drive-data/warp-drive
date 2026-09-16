---
url: /pr-preview/pr-11114/api/@warp-drive/schema-dsl/interfaces/TraitOptions.md
---

# &#x20;TraitOptions

Defined in: [entities/trait.ts:17](https://github.com/warp-drive-data/warp-drive/blob/2a894723a738725713417f2a39f20d1a3c698f73/warp-drive-packages/schema-dsl/src/entities/trait.ts#L17)

Options accepted by the [Trait](../functions/Trait-1.md) decorator.

## Properties

### mode?

```ts
optional mode?: "legacy" | "polaris";
```

Defined in: [entities/trait.ts:24](https://github.com/warp-drive-data/warp-drive/blob/2a894723a738725713417f2a39f20d1a3c698f73/warp-drive-packages/schema-dsl/src/entities/trait.ts#L24)

The mode this trait is valid for use with: `'polaris'` compiles a
[PolarisTrait](../../core/types/schema/fields/interfaces/PolarisTrait.md), `'legacy'` compiles a [LegacyTrait](../../core/types/schema/fields/interfaces/LegacyTrait.md).
