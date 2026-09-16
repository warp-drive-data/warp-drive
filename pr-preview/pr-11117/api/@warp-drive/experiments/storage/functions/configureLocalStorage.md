---
url: >-
  /pr-preview/pr-11117/api/@warp-drive/experiments/storage/functions/configureLocalStorage.md
---

&#x20;

# &#x20;configureLocalStorage()

```ts
function configureLocalStorage(options: ReactiveStorageOptions): void;
```

Defined in: [storage/storage.ts:70](https://github.com/warp-drive-data/warp-drive/blob/3e01a7f0373e29c82765d26c241a949bcf7d5b2d/warp-drive-packages/experiments/src/storage/storage.ts#L70)

Configure options for the localStorage singleton.
Must be called before getLocalStorage() is first invoked.

## Parameters

### options

[`ReactiveStorageOptions`](../types/ReactiveStorageOptions.md)

## Returns

`void`
