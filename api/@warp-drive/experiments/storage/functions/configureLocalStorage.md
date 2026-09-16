---
url: /api/@warp-drive/experiments/storage/functions/configureLocalStorage.md
---

&#x20;

# &#x20;configureLocalStorage()

```ts
function configureLocalStorage(options): void;
```

Defined in: [storage/storage.ts:70](https://github.com/warp-drive-data/warp-drive/blob/cb1ab85858f637f156a9ff4e6ba8896c245d7a2c/warp-drive-packages/experiments/src/storage/storage.ts#L70)

Configure options for the localStorage singleton.
Must be called before getLocalStorage() is first invoked.

## Parameters

### options

[`ReactiveStorageOptions`](../interfaces/ReactiveStorageOptions.md)

## Returns

`void`
