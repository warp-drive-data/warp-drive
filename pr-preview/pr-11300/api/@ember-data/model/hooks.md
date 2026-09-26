---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11300/api/@ember-data/model/hooks.md
description: >-
  Legacy alias that re-exports the `Model` lifecycle hooks `instantiateRecord`,
  `teardownRecord`, `modelFor`, and `buildSchema` from
  `@warp-drive/legacy/model`.
---

&#x20;

:::warning Legacy package
`@ember-data/model` is a legacy package. New code should use [`@warp-drive/legacy/model`](/api/@warp-drive/legacy/model/) instead.
:::

Legacy alias of [@warp-drive/legacy/model](../../../@warp-drive/legacy/model/index.md).
This entry re-exports the model lifecycle hooks from that module unchanged so existing
`@ember-data/model/hooks` imports keep working; new code should import
from `@warp-drive/legacy/model` directly.
