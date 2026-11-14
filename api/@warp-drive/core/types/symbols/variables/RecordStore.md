---
url: >-
  https://canary.warp-drive.io/api/@warp-drive/core/types/symbols/variables/RecordStore.md
description: >-
  Internal symbol key under which a record instance keeps a reference to the
  store that owns it.
---

# &#x20;RecordStore

```ts
const RecordStore: "___(unique) Symbol(Store)";
```

Defined in: [warp-drive-packages/core/src/types/symbols.ts:18](https://github.com/warp-drive-data/warp-drive/blob/82d0c44ddc9be2d10e5e45f1f264e9d72673e78b/warp-drive-packages/core/src/types/symbols.ts#L18)

Symbol used internally to stash a reference to the owning
[Store](../../../classes/Store.md) on a record instance.
