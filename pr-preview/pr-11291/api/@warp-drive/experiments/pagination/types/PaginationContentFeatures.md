---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11291/api/@warp-drive/experiments/pagination/types/PaginationContentFeatures.md
description: >-
  Experimental: the combined paged and infinite content features a pagination
  subscription builds, before `<Paginate />` narrows them to one mode.
---

&#x20;

# &#x20;PaginationContentFeatures\<RT>

```ts
type PaginationContentFeatures<RT> = PagedPaginationContentFeatures<RT> & InfinitePaginationContentFeatures<RT>;
```

Defined in: [warp-drive-packages/core/src/signals/pagination-subscription.ts:73](https://github.com/warp-drive-data/warp-drive/blob/cd257a192e0aa00670375a9be6faac263c773237/warp-drive-packages/core/src/signals/pagination-subscription.ts#L73)

The full set of content features a [PaginationSubscription](PaginationSubscription.md) builds —
both modes' surfaces. The `<Paginate />` component narrows this to one mode
via [PaginationContentFeaturesFor](PaginationContentFeaturesFor.md) before yielding.

## Type Parameters

### RT

`RT`
