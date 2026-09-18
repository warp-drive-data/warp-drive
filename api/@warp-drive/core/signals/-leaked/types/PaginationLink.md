---
url: /api/@warp-drive/core/signals/-leaked/types/PaginationLink.md
---

# &#x20;PaginationLink

```ts
type PaginationLink = 
  | RealPaginationLink
  | PlaceholderPaginationLink;
```

Defined in: [warp-drive-packages/core/src/signals/pagination-links.ts:202](https://github.com/warp-drive-data/warp-drive/blob/046b5e826d481c655eb9c1dd03a0fb171a65e0f3/warp-drive-packages/core/src/signals/pagination-links.ts#L202)

A member of [PaginationLinks.links](PaginationLinks.md#links): either a numbered
[RealPaginationLink](RealPaginationLink.md) or a [PlaceholderPaginationLink](PlaceholderPaginationLink.md) standing in
for a gap. Discriminate with [isReal](RealPaginationLink.md#isreal):

```ts
for (const link of links.links) {
  if (link.isReal) {
    // numbered link: link.index, link.setActive
  } else {
    // gap: link.indexRange
  }
}
```
