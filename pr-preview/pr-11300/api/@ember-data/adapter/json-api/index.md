---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11300/api/@ember-data/adapter/json-api.md
description: >-
  Legacy alias that re-exports `JSONAPIAdapter` from
  `@warp-drive/legacy/adapter/json-api` so `@ember-data/adapter/json-api`
  imports keep working.
---

&#x20;

:::warning Legacy package
`@ember-data/adapter` is a legacy package. New code should use [`@warp-drive/legacy/adapter`](/api/@warp-drive/legacy/adapter/) instead.
:::

Legacy alias of [@warp-drive/legacy/adapter/json-api](../../../@warp-drive/legacy/adapter/json-api/index.md).
This entry re-exports the JSON:API adapter from that module unchanged so existing
`@ember-data/adapter/json-api` imports keep working; new code should import
from `@warp-drive/legacy/adapter/json-api` directly.
