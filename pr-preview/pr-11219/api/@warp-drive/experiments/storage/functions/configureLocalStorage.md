---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11219/api/@warp-drive/experiments/storage/functions/configureLocalStorage.md
---

&#x20;

# &#x20;configureLocalStorage()

```ts
function configureLocalStorage(options: ReactiveStorageOptions): void;
```

Defined in: [warp-drive-packages/experiments/src/storage/storage.ts:70](https://github.com/warp-drive-data/warp-drive/blob/6638c699171a70d967515a5e333c695a52540144/warp-drive-packages/experiments/src/storage/storage.ts#L70)

Configure options for the localStorage singleton.
Must be called before getLocalStorage() is first invoked.

## Parameters

### options

[`ReactiveStorageOptions`](../types/ReactiveStorageOptions.md)

## Returns

`void`
