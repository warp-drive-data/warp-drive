---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11291/api/@warp-drive/experiments/pagination/types/PaginationContentFeaturesFor.md
description: >-
  Experimental: resolves a pagination mode to the content features `<Paginate
  />` yields, the infinite set for `'infinite'` and the paged set otherwise.
---

&#x20;

# &#x20;PaginationContentFeaturesFor\<RT = `unknown`, M *extends* [`PaginateMode`](PaginateMode.md) = `"paged"`>

```ts
type PaginationContentFeaturesFor<RT = unknown, M extends PaginateMode = "paged"> = M extends "infinite" ? InfinitePaginationContentFeatures<RT> : PagedPaginationContentFeatures<RT>;
```

Defined in: [warp-drive-packages/core/src/signals/pagination-subscription.ts:82](https://github.com/warp-drive-data/warp-drive/blob/29ab359ab5e9593db23fe661b989f7544558d789/warp-drive-packages/core/src/signals/pagination-subscription.ts#L82)

Resolves a [PaginateMode](PaginateMode.md) to the content features it exposes. Mirror of
[PaginationStateFor](PaginationStateFor.md).

## Type Parameters

### RT

`RT` = `unknown`

### M

`M` *extends* [`PaginateMode`](PaginateMode.md) = `"paged"`
