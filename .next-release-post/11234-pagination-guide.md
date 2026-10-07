---
releases: ["5.10"]
---
The experimental pagination primitives now have a guide and API docs. The guide covers paged
and infinite modes, the `<Paginate />` and `<EachLink />` Ember components from
`@warp-drive/ember/experiments`, the JS API (`getPaginationState`, `getPaginationLinks`), page
hints, route-driven navigation, and migrating from legacy queries. The API reference is now
published under `@warp-drive/experiments/pagination`, where the primitives are imported from.

This release also fixes re-requesting a page that has already loaded, such as a reload or a
changed `@request`: the pagination state now picks up the newer response's links and total, so
`totalPages`, the next/last links and the numbered links no longer describe a collection that
has since shrunk. See [Pagination](/guides/the-manual/experiments/pagination.md).
