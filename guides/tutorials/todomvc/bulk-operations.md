---
title: 8. Bulk operations
description: Toggle every todo and clear the completed ones with one request each, update the cache yourself when the response has no todos, then see where to go after the tutorial.
---

# Bulk operations

Two controls act on many todos at once: the "Mark all as complete" arrow beside the
new todo input, and "Clear completed" in the footer. Each could send one request per
todo. This API offers one request for the whole set instead, so you write those.

## Write the builders

The API has two bulk endpoints. JSON:API doesn't define bulk updates, so these
follow the API's own format:

| Request                                                   | What it does                                   |
| --------------------------------------------------------- | ---------------------------------------------- |
| `PATCH /api/todo/ops.bulk.patchAll?filter[completed]=…`   | Sets the body's `attributes` on every match    |
| `DELETE /api/todo/ops.bulk.deleteAll?filter[completed]=…` | Deletes every match                            |

Both answer with `{ "data": null }`: they don't return the todos they changed.

Create `app/data/builders/bulk.ts`:

```ts
import type { ReactiveDataDocument } from '@warp-drive/core/reactive';
import { withReactiveResponse, withResponseType } from '@warp-drive/core/request';
import type { RequestInfo } from '@warp-drive/core/types/request';
import { buildBaseURL, buildQueryParams } from '@warp-drive/utilities';

import type { Todo } from '../schemas/todo.ts';
import type Store from '../store.ts';
import { patchCacheTodoActivated, patchCacheTodoCompleted } from './update.ts';
import { keyForSavedResource } from './utils.ts';

interface EmptyDocument {
  data: null;
}

/**
 * PATCH /api/todo/ops.bulk.patchAll — used by "toggle all". Sets `completed`
 * on every todo that doesn't already have it.
 */
export function bulkPatchTodos(attributes: { completed: boolean }): RequestInfo<EmptyDocument> {
  const url = buildBaseURL({ resourcePath: 'todo' });
  const queryString = buildQueryParams({ 'filter[completed]': !attributes.completed });

  return withResponseType<EmptyDocument>({
    method: 'PATCH',
    url: `${url}/ops.bulk.patchAll?${queryString}`,
    body: JSON.stringify({ attributes }),
  });
}

/**
 * Applies a "toggle all" to the cache. The server replies with no todos, so
 * we set `completed` on each changed todo ourselves and move it into the
 * matching cached list. Pass only the todos that actually changed.
 */
export function bulkPatchCacheTodos(store: Store, changed: Todo[], completed: boolean): void {
  for (const todo of changed) {
    store.cache.patch({ record: keyForSavedResource(todo), op: 'update', field: 'completed', value: completed });
    if (completed) patchCacheTodoCompleted(store, todo);
    else patchCacheTodoActivated(store, todo);
  }
}

/**
 * DELETE /api/todo/ops.bulk.deleteAll — used by "clear completed". Deletes
 * every completed todo; pass the completed todos so the cache can drop them.
 */
export function bulkDeleteTodos(todos: Todo[]): RequestInfo<ReactiveDataDocument<null>> {
  const url = buildBaseURL({ resourcePath: 'todo' });
  const queryString = buildQueryParams({ 'filter[completed]': true });

  return withReactiveResponse<null>({
    method: 'DELETE',
    url: `${url}/ops.bulk.deleteAll?${queryString}`,

    // Removes each todo from every cached list once the request succeeds.
    op: 'deleteRecord',
    records: todos.map(keyForSavedResource),
  });
}
```

The three functions handle the two requests differently.

**Toggle all.** `bulkPatchTodos` filters on the opposite of the new value, so the
API changes only the todos that don't have it yet. The response names no todos,
so the cache learns nothing from it, and nothing on the page would change. The
builder uses `withResponseType` rather than `withReactiveResponse` because there's
no record in the response to make reactive.

`bulkPatchCacheTodos` makes the change in the cache instead, for each todo the
request changed:

- `op: 'update'` sets the todo's `completed` field, as if the server had sent the
  new value. Every list holding the todo shows it.
- The chapter 6 functions move the todo between the active and completed lists,
  each into the place the server would put it.

**Clear completed.** `bulkDeleteTodos` works like chapter 7's `deleteTodo`, with
more than one key in `records`. The response names no todos, but the request
already says which ones it deletes. When it succeeds, the cache marks each one as
deleted, and every list drops them.

## Send them

Open `app/components/todo-app/toggle-all-todos.gts`. Before the `TODO (chapter 8)`
comment, the shipped code works out the new value and which of the listed todos
it changes:

```ts
const completed = !this.areViewableCompleted;
const changed = this.args.todos.filter((todo) => todo.completed !== completed);
```

Replace the comment with the request, then the cache update:

```ts
await this.store.request(bulkPatchTodos({ completed }));
bulkPatchCacheTodos(this.store, changed, completed);
```

Open `app/components/todo-app/clear-completed-todos.gts`. `ClearCompleted`
receives the completed list from chapter 3's `<Request>` as `@completed`. Replace
its `TODO (chapter 8)` comment with:

```ts
await this.store.request(bulkDeleteTodos(this.args.completed));
```

Import the builders in each file:

```ts
import { bulkPatchCacheTodos, bulkPatchTodos } from '#app/data/builders/bulk.ts';
```

```ts
import { bulkDeleteTodos } from '#app/data/builders/bulk.ts';
```

## Check it

Click the arrow beside the new todo input. Every todo is struck through, the
footer says "0 items left" and "Clear completed" appears. Click it again, and
every todo is active. Each click sends one `PATCH`.

Complete a few todos and click "Clear completed". They disappear, and so does the
button. That's one `DELETE`.

The app is finished: every control in the TodoMVC spec works.

## Where next

You've written the data layer of an app. Along the way you used:

| Chapter | ***Warp*Drive** concept                                                     |
| ------- | --------------------------------------------------------------------------- |
| 1       | `store.request`, and `<Request>` to render a request's states               |
| 2       | The store, the request pipeline and schemas                                 |
| 3       | Builders, `cacheOptions.types`, and a handler                               |
| 4       | Invalidation with `createRecord`, and `@autorefresh`                        |
| 5       | Editable copies with `checkout`, and saving with `updateRecord`             |
| 6       | Changing cached lists with `store.cache.patch`                              |
| 7       | Deleting with `deleteRecord`                                                |
| 8       | Bulk requests, and updating the cache when the response doesn't             |

To go further:

- [Making Requests](../../the-manual/requests/index.md) covers the rest of the
  request API, including the options every request accepts.
- [Caching](../../the-manual/caching/index.md) explains how the cache stores
  documents and resources, and how the cache policy decides when a response is
  stale.
- [Schemas](../../the-manual/schemas/index.md) covers the other field kinds, and
  how a schema shapes the records you read.
- [Relational Data](../../the-manual/relational-data/index.md) is the next step if
  your data has relationships, which todos don't.
- The API also supports pagination, with `page[limit]` and `page[offset]` and
  `links` to the other pages. [Pagination](../../the-manual/experiments/pagination.md)
  is an experimental ***Warp*Drive** feature you could add to the list.
