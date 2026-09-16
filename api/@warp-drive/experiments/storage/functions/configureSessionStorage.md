---
url: /api/@warp-drive/experiments/storage/functions/configureSessionStorage.md
---

&#x20;

# &#x20;configureSessionStorage()

```ts
function configureSessionStorage(options): void;
```

Defined in: [storage/storage.ts:78](https://github.com/warp-drive-data/warp-drive/blob/366068ebc56a664fb2411fcf7b3b351cc19cd54a/warp-drive-packages/experiments/src/storage/storage.ts#L78)

Configure options for the sessionStorage singleton.
Must be called before getSessionStorage() is first invoked.

## Parameters

### options

[`ReactiveStorageOptions`](../interfaces/ReactiveStorageOptions.md)

## Returns

`void`
