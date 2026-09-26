---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11218/api/@warp-drive/experiments/pagination/types/PaginationContentFeatures.md
---

&#x20;

# &#x20;PaginationContentFeatures\<RT>

```ts
type PaginationContentFeatures<RT> = PagedPaginationContentFeatures<RT> & InfinitePaginationContentFeatures<RT>;
```

Defined in: [node\_modules/.pnpm/@warp-d\_5e1563e0e582c8365bb74466d3761d6d/node\_modules/@warp-drive/core/dist/signals/-leaked.d.ts:794](https://github.com/warp-drive-data/warp-drive/blob/9a1ba598bf4f66d8348de75c9ad9359698e5c8ba/node_modules/.pnpm/@warp-d_5e1563e0e582c8365bb74466d3761d6d/node_modules/@warp-drive/core/dist/signals/-leaked.d.ts#L794)

The full set of content features a [PaginationSubscription](PaginationSubscription.md) builds —
both modes' surfaces. The `<Paginate />` component narrows this to one mode
via [PaginationContentFeaturesFor](PaginationContentFeaturesFor.md) before yielding.

## Type Parameters

### RT

`RT`
