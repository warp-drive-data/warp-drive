---
releases: ["5.9"]
---
Experimental reactive pagination primitives land, built on the pagination links in WarpDrive
response documents. `getPaginationState(request)` from `@warp-drive/experiments/pagination`
returns a reactive pagination state for a request, in two flavors: paged (`activePage`,
`totalPages`, `loadPage(url)`) and infinite (`data`, `hasNext`, `loadNext()`, `loadPrev()`).
Loaded pages are cached per collection, so every component paginating the same collection
shares them while keeping its own navigation state. Ember apps get `<Paginate />` and
`<EachLink />` from `@warp-drive/ember/experiments`; `<Paginate />` mirrors `<Request />`'s
blocks and picks a flavor with `@mode="paged"` (the default) or `@mode="infinite"`.

```ts
import { getPaginationState } from '@warp-drive/experiments/pagination';

const request = store.request({ url: '/users', method: 'GET' });
const pages = getPaginationState(request);
await request;
await pages.loadNext();
```
