---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11300/api/@warp-drive/core/reactive/types/ReactiveResource.md
description: >-
  The rich, reactive record object that presents a resource's cached data
  through its `ResourceSchema`.
---

# &#x20;ReactiveResource

```ts
interface ReactiveResource {}
```

Defined in: [warp-drive-packages/core/src/reactive/-private/record.ts:64](https://github.com/warp-drive-data/warp-drive/blob/2060227ee98096ec39bd0c0d9fed4d0fe29fb087/warp-drive-packages/core/src/reactive/-private/record.ts#L64)

**`Hideconstructor`**

A class that uses a the ResourceSchema for a ResourceType
and a ResourceKey to transform data from the cache into a rich, reactive
object.

This class is not directly instantiable. To use it, you should
configure the store's `instantiateRecord` and `teardownRecord` hooks
with the matching hooks provided by this package.
