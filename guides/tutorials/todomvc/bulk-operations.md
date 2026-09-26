---
title: 8. Bulk operations
description: Toggle every todo and clear the completed ones with one request each, update the cache yourself when the response has no todos, then see where to go next.
---

# Bulk operations

Two controls act on many todos at once: the "Mark all as complete" arrow beside
the input, and "Clear completed" in the footer. This API has one request for
each, so let's write those.

## Write the builders

JSON:API doesn't define bulk updates, so the API has two endpoints of its own.
Both answer `{ "data": null }` without the todos they changed, and that shapes
the code.

Create `app/data/builders/bulk.ts`:

```ts
import { withResponseType } from '@warp-drive/core/request';
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
export function bulkDeleteTodos(todos: Todo[]): RequestInfo<EmptyDocument> {
  const url = buildBaseURL({ resourcePath: 'todo' });
  const queryString = buildQueryParams({ 'filter[completed]': true });

  return withResponseType<EmptyDocument>({
    method: 'DELETE',
    url: `${url}/ops.bulk.deleteAll?${queryString}`,

    // Removes each todo from every cached list once the request succeeds.
    op: 'deleteRecord',
    records: todos.map(keyForSavedResource),
  });
}
```

`withResponseType` types a response with no records in it, where
`withReactiveResponse` would have nothing to make reactive.

**Toggle all.** `bulkPatchTodos` filters on the opposite of the new value, so
the API changes only the todos that need it. Since the response names no todos,
`bulkPatchCacheTodos` does the cache's job by hand: `op: 'update'` sets
`completed` on each changed todo, and chapter 6's functions move it between
lists.

**Clear completed.** `bulkDeleteTodos` is chapter 7's `deleteTodo` with many
keys in `records`. The request already says which todos it deletes, so the cache
drops them all when it succeeds.

## Send them

Open `app/components/todo-app/toggle-all-todos.gts`. Above the `TODO (chapter 8)`
comment, the shipped code works out the new value and which todos change:

```ts
const completed = !this.areViewableCompleted;
const changed = this.args.todos.filter((todo) => todo.completed !== completed);
```

Replace the comment with the request, then the cache update:

```ts
await this.store.request(bulkPatchTodos({ completed }));
bulkPatchCacheTodos(this.store, changed, completed);
```

In `app/components/todo-app/clear-completed-todos.gts`, replace the
`TODO (chapter 8)` comment:

```ts
await this.store.request(bulkDeleteTodos(this.args.completed));
```

Import `bulkPatchTodos` and `bulkPatchCacheTodos` in the first file and
`bulkDeleteTodos` in the second, from `#app/data/builders/bulk.ts`.

## Check it

Click the arrow. Everything is struck through, the footer says "0 items left",
and "Clear completed" appears. Click it again and everything is active. One
`PATCH` per click.

Complete a few todos and click "Clear completed". Gone, in one `DELETE`.

That's it. Every control in the TodoMVC spec works, and you wrote the whole
data layer: five builder files and one handler.

## Where next

- [Making Requests](../../the-manual/requests/index.md): the rest of the request
  API.
- [Caching](../../the-manual/caching/index.md): how the cache stores documents,
  and when a response counts as stale.
- [Schemas](../../the-manual/schemas/index.md): the other field kinds.
- [Relational Data](../../the-manual/relational-data/index.md): when your data
  has relationships.
- [Pagination](../../the-manual/experiments/pagination.md), experimental. This
  API supports `page[limit]` and `page[offset]` if you want to try it.
