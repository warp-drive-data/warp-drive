---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-9539/api/@warp-drive/experiments/pagination/types/PaginationContentFeatures.md
---

&#x20;

# &#x20;PaginationContentFeatures\<RT>

```ts
type PaginationContentFeatures<RT> = PagedPaginationContentFeatures<RT> & InfinitePaginationContentFeatures<RT>;
```

Defined in: [node\_modules/.pnpm/@warp-d\_5e1563e0e582c8365bb74466d3761d6d/node\_modules/@warp-drive/core/dist/signals/-leaked.d.ts:794](https://github.com/warp-drive-data/warp-drive/blob/323cb08c6f42aefbe421e128ab4c4e6fbb31a57d/node_modules/.pnpm/@warp-d_5e1563e0e582c8365bb74466d3761d6d/node_modules/@warp-drive/core/dist/signals/-leaked.d.ts#L794)

The full set of content features a [PaginationSubscription](PaginationSubscription.md) builds —
both modes' surfaces. The `<Paginate />` component narrows this to one mode
via [PaginationContentFeaturesFor](PaginationContentFeaturesFor.md) before yielding.

## Type Parameters

### RT

`RT`
