---
url: /api/@warp-drive/core/signals/-leaked/types/PaginationContentFeaturesFor.md
---

# &#x20;PaginationContentFeaturesFor\<RT = `unknown`, M *extends* [`PaginateMode`](PaginateMode.md) = `"paged"`>

```ts
type PaginationContentFeaturesFor<RT = unknown, M extends PaginateMode = "paged"> = M extends "infinite" ? InfinitePaginationContentFeatures<RT> : PagedPaginationContentFeatures<RT>;
```

Defined in: [warp-drive-packages/core/src/signals/pagination-subscription.ts:67](https://github.com/warp-drive-data/warp-drive/blob/fe160824603a0a8854d9d5efc41b9b23dc4e7b81/warp-drive-packages/core/src/signals/pagination-subscription.ts#L67)

Resolves a [PaginateMode](PaginateMode.md) to the content features it exposes. Mirror of
[PaginationStateFor](PaginationStateFor.md).

## Type Parameters

### RT

`RT` = `unknown`

### M

`M` *extends* [`PaginateMode`](PaginateMode.md) = `"paged"`
