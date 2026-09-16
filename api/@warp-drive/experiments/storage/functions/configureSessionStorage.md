---
url: /api/@warp-drive/experiments/storage/functions/configureSessionStorage.md
---

&#x20;

# &#x20;configureSessionStorage()

```ts
function configureSessionStorage(options): void;
```

Defined in: [storage/storage.ts:78](https://github.com/warp-drive-data/warp-drive/blob/b6590b8852e5d32b32e3eece336d0f892e8b02a5/warp-drive-packages/experiments/src/storage/storage.ts#L78)

Configure options for the sessionStorage singleton.
Must be called before getSessionStorage() is first invoked.

## Parameters

### options

[`ReactiveStorageOptions`](../interfaces/ReactiveStorageOptions.md)

## Returns

`void`
