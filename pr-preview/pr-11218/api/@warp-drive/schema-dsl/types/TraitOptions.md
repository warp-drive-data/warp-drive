---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11218/api/@warp-drive/schema-dsl/types/TraitOptions.md
---

# &#x20;TraitOptions

```ts
interface TraitOptions {
  mode?: "legacy" | "polaris";
}
```

Defined in: [entities/trait.ts:17](https://github.com/warp-drive-data/warp-drive/blob/9a1ba598bf4f66d8348de75c9ad9359698e5c8ba/warp-drive-packages/schema-dsl/src/entities/trait.ts#L17)

Options accepted by the [Trait](../functions/Trait-1.md) decorator.

## Properties

### mode?

```ts
optional mode?: "legacy" | "polaris";
```

Defined in: [entities/trait.ts:24](https://github.com/warp-drive-data/warp-drive/blob/9a1ba598bf4f66d8348de75c9ad9359698e5c8ba/warp-drive-packages/schema-dsl/src/entities/trait.ts#L24)

The mode this trait is valid for use with: `'polaris'` compiles a
[PolarisTrait](../../core/types/schema/fields/types/PolarisTrait.md), `'legacy'` compiles a [LegacyTrait](../../core/types/schema/fields/types/LegacyTrait.md).
