---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11142/api/@warp-drive/experiments/storage/functions/configureSessionStorage.md
---

&#x20;

# &#x20;configureSessionStorage()

```ts
function configureSessionStorage(options: ReactiveStorageOptions): void;
```

Defined in: [warp-drive-packages/experiments/src/storage/storage.ts:78](https://github.com/warp-drive-data/warp-drive/blob/fe5df5abab153c45663c00dfcbcd8d5192080e20/warp-drive-packages/experiments/src/storage/storage.ts#L78)

Configure options for the sessionStorage singleton.
Must be called before getSessionStorage() is first invoked.

## Parameters

### options

[`ReactiveStorageOptions`](../types/ReactiveStorageOptions.md)

## Returns

`void`
