---
url: >-
  https://canary.warp-drive.io/api/@warp-drive/experiments/storage/functions/configureLocalStorage.md
description: >-
  Experimental function that sets fallback and quota-handling options for the
  reactive localStorage singleton before its first use.
---

&#x20;

# &#x20;configureLocalStorage()

```ts
function configureLocalStorage(options: ReactiveStorageOptions): void;
```

Defined in: [warp-drive-packages/experiments/src/storage/storage.ts:76](https://github.com/warp-drive-data/warp-drive/blob/d5d42e1fa405f75c4c98f1176b6b7e27fc144fca/warp-drive-packages/experiments/src/storage/storage.ts#L76)

Configure options for the localStorage singleton.
Must be called before getLocalStorage() is first invoked.

## Parameters

### options

[`ReactiveStorageOptions`](../types/ReactiveStorageOptions.md)

## Returns

`void`
