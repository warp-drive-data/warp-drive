---
url: >-
  /warp-drive/pr-preview/pr-11111/api/@warp-drive/core/signals/-leaked/interfaces/SharedPaginationState.md
---

# &#x20;SharedPaginationState\<RT, E>

Defined in: [warp-drive-packages/core/src/signals/pagination-state.ts:24](https://github.com/warp-drive-data/warp-drive/blob/998da8d5cb68764b43a8503a38424bc85af654e3/warp-drive-packages/core/src/signals/pagination-state.ts#L24)

The part of a [PaginationState](PaginationState.md) available to both navigation surfaces.

## Extended by

* [`PagedPaginationState`](PagedPaginationState.md)
* [`InfinitePaginationState`](InfinitePaginationState.md)

## Type Parameters

### RT

`RT` = `unknown`

### E

`E` = `unknown`

## Methods

### adoptPage()

```ts
adoptPage(request): Promise<RT | null>;
```

Defined in: [warp-drive-packages/core/src/signals/pagination-state.ts:28](https://github.com/warp-drive-data/warp-drive/blob/998da8d5cb68764b43a8503a38424bc85af654e3/warp-drive-packages/core/src/signals/pagination-state.ts#L28)

See [PaginationState.adoptPage](PaginationState.md#adoptpage).

#### Parameters

##### request

[`Future`](../../../request/interfaces/Future.md)<`RT`>

#### Returns

[`Promise`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)<`RT` | `null`>

## Properties

### totalPages

```ts
readonly totalPages: number;
```

Defined in: [warp-drive-packages/core/src/signals/pagination-state.ts:26](https://github.com/warp-drive-data/warp-drive/blob/998da8d5cb68764b43a8503a38424bc85af654e3/warp-drive-packages/core/src/signals/pagination-state.ts#L26)

See [PaginationState.totalPages](PaginationState.md#totalpages).
