# @ember-data/serializer

:::warning ⚠️ Legacy Package
**Serializers are a LEGACY feature** that is no longer encouraged for new applications.

**For new projects:** Use {@link @warp-drive/core!RequestManager | Handlers} with the {@link @warp-drive/core!RequestManager | RequestManager} instead.
:::

This package provides JSON, REST and JSON:API Implementations of the legacy Serializer Interface.

**Why it's legacy:** The Serializer pattern was designed to transform data between your API format and the format expected by Models. This approach:
- Creates tight coupling between API payloads and your data layer
- Makes it difficult to handle multiple API response formats in the same app
- Requires verbose normalization/serialization code for each resource type
- Lacks type safety and compile-time validation
- Increases runtime overhead with class instantiation and method dispatch

**Modern alternative:** Use Handlers with the RequestManager. Modern WarpDrive:
- Uses transformation utilities in Handlers for data normalization
- Leverages cache implementations (like `JSONAPICache`) that understand your API format natively
- Provides better tree shaking since transformations are functions, not classes
- Works with schemas for type-safe data access without runtime parsing

**When you still need this:** Only use Serializers if you're maintaining an existing Ember application that uses `@ember-data/model` and Adapters.

For an alternative modern pattern to Serializers, see the [Request Handlers Guide](/guides/the-manual/requests/handlers).
