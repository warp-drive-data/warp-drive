---
url: >-
  /pr-preview/pr-11087/api/@warp-drive/core/signals/-leaked/interfaces/PageHints.md
---

# &#x20;PageHints()&#x20;

Defined in: [warp-drive-packages/core/src/signals/pagination-cache.ts:29](https://github.com/warp-drive-data/warp-drive/blob/53f90949527307caf1710da014dad97fc5e3ab13/warp-drive-packages/core/src/signals/pagination-cache.ts#L29)

A hint function for extracting the `currentPage` and `totalPages` from a loaded
document, for when the response does not expose these values through the
default `meta` locations. Provided by the consumer via `<Paginate />`'s
`@pageHints` arg:

```gts
<Paginate @pageHints={{...}} />
```

Since these values are attached to the shared [PaginationCache](PaginationCache.md), the hint is
a property of the *collection*, not the component. Every `<Paginate />` sharing a
collection must provide the same function reference — define it once at module
scope and import it everywhere.

```ts
PageHints(document): object;
```

Defined in: [warp-drive-packages/core/src/signals/pagination-cache.ts:30](https://github.com/warp-drive-data/warp-drive/blob/53f90949527307caf1710da014dad97fc5e3ab13/warp-drive-packages/core/src/signals/pagination-cache.ts#L30)

A hint function for extracting the `currentPage` and `totalPages` from a loaded
document, for when the response does not expose these values through the
default `meta` locations. Provided by the consumer via `<Paginate />`'s
`@pageHints` arg:

```gts
<Paginate @pageHints={{...}} />
```

Since these values are attached to the shared [PaginationCache](PaginationCache.md), the hint is
a property of the *collection*, not the component. Every `<Paginate />` sharing a
collection must provide the same function reference — define it once at module
scope and import it everywhere.

## Parameters

### document

[`ReactiveDocument`](../../../reactive/type-aliases/ReactiveDocument.md)<`unknown`>

## Returns

`object`

### currentPage

```ts
currentPage: number;
```

### totalPages

```ts
totalPages: number;
```
