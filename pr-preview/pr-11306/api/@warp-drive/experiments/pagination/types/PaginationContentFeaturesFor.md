---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11306/api/@warp-drive/experiments/pagination/types/PaginationContentFeaturesFor.md
description: >-
  Experimental: resolves a pagination mode to the content features `<Paginate
  />` yields, the infinite set for `'infinite'` and the paged set otherwise.
---

&#x20;

# &#x20;PaginationContentFeaturesFor\<RT = `unknown`, M *extends* [`PaginateMode`](PaginateMode.md) = `"paged"`>

```ts
type PaginationContentFeaturesFor<RT = unknown, M extends PaginateMode = "paged"> = M extends "infinite" ? InfinitePaginationContentFeatures<RT> : PagedPaginationContentFeatures<RT>;
```

Defined in: [node\_modules/.pnpm/@warp-d\_5e1563e0e582c8365bb74466d3761d6d/node\_modules/@warp-drive/core/dist/signals/-leaked.d.ts:873](https://github.com/warp-drive-data/warp-drive/blob/7eaf148e53e5f6ffa145a9b2a3ce2c33c09608f8/node_modules/.pnpm/@warp-d_5e1563e0e582c8365bb74466d3761d6d/node_modules/@warp-drive/core/dist/signals/-leaked.d.ts#L873)

Resolves a [PaginateMode](PaginateMode.md) to the content features it exposes. Mirror of
[PaginationStateFor](PaginationStateFor.md).

## Type Parameters

### RT

`RT` = `unknown`

### M

`M` *extends* [`PaginateMode`](PaginateMode.md) = `"paged"`
