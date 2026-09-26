---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11298/api/@ember-data/adapter/rest.md
description: >-
  Legacy alias that re-exports `RESTAdapter`, `fetchOptions`, and their request
  types from `@warp-drive/legacy/adapter/rest` so `@ember-data/adapter/rest`
  imports keep working.
---

Legacy alias of [@warp-drive/legacy/adapter/rest](../../../@warp-drive/legacy/adapter/rest/index.md).
This entry re-exports the REST adapter from that module unchanged so existing
`@ember-data/adapter/rest` imports keep working; new code should import
from `@warp-drive/legacy/adapter/rest` directly.
