---
url: >-
  /pr-preview/pr-11117/api/@warp-drive/experiments/storage/functions/configureSessionStorage.md
---

&#x20;

# &#x20;configureSessionStorage()

```ts
function configureSessionStorage(options: ReactiveStorageOptions): void;
```

Defined in: [storage/storage.ts:78](https://github.com/warp-drive-data/warp-drive/blob/efe23be24be92441a465081c00eff01e7e2cc0e8/warp-drive-packages/experiments/src/storage/storage.ts#L78)

Configure options for the sessionStorage singleton.
Must be called before getSessionStorage() is first invoked.

## Parameters

### options

[`ReactiveStorageOptions`](../types/ReactiveStorageOptions.md)

## Returns

`void`
