---
description: Apply operations with cache.patch to add, update, or remove resources, relationship members, and request results in the cache's remote state without making a request.
---

# Patching The Cache

Most of the time the cache learns what the server holds by making a request. Sometimes
you already know: a save succeeded and you know which lists it changed, or the server
pushed a message saying a record was updated. In those cases you can apply the change
to the cache yourself with [`cache.patch`](/api/@warp-drive/core/types/cache/types/Cache#patch),
and skip the request.

Each change is an **operation**: a plain object naming what to do (`op`), what to do it
to (`record`), and usually a `field` and a `value`. Every record, relationship, and
request result that reads the patched state updates, just as if the change had arrived
in a response.

```ts
store.cache.patch({
  op: 'update',
  record: userKey,
  field: 'name',
  value: 'Chris',
});
```

## Patch or Refetch?

Patching makes you responsible for what a refetch would have told you. Refetch when the
server should decide what changed. Patch when you already know exactly what changed, and
can say it in a few operations.

A common case is a list. The cache stores each request's result as its own document, and
it has no way to know what a URL like `/api/todo?filter[completed]=false` means. When a todo
becomes completed, the cache updates its `completed` field everywhere it appears, but it
can't move the todo out of that list. You either refetch the list, or patch it. Chapter 6
of the TodoMVC tutorial, [Toggle](../../tutorials/todomvc/toggle.md), walks through both
choices.

## Remote State Only

The cache holds two layers of state for each resource. **Remote state** is what the server
has. **Local state** is remote state with any unsaved edits laid on top. Operations change
remote state only. They don't touch unsaved edits, and an edited field keeps showing its
edit until it's saved or discarded.

There is one exception. If an operation sets a field to the same value as an unsaved edit,
the cache treats the edit as already saved and drops it, since the server now holds it.

To change local state instead, the way a form would, edit the record. See
[Mutating State](./mutations.md).

## Getting Cache Keys

Every operation's `record` is a cache key. There are two kinds.

**A resource key** names one resource. Operations need the key of a saved resource, one with
an `id`, which the types call a `PersistedResourceKey`.

- For a record you already have, use [`recordIdentifierFor`](/api/@warp-drive/core/functions/recordIdentifierFor).
  Its return type doesn't promise an `id`, because a record created in the browser has none
  until it's saved, so cast it when you know the record is saved.
- For a resource you know by type and id, such as one named in a server message, use
  `store.cacheKeyManager.getOrCreateRecordIdentifier({ type, id })`. It returns the existing
  key if the resource is cached, and a new one if it isn't. A new key is safe to use with
  `'add'` and `'update'`, which add the resource if it isn't cached.

**A request key** names one request's cached result: the document its response is stored
under. Rebuild the same request object you would send, and pass it to
`store.cacheKeyManager.getOrCreateDocumentIdentifier`. A request is just an object, so
building one sends nothing. It returns `null` for a request that can never be cached, such as a
`POST`.

```ts
import type { PersistedResourceKey } from '@warp-drive/core/types/identifier';
import { recordIdentifierFor } from '@warp-drive/core';

// A record you already have, known to be saved
const todoKey = recordIdentifierFor(todo) as PersistedResourceKey<'todo'>;

// A resource named by type and id
const userKey = store.cacheKeyManager.getOrCreateRecordIdentifier({ type: 'user', id: '1' });

// A request's cached result. getActiveTodos() is your app's request builder.
const activeTodos = store.cacheKeyManager.getOrCreateDocumentIdentifier(getActiveTodos());
```

Only patch a request result that is in the cache. A list that was never fetched will fetch
fresh when something asks for it. Patching it first would leave a cached list holding only
what you patched in, which could then be served instead of the real one. `store.cache.peekRequest(key)` returns the cached document, or nothing:

```ts
if (activeTodos && store.cache.peekRequest(activeTodos)) {
  store.cache.patch({ op: 'remove', record: activeTodos, field: 'data', value: todoKey });
}
```

## Operations

What an operation does depends on its `op`, whether `record` is a resource key or a request
key, and whether it has a `field`. The [operation types](/api/@warp-drive/core/types/cache/operations/)
in the API docs list every property.

### Resources

| `op` | `field` | `value` | Effect |
| --- | --- | --- | --- |
| `'add'` | none | a JSON:API resource object | Adds the resource, or merges into it if it's already cached. |
| `'update'` | none | a JSON:API resource object | Merges the given attributes and relationships into the resource. Fields it leaves out keep their values. |
| `'update'` | an attribute | the new value | Replaces that one attribute. |
| `'update'` | a relationship | a relationship object whose `data` holds resource keys, such as `{ data: authorKey }` or `{ data: [tagKey] }` | Replaces that relationship. |
| `'remove'` | none | none | Treats the resource as deleted on the server, and unloads it. |

`'add'` and `'update'` without a `field` behave the same: both merge. Use whichever reads
better for the change you're applying.

### Relationship Members

These take a resource key as `record` and a relationship's name as `field`. `value` is one
resource key or an array of them.

| `op` | Effect |
| --- | --- |
| `'add'` | Adds the members to the relationship. With `index`, inserts them there; without one, appends them. |
| `'remove'` | Removes the members from the relationship. With `index`, removes them from that position. |

To replace a relationship's whole membership at once, use `'update'` with the relationship
as the `field`, from the table above.

### Request Results

These take a request key as `record`, and `'data'` or `'included'` as `field`. `value` is one
resource key or an array of them.

| `op` | Effect |
| --- | --- |
| `'add'` | Adds the resources to the document's `data` or `included`. With `index`, inserts them there; without one, appends them. |
| `'remove'` | Removes the resources from the document's `data` or `included`. With `index`, removes them from that position. |

Without an `index`, an added resource goes at the end. If the server would have put it
somewhere else, such as in a list sorted by date, work out the index yourself. The cache
doesn't know the server's ordering rules.

Updating a request result with `'update'`, and removing one entirely, aren't supported yet.

### Merging Two Keys

`'mergeIdentifiers'` tells the cache that two resource keys turned out to be the same
resource. The store applies it for you when it discovers this, so you don't need to send it.

## Patching Many Things at Once

Pass an array to apply several operations together:

```ts
store.cache.patch([
  { op: 'add', record: completedTodos, field: 'data', value: todoKey },
  { op: 'remove', record: activeTodos, field: 'data', value: todoKey },
]);
```

The operations are applied in order, and everything reading the patched state is notified
once, after the last one, rather than after each one. Prefer an array whenever one change
touches several places.

## Mistakes the Cache Catches

In development builds, the cache asserts when an operation can't be applied:

- `record` is not a cache key.
- An `'update'` names a `field` that isn't in the resource's schema.
- An `'update'` targets a request result.
- An `'add'` or a `'remove'` targets a request result without a `field`.

## What's Next

- [Real-time](../realtime/index.md) shows how to turn WebSocket and server-sent event
  messages into operations.
- [Bulk Operations](../../tutorials/todomvc/bulk-operations.md), chapter 8 of the TodoMVC
  tutorial, patches the cache after a request whose response names no records.
