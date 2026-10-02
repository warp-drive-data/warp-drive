---
releases: ["5.10"]
---
Reactive documents can now type the `meta` and `errors` an endpoint actually returns, instead
of `meta` being an arbitrary JSON object you coerce on every read.

- `ReactiveDataDocument`, `ReactiveErrorDocument`, `ReactiveDocument` and `withReactiveResponse`
  take optional type params for the meta, the error objects, and the error document's meta
  (which defaults to the success meta). `next()`, `prev()`, `first()`, `last()` and `fetch()`
  carry them through.
- Naming the meta makes `meta` required, so `content.meta.total` reads without `?.`; leaving it
  off keeps `meta` optional, so interfaces, intersections and `implements` built on a document
  type keep working.
- The `query`, `postQuery`, `findRecord` and `updateRecord` builders in `@warp-drive/utilities`
  take the same params. The `json-api` builders type `errors` as `ApiError` by default, whose
  `source.pointer` is now optional.

```ts
const { content } = await store.request(query<User, PageMeta>('user', { page: { limit: 10 } }));
content.meta.page.limit; // number
```

See [Typing Requests](/guides/the-manual/requests/typing-requests.md).
