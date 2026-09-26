---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11218/api/@warp-drive/legacy/store/functions/restoreDeprecatedStoreBehaviors.md
---

&#x20;

# &#x20;restoreDeprecatedStoreBehaviors()

```ts
function restoreDeprecatedStoreBehaviors(StoreKlass: typeof Store$1): void;
```

Defined in: [warp-drive-packages/legacy/src/store.ts:34](https://github.com/warp-drive-data/warp-drive/blob/9a1ba598bf4f66d8348de75c9ad9359698e5c8ba/warp-drive-packages/legacy/src/store.ts#L34)

Restores the deprecated `findRecord`/`findAll`/`query`/`queryRecord`/
`findBelongsTo`/`findHasMany`/`createRecord`/`deleteRecord`/`saveRecord`
legacy-network-layer implementations of these methods onto the given
`Store` subclass, for apps that have not yet migrated to the
`RequestManager`-based equivalents.

## Parameters

### StoreKlass

*typeof* `Store$1`

## Returns

`void`
