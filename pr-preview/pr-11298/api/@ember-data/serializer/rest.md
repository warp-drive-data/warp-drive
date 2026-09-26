---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11298/api/@ember-data/serializer/rest.md
description: >-
  Legacy alias that re-exports `RESTSerializer` and `EmbeddedRecordsMixin` from
  `@warp-drive/legacy/serializer/rest` so `@ember-data/serializer/rest` imports
  keep working.
---

Legacy alias of [@warp-drive/legacy/serializer/rest](../../../@warp-drive/legacy/serializer/rest/index.md).
This entry re-exports the REST serializer from that module unchanged so existing
`@ember-data/serializer/rest` imports keep working; new code should import
from `@warp-drive/legacy/serializer/rest` directly.
