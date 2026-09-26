---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11301/api/@ember-data/legacy-compat.md
description: >-
  (Legacy) Shims such as `LegacyNetworkHandler`, `adapterFor` and
  `serializerFor` that keep Adapters and Serializers working with the
  `RequestManager`; now published as `@warp-drive/legacy/compat`.
---

&#x20;

:::warning Legacy package
`@ember-data/legacy-compat` is a legacy package. It bridges Models, Adapters, and Serializers to the `RequestManager` and cache; new code should skip it and start from [`@warp-drive/core`](/api/@warp-drive/core/) with schemas, Handlers, and request builders.
:::

This package exists to help apps migrate incrementally from legacy EmberData patterns to modern WarpDrive.

**Why it exists:** When migrating from legacy EmberData to modern WarpDrive, you may need to:

* Use `@ember-data/model` classes with the new `RequestManager`
* Keep Adapters/Serializers working while adopting new patterns incrementally
* Maintain backward compatibility during a gradual migration

**What it provides:**

* `LegacyNetworkHandler` - Allows Adapters and Serializers to work with RequestManager
* Compatibility layers that translate between legacy APIs and modern WarpDrive internals
* Hooks to integrate Model classes with the modern Store

**When to use this:** Only use this package during a migration from legacy EmberData to modern WarpDrive. It allows you to adopt modern patterns incrementally while keeping your existing code working.

For guidance on incremental migration strategies, see the [Migration Guide](/upgrading/v5/) and [Two Store Migration Strategy](/upgrading/v5/two-store-migration).
