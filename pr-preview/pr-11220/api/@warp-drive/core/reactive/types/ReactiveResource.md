---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11220/api/@warp-drive/core/reactive/types/ReactiveResource.md
---

# &#x20;ReactiveResource

```ts
interface ReactiveResource {}
```

Defined in: [warp-drive-packages/core/src/reactive/-private/record.ts:70](https://github.com/warp-drive-data/warp-drive/blob/6fcc86095d86a27a62d68c96a6109e3c92127406/warp-drive-packages/core/src/reactive/-private/record.ts#L70)

**`Hideconstructor`**

A class that uses a the ResourceSchema for a ResourceType
and a ResourceKey to transform data from the cache into a rich, reactive
object.

This class is not directly instantiable. To use it, you should
configure the store's `instantiateRecord` and `teardownRecord` hooks
with the matching hooks provided by this package.
