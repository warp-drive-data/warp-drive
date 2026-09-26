---
url: https://canary.warp-drive.io/pr-preview/pr-9539/api/@ember-data/adapter.md
description: >-
  (Legacy) REST and JSON:API implementations of the Adapter interface,
  re-exported from `@warp-drive/legacy/adapter`; new apps should write request
  handlers for the `RequestManager` instead.
---

&#x20;

:::warning Legacy package
`@ember-data/adapter` is a legacy package. Adapters are no longer encouraged; new code should use [Handlers](/api/@warp-drive/core/request/types/Handler) with the `RequestManager` from [`@warp-drive/core`](/api/@warp-drive/core/) instead.
:::

This package provides REST and [{json:api}](https://jsonapi.org) Implementations of the legacy Adapter Interface when using the older packages.

**Why it's legacy:** The Adapter pattern was designed for class-based, inheritance-heavy architectures where each resource type could have its own data fetching logic. This approach:

* Creates tight coupling between your data layer and API implementation
* Makes it difficult to compose request logic or share behavior across resource types
* Lacks type safety and modern async patterns
* Requires runtime resolution and increases bundle size

**Modern alternative:** Use Handlers with the RequestManager. Handlers are composable, framework-agnostic functions that process requests through a pipeline. They support:

* Request builders for type-safe API calls
* Middleware-style composition (Gate, Fetch, CacheHandler)
* Better code splitting and tree shaking
* Framework-agnostic patterns that work in React, Vue, Svelte, and Ember

**When you still need this:** Only use Adapters if you're maintaining an existing Ember application that hasn't migrated to modern WarpDrive patterns.

For an alternative modern pattern to Adapters, see the [Request Handlers Guide](/guides/the-manual/requests/handlers).
