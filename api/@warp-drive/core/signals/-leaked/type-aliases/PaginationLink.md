---
url: /api/@warp-drive/core/signals/-leaked/type-aliases/PaginationLink.md
---

# &#x20;PaginationLink

```ts
type PaginationLink = 
  | RealPaginationLink
  | PlaceholderPaginationLink;
```

Defined in: [warp-drive-packages/core/src/signals/pagination-links.ts:202](https://github.com/warp-drive-data/warp-drive/blob/b6590b8852e5d32b32e3eece336d0f892e8b02a5/warp-drive-packages/core/src/signals/pagination-links.ts#L202)

A member of [PaginationLinks.links](../interfaces/PaginationLinks.md#links): either a numbered
[RealPaginationLink](../interfaces/RealPaginationLink.md) or a [PlaceholderPaginationLink](../interfaces/PlaceholderPaginationLink.md) standing in
for a gap. Discriminate with [isReal](../interfaces/RealPaginationLink.md#isreal):

```ts
for (const link of links.links) {
  if (link.isReal) {
    // numbered link: link.index, link.setActive
  } else {
    // gap: link.indexRange
  }
}
```
