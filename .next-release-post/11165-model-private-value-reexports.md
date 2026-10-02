---
releases: ["5.10"]
---
The published types for `@ember-data/model/-private` and `@ember-data/model/migration-support`
once again export values as values. They had emitted these re-exports as type-only, so bindings
such as `Errors`, `PromiseBelongsTo`, `PromiseManyArray`, `lookupLegacySupport` and
`LEGACY_SUPPORT` could only be imported with `import type`, which erases them at runtime.
