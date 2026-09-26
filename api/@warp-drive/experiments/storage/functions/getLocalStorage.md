---
url: >-
  https://canary.warp-drive.io/api/@warp-drive/experiments/storage/functions/getLocalStorage.md
description: >-
  Experimental function that returns the shared reactive wrapper around
  localStorage, creating it on first call.
---

&#x20;

# &#x20;getLocalStorage()

```ts
function getLocalStorage(): ReactiveStorage;
```

Defined in: [warp-drive-packages/experiments/src/storage/storage.ts:43](https://github.com/warp-drive-data/warp-drive/blob/7d14928562bb412c61b403e577095b9a3f9cb0b7/warp-drive-packages/experiments/src/storage/storage.ts#L43)

Retrieves the singleton instance of the LocalStorage service.

If the instance does not already exist, it is created.

## Returns

[`ReactiveStorage`](../types/ReactiveStorage.md)
