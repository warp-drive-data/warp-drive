---
url: https://canary.warp-drive.io/pr-preview/pr-11305/api/@ember-data/adapter.md
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

It re-exports [`@warp-drive/legacy/adapter`](/api/@warp-drive/legacy/adapter/), whose documentation covers why
Adapters are legacy and what replaces them.

**When you still need this:** Only use Adapters if you're maintaining an existing Ember application that hasn't migrated to modern WarpDrive patterns.

For an alternative modern pattern to Adapters, see the [Request Handlers Guide](/guides/the-manual/requests/handlers).
