---
url: >-
  /pr-preview/pr-11116/api/@warp-drive/core/signals/-leaked/types/PagedPaginationState.md
---

# &#x20;PagedPaginationState\<RT, E>

Defined in: [warp-drive-packages/core/src/signals/pagination-state.ts:43](https://github.com/warp-drive-data/warp-drive/blob/a2f722ccb570e610770f1d852308196c7b6a911e/warp-drive-packages/core/src/signals/pagination-state.ts#L43)

The paged (single-page view) surface of a [PaginationState](PaginationState.md): render
[activePageRequest](PaginationState.md#activepagerequest), navigate with
[loadPage](PaginationState.md#loadpage). This is what the `<Paginate />`
component yields in `'paged'` mode (the default).

## Extends

* [`SharedPaginationState`](SharedPaginationState.md)<`RT`, `E`>

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

Defined in: [warp-drive-packages/core/src/signals/pagination-state.ts:28](https://github.com/warp-drive-data/warp-drive/blob/a2f722ccb570e610770f1d852308196c7b6a911e/warp-drive-packages/core/src/signals/pagination-state.ts#L28)

See [PaginationState.adoptPage](PaginationState.md#adoptpage).

#### Parameters

##### request

[`Future`](../../../request/types/Future.md)<`RT`>

#### Returns

[`Promise`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)<`RT` | `null`>

#### Inherited from

[`SharedPaginationState`](SharedPaginationState.md).[`adoptPage`](SharedPaginationState.md#adoptpage)

## Properties

### activePage

```ts
readonly activePage: 
  | Readonly<PageCache<RT, E>>
  | null;
```

Defined in: [warp-drive-packages/core/src/signals/pagination-state.ts:45](https://github.com/warp-drive-data/warp-drive/blob/a2f722ccb570e610770f1d852308196c7b6a911e/warp-drive-packages/core/src/signals/pagination-state.ts#L45)

See [PaginationState.activePage](PaginationState.md#activepage).

***

### activePageRequest

```ts
readonly activePageRequest: Future<RT> | null;
```

Defined in: [warp-drive-packages/core/src/signals/pagination-state.ts:47](https://github.com/warp-drive-data/warp-drive/blob/a2f722ccb570e610770f1d852308196c7b6a911e/warp-drive-packages/core/src/signals/pagination-state.ts#L47)

See [PaginationState.activePageRequest](PaginationState.md#activepagerequest).

***

### loadPage

```ts
loadPage: (url) => Promise<RT | null>;
```

Defined in: [warp-drive-packages/core/src/signals/pagination-state.ts:49](https://github.com/warp-drive-data/warp-drive/blob/a2f722ccb570e610770f1d852308196c7b6a911e/warp-drive-packages/core/src/signals/pagination-state.ts#L49)

See [PaginationState.loadPage](PaginationState.md#loadpage).

#### Parameters

##### url

`string`

#### Returns

[`Promise`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)<`RT` | `null`>

***

### totalPages

```ts
readonly totalPages: number;
```

Defined in: [warp-drive-packages/core/src/signals/pagination-state.ts:26](https://github.com/warp-drive-data/warp-drive/blob/a2f722ccb570e610770f1d852308196c7b6a911e/warp-drive-packages/core/src/signals/pagination-state.ts#L26)

See [PaginationState.totalPages](PaginationState.md#totalpages).

#### Inherited from

[`SharedPaginationState`](SharedPaginationState.md).[`totalPages`](SharedPaginationState.md#totalpages)
