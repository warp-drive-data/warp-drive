---
releases: ["5.10"]
---
The [Builders](/guides/the-manual/requests/builders.md) guide is rewritten around treating your
request builders as a typed SDK for your API: plain, documented, named functions that encode each
endpoint's contract and work in any framework. New sections cover typing requests without casts,
requesting the same data anywhere instead of prop drilling, passing builders to components, and
paginating by following the response's `links` rather than taking page arguments. A new cookbook
page, [Paginating POST Queries](/guides/the-manual/cookbook/paginating-post-queries.md), shows a
handler that generates `next` links for queries sent as a `POST` when the server can't.
