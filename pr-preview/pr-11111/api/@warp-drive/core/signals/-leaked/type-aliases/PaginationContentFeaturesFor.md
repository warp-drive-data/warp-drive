---
url: >-
  /pr-preview/pr-11111/api/@warp-drive/core/signals/-leaked/type-aliases/PaginationContentFeaturesFor.md
---

# &#x20;PaginationContentFeaturesFor\<RT, M>

```ts
type PaginationContentFeaturesFor<RT, M> = M extends "infinite" ? InfinitePaginationContentFeatures<RT> : PagedPaginationContentFeatures<RT>;
```

Defined in: [warp-drive-packages/core/src/signals/pagination-subscription.ts:67](https://github.com/warp-drive-data/warp-drive/blob/f4874b11d917637fc69e13d92cdd6e92ce16baa8/warp-drive-packages/core/src/signals/pagination-subscription.ts#L67)

Resolves a [PaginateMode](PaginateMode.md) to the content features it exposes. Mirror of
[PaginationStateFor](PaginationStateFor.md).

## Type Parameters

### RT

`RT` = `unknown`

### M

`M` *extends* [`PaginateMode`](PaginateMode.md) = `"paged"`
