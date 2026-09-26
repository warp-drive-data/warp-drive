---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11285/guides/tutorials/todomvc/toggle.md
description: >-
  Save a todo's completed state with patchTodo, see why the active and completed
  lists go stale, and move the todo between cached lists with store.cache.patch.
---

# Toggle

Click a checkbox and the todo is struck through, but a reload undoes it. Let's
save the toggle. Saving turns out to be half the job: the todo also has to move
between the Active and Completed lists.

## Save it

Open `app/components/todo-app/todo-item.gts` and find `TODO (chapter 6)` in
`CompletedForm`:

```ts
try {
  todo.completed = completed;
  // TODO (chapter 6): save the toggle and move the todo between lists
} catch (e) {
  reportError(new Error('Could not update todo completion state', { cause: e }), { toast: true });
  todo.completed = wasCompleted;
}
```

The line above the comment is why the checkbox already works: `todo` is chapter
5's editable copy. Replace the comment with the `patchTodo` builder from
chapter 5:

```ts
await this.store.request(patchTodo(todo, { completed }));
```

## Check it

Toggle a todo and reload. It stays toggled. But the footer still says "2 items
left", and on the Active page a completed todo doesn't leave.

## Why the lists are stale

The cache stores each list as its own document: the todo keys the server
returned for that URL.

```
GET /api/todo                          [1, 2, 3]
GET /api/todo?filter[completed]=false  [2, 3]
GET /api/todo?filter[completed]=true   [1]
```

The `PATCH` updated todo 2's `completed` field everywhere it appears. But the
cache doesn't know what `filter[completed]` means, so it can't tell that todo 2
now belongs in the other list.

Chapter 4 solved this by refetching. That works here too, at a `GET` per list.
This time you know what changed, so let's change the cached lists directly.

## Move the todo between lists

Add to `app/data/builders/update.ts`:

```ts
/** Moves a todo from the cached "active" list to the cached "completed" list. */
export function patchCacheTodoCompleted(store: Store, todo: Todo): void {
  moveBetweenLists(store, todo, { from: getActiveTodos(), to: getCompletedTodos() });
}

/** Moves a todo from the cached "completed" list to the cached "active" list. */
export function patchCacheTodoActivated(store: Store, todo: Todo): void {
  moveBetweenLists(store, todo, { from: getCompletedTodos(), to: getActiveTodos() });
}

function moveBetweenLists(
  store: Store,
  todo: Todo,
  lists: { from: ReturnType<typeof getActiveTodos>; to: ReturnType<typeof getActiveTodos> }
): void {
  const value = keyForSavedResource(todo);
  const from = keyForRequest(store, lists.from);
  const to = keyForRequest(store, lists.to);

  // Only patch lists that have been requested; the others will fetch fresh.
  if (store.cache.peekRequest(to)) {
    store.cache.patch({ record: to, op: 'add', field: 'data', value, index: serverIndex(store, to, value) });
  }
  if (store.cache.peekRequest(from)) {
    store.cache.patch({ record: from, op: 'remove', field: 'data', value });
  }
}
```

And the imports. The `utils.ts` line replaces chapter 5's:

```ts
import type Store from '../store.ts';
import { getActiveTodos, getCompletedTodos } from './query.ts';
import { keyForRequest, keyForSavedResource, serverIndex } from './utils.ts';
```

The builders name the lists without sending anything, and `keyForRequest` asks
the store which cache key each one is stored under. Then `store.cache.patch`
edits the cached documents as if the server had: `op: 'add'` puts the todo's key
into one list and `op: 'remove'` takes it out of the other.

`serverIndex`, shipped in `utils.ts`, works out where the server would put the
todo in its new list, so the cache matches what a refetch would return.

## Call it after the save

Back in `patchTodoToggle`, after the request:

```ts
await this.store.request(patchTodo(todo, { completed }));

if (completed) {
  patchCacheTodoCompleted(this.store, todo);
} else {
  patchCacheTodoActivated(this.store, todo);
}
```

Import them next to `patchTodo`:

```ts
import { patchCacheTodoActivated, patchCacheTodoCompleted, patchTodo } from '#app/data/builders/update.ts';
```

The lists change only after the `await`, so a failed save leaves them alone.

## Check it again

Toggle a todo. The footer count updates, "Clear completed" appears, and on the
Active page a completed todo leaves the list. Each toggle is one `PATCH` and
nothing else.

See [Caching](../../the-manual/caching/index.md) for what else the cache can do.

## What's next

Chapter 7 deletes todos. That one the cache handles alone, because a deleted
todo belongs in no list.
