---
title: 2. Why that worked
description: See how the store, the request pipeline, and the todo schema let one store.request call and one <Request> block render the todos, without writing new code.
---

# Why that worked

Chapter 1 took one `store.request` call and one `<Request>` block. This chapter
covers the three pieces that made that enough: the store, the request pipeline and
the schema. You don't write any code in this chapter.

Nothing in `app/data/` imports Ember. The store, the schema and the builders you
write later are plain TypeScript.

## The store

Open `app/data/store.ts`:

```ts
import { useRecommendedStore } from '@warp-drive/core';
import { JSONAPICache } from '@warp-drive/json-api';

import { TodoSchema } from './schemas/todo.ts';

export default class Store extends useRecommendedStore({
  cache: JSONAPICache,
  schemas: [TodoSchema],
  handlers: [
    // TODO (chapter 3): add the JSON:API handler
  ],
}) {}
```

`useRecommendedStore` returns a `Store` class with the recommended defaults. You
supply the three parts that depend on your API:

- `cache`: how responses are stored. `JSONAPICache` understands
  [JSON:API](https://jsonapi.org/) documents, which is the format this API returns.
- `schemas`: the shape of each resource type.
- `handlers`: code that runs on every request before it's sent. This app has none
  yet. Chapter 3 adds one.

`app/services/store.ts` re-exports this class, which is how Ember injects it into
the route as `this.store`.

## The request pipeline

This is what happened when the route called `store.request({ url: '/api/todo' })`:

```
store.request({ url: '/api/todo' })
  │
  ▼
CacheHandler ──── fresh response cached for this request? ──► return it
  │ no
  ▼
your handlers     none yet
  │
  ▼
Fetch ──────────► GET /api/todo ──► API worker
                                        │
                                        ▼
JSONAPICache ◄──────────────── JSON:API document
  │  stores the document, and each todo in it by type and id
  ▼
the Future resolves to a reactive document: content.data is Todo[]
```

`useRecommendedStore` adds `CacheHandler` at the front of the pipeline and `Fetch`
at the end, so your handlers always sit between the cache and the network.

The request didn't set a method, so `Fetch` sent a `GET`. Because it's a `GET`, the
store keeps the response under its URL, and a second request for `/api/todo`
within the cache policy's lifetime is answered from the cache.

The records in `content.data` are reactive. When the cache changes a todo, every
template that reads that todo updates, whichever request loaded it.

See [Making Requests](../../the-manual/requests/index.md) for the full API.

## The schema

Open `app/data/schemas/todo.ts`:

```ts
export const TodoSchema = withDefaults({
  type: 'todo',
  fields: [
    { name: 'title', kind: 'field' },
    { name: 'completed', kind: 'field' },
  ],
});
```

A schema tells the store which fields a resource type has. It's plain data, so
the store reads it at runtime.

- `type: 'todo'` matches the `type` of each resource in the API's responses.
- `kind: 'field'` means the value is read from the resource's attributes as-is.
- `withDefaults` adds the fields every resource has: `id`, plus `$type` and
  `$key` for the resource's type and cache key.

The rest of the file is TypeScript types. `Todo` describes a record the way the
templates read it. The store doesn't generate these types from the schema, so the
two are kept in sync by hand.

The fields on a `Todo` are read-only. Setting `todo.completed = true` throws an
error, because the record reflects what the server last sent. To change a todo,
you edit a copy and save it; chapter 5 shows how.

See [Schemas](../../the-manual/schemas/index.md) for the other field kinds.

## What's missing

The request worked, but it relied on two things that won't last:

- JSON:API servers expect `Accept` and `Content-Type` headers of
  `application/vnd.api+json`. This API doesn't check them, but most servers
  do.
- The store doesn't know this request returns a list of todos. When you create a
  todo in chapter 4, the store needs that to know the list is out of date.

Chapter 3 fixes both, with request builders and a handler.
