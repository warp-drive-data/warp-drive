---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11302/api/@warp-drive/core/types/symbols/variables/RecordStore.md
description: >-
  Internal symbol key under which a record instance keeps a reference to the
  store that owns it.
---

# &#x20;RecordStore

```ts
const RecordStore: "___(unique) Symbol(Store)";
```

Defined in: [warp-drive-packages/core/src/types/symbols.ts:18](https://github.com/warp-drive-data/warp-drive/blob/3f164194e7ab3e4dc44a2db5bc70f8b99cb7b4f4/warp-drive-packages/core/src/types/symbols.ts#L18)

Symbol used internally to stash a reference to the owning
[Store](../../../classes/Store.md) on a record instance.
