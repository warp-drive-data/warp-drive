---
title: 2. Why that worked
description: The store, the request pipeline and the todo schema, the three pieces that made one store.request call enough.
---

# Why that worked

No code in this chapter. It's a five-minute look at the three pieces behind
chapter 1: the store, the request pipeline and the schema. None of them import
Ember. Everything in `app/data/` is plain TypeScript.

## The store

Open `app/data/store.ts`:

```ts
export default class Store extends useRecommendedStore({
  cache: JSONAPICache,
  schemas: [TodoSchema],
  handlers: [
    // TODO (chapter 3): add the JSON:API handler
  ],
}) {}
```

`useRecommendedStore` gives you a `Store` with sensible defaults. You supply the
parts that depend on your API: a cache that understands the response format, the
schemas, and handlers that run on every request. Chapter 3 adds the first
handler.

## The request pipeline

Here's what happened when the route called `store.request`:

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
the Future resolves: content.data is Todo[]
```

Your handlers always sit between the cache and the network. The records in
`content.data` are reactive: when the cache changes a todo, every template
showing it updates. [Making Requests](../../the-manual/requests/index.md) covers
the rest.

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

A schema tells the store which fields a resource type has. `type: 'todo'`
matches the `type` in the API's responses, and `withDefaults` adds `id`. The
`Todo` type below it is what templates read, and its fields are read-only. To
change a todo you edit a copy and save it, which is chapter 5.

## What's missing

Two things won't last. JSON:API servers expect `Accept` and `Content-Type`
headers this request didn't send. And the store doesn't know this request
returns a list of todos, which it needs once you start creating them. Chapter 3
fixes both.
