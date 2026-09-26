---
url: https://canary.warp-drive.io/api/@ember-data/model/hooks.md
description: >-
  Legacy alias that re-exports the `Model` lifecycle hooks `instantiateRecord`,
  `teardownRecord`, `modelFor`, and `buildSchema` from
  `@warp-drive/legacy/model`.
---

Legacy alias of [@warp-drive/legacy/model](../../../@warp-drive/legacy/model/index.md).
This entry re-exports the model lifecycle hooks from that module unchanged so existing
`@ember-data/model/hooks` imports keep working; new code should import
from `@warp-drive/legacy/model` directly.
