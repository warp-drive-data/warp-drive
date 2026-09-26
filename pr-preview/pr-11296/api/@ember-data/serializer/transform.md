---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11296/api/@ember-data/serializer/transform.md
description: >-
  Legacy alias that re-exports the base `Transform` and the boolean, string,
  number, and date attribute transforms from
  `@warp-drive/legacy/serializer/transform`.
---

Legacy alias of [@warp-drive/legacy/serializer/transform](../../../@warp-drive/legacy/serializer/transform/index.md).
This entry re-exports the attribute transforms from that module unchanged so existing
`@ember-data/serializer/transform` imports keep working; new code should import
from `@warp-drive/legacy/serializer/transform` directly.
