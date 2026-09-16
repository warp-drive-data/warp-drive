---
url: /api/@warp-drive/core/signals/-leaked/functions/getPaginationCache.md
---

# &#x20;getPaginationCache()&#x20;

```ts
function getPaginationCache<RT, E>(key): PaginationCache<RT, E>;
```

Defined in: [warp-drive-packages/core/src/signals/pagination-cache.ts:246](https://github.com/warp-drive-data/warp-drive/blob/35d5b9d62db1dc40d1d36c9cfc0536e7cab16c11/warp-drive-packages/core/src/signals/pagination-cache.ts#L246)

Get the shared [PaginationCache](../interfaces/PaginationCache.md) for a given cache key (the collection's
`first` or `self` link). Returns the same instance for the same key for the
lifetime of the module.

## Type Parameters

### RT

`RT`

### E

`E`

## Parameters

### key

`string`

## Returns

[`PaginationCache`](../interfaces/PaginationCache.md)<`RT`, `E`>
