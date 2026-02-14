# @ember-data/model

:::warning ⚠️ Legacy Package
**Model classes are a LEGACY feature** that is no longer encouraged for new applications.

**For new projects:** Use **schema objects**` from {@link @warp-drive/core! | @warp-drive/core} instead.
:::

This package provides runtime classes for use as a source of ResourceSchema and as a ReactiveResource for older "legacy" EmberData/WarpDrive configurations.

**Why it's legacy:** The Model class pattern uses class inheritance and runtime decorator parsing to define your data schema. This approach:
- Parses schema at runtime by inspecting class decorators, increasing initial load time
- Creates heavy class instances for every record, impacting memory and performance
- Tightly couples your data structure to Ember-specific patterns (computed properties, observers)
- Makes it difficult to share data logic across frameworks (React, Vue, Svelte)
- Lacks static type safety (TypeScript types don't match runtime schema)
- Requires inheritance chains that increase bundle size and complexity

**Modern alternative:** Use **schema objects**` from `@warp-drive/core`. Modern WarpDrive:
- Defines schemas as static objects that can be tree-shaken and validated at build time
- Uses plain JavaScript objects for records, dramatically reducing memory overhead
- Works identically across React, Vue, Svelte, and Ember
- Provides full TypeScript type safety with schema-to-type generation
- Supports schema derivations and transformations without inheritance

**When you still need this:** Only use Model classes if you're maintaining an existing Ember application that hasn't migrated to modern WarpDrive schemas.

For guidance on migrating from Model classes to schema objects, see the [Schema Guide](/guides/the-manual/schemas) and [Migration Guide](/guides/migrating).
