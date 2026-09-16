---
url: >-
  /pr-preview/pr-11111/api/@warp-drive/core/signals/-leaked/functions/getPaginationCache.md
---

# &#x20;getPaginationCache()&#x20;

```ts
function getPaginationCache<RT, E>(key): PaginationCache<RT, E>;
```

Defined in: [warp-drive-packages/core/src/signals/pagination-cache.ts:246](https://github.com/warp-drive-data/warp-drive/blob/35e6f11f90cd6cbcd7085d46039c7832ce1352f4/warp-drive-packages/core/src/signals/pagination-cache.ts#L246)

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
