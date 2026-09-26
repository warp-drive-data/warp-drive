---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11307/api/@warp-drive/core/reactive/types/ReactiveResource.md
description: >-
  The rich, reactive record object that presents a resource's cached data
  through its `ResourceSchema`.
---

# &#x20;ReactiveResource

```ts
interface ReactiveResource {}
```

Defined in: [warp-drive-packages/core/src/reactive/-private/record.ts:64](https://github.com/warp-drive-data/warp-drive/blob/6f1df43b4ba710f4f5bb580d00709528f3aab57e/warp-drive-packages/core/src/reactive/-private/record.ts#L64)

**`Hideconstructor`**

A class that uses a the ResourceSchema for a ResourceType
and a ResourceKey to transform data from the cache into a rich, reactive
object.

This class is not directly instantiable. To use it, you should
configure the store's `instantiateRecord` and `teardownRecord` hooks
with the matching hooks provided by this package.
