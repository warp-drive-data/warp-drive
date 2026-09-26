---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11300/api/@ember-data/adapter/rest.md
description: >-
  Legacy alias that re-exports `RESTAdapter`, `fetchOptions`, and their request
  types from `@warp-drive/legacy/adapter/rest` so `@ember-data/adapter/rest`
  imports keep working.
---

&#x20;

:::warning Legacy package
`@ember-data/adapter` is a legacy package. New code should use [`@warp-drive/legacy/adapter`](/api/@warp-drive/legacy/adapter/) instead.
:::

Legacy alias of [@warp-drive/legacy/adapter/rest](../../../@warp-drive/legacy/adapter/rest/index.md).
This entry re-exports the REST adapter from that module unchanged so existing
`@ember-data/adapter/rest` imports keep working; new code should import
from `@warp-drive/legacy/adapter/rest` directly.
