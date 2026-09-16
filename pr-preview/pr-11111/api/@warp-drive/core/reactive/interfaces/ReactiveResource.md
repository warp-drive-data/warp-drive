---
url: >-
  /warp-drive/pr-preview/pr-11111/api/@warp-drive/core/reactive/interfaces/ReactiveResource.md
---

# &#x20;ReactiveResource

Defined in: [warp-drive-packages/core/src/reactive/-private/record.ts:64](https://github.com/warp-drive-data/warp-drive/blob/998da8d5cb68764b43a8503a38424bc85af654e3/warp-drive-packages/core/src/reactive/-private/record.ts#L64)

**`Hideconstructor`**

A class that uses a the ResourceSchema for a ResourceType
and a ResourceKey to transform data from the cache into a rich, reactive
object.

This class is not directly instantiable. To use it, you should
configure the store's `instantiateRecord` and `teardownRecord` hooks
with the matching hooks provided by this package.
