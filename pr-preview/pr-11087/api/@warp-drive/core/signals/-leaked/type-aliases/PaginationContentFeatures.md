---
url: >-
  /pr-preview/pr-11087/api/@warp-drive/core/signals/-leaked/type-aliases/PaginationContentFeatures.md
---

# &#x20;PaginationContentFeatures\<RT>

```ts
type PaginationContentFeatures<RT> = PagedPaginationContentFeatures<RT> & InfinitePaginationContentFeatures<RT>;
```

Defined in: [warp-drive-packages/core/src/signals/pagination-subscription.ts:61](https://github.com/warp-drive-data/warp-drive/blob/53f90949527307caf1710da014dad97fc5e3ab13/warp-drive-packages/core/src/signals/pagination-subscription.ts#L61)

The full set of content features a [PaginationSubscription](../interfaces/PaginationSubscription.md) builds —
both modes' surfaces. The `<Paginate />` component narrows this to one mode
via [PaginationContentFeaturesFor](PaginationContentFeaturesFor.md) before yielding.

## Type Parameters

### RT

`RT`
