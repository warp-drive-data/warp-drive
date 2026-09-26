---
title: 6. Toggle
description: Save a todo's completed state with patchTodo, see why the active and completed lists go stale, and move the todo between cached lists with store.cache.patch.
---

# Toggle

Clicking a todo's checkbox strikes it through, but a reload brings it back. In this
chapter you save the change. Saving turns out to be half the job: the todo also has
to move between the Active and Completed lists.

## Save it

Open `app/components/todo-app/todo-item.gts` and find `TODO (chapter 6)`, in the
`patchTodoToggle` method of `CompletedForm`:

```ts
try {
  todo.completed = completed;
  // TODO (chapter 6): save the toggle and move the todo between lists
} catch (e) {
  reportError(new Error('Could not update todo completion state', { cause: e }), { toast: true });
  todo.completed = wasCompleted;
}
```

The line above the comment is why the checkbox already works. `todo` is the
editable copy from chapter 5, so setting `completed` on it updates this todo's
checkbox and strike-through at once, and nothing else. If the save fails, the
`catch` sets it back.

Replace the comment with the `patchTodo` builder you wrote in chapter 5:

```ts
await this.store.request(patchTodo(todo, { completed }));
```

This time the copy has a local change. When the response arrives with the same
`completed` value, the copy's change is committed: the cache now holds that value,
and the copy has nothing left to save.

## Check it

Toggle a todo, then reload. It stays toggled, but the rest of the app doesn't keep
up:

- The footer still says "2 items left".
- Complete a todo on the Active page, and it stays on the Active page.

## Why the lists are stale

The cache stores each list as its own document: the list of todo keys that the
server returned for that request. The three lists on the page are three documents:

```
GET /api/todo                          [1, 2, 3]
GET /api/todo?filter[completed]=false  [2, 3]
GET /api/todo?filter[completed]=true   [1]
```

The `PATCH` response updated todo 2's `completed` field, and every list holding todo
2 shows the new value. But the cache doesn't know what the filter means, so it
can't tell that todo 2 no longer belongs in the active list, or that it now belongs
in the completed one. The footer counts the active list's todos, so its count
doesn't change either.

Chapter 4 solved a similar problem by invalidating the lists, so they're fetched
again. That works here too, at the cost of a `GET` for every list on the page. This
chapter takes the other approach: you know what changed, so you change the cached
lists yourself.

## Move the todo between lists

Add these functions to `app/data/builders/update.ts`:

```ts
/**
 * Moves a todo from the cached "active" list to the cached "completed" list.
 *
 * The cache patches a todo's *attributes* into every list that already holds
 * it, but it can't move a todo between lists: a list only tracks the records
 * it returned, not the ones it didn't. So when a todo's completion changes we
 * patch the two list documents ourselves instead of refetching them.
 */
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

/**
 * Where the server would put `todo` in `list`. The server orders todos by
 * creation, the order of the unfiltered list, so the todo goes after every
 * todo in `list` that comes before it there.
 */
function serverIndex(store: Store, list: RequestKey, todo: PersistedResourceKey): number {
  const order = cachedData(store, keyForRequest(store, getAllTodos()));
  const position = order.indexOf(todo);
  return cachedData(store, list).filter((key) => order.indexOf(key) < position).length;
}

function cachedData(store: Store, list: RequestKey): ResourceKey[] {
  const content = store.cache.peekRequest(list)?.content;
  return content && 'data' in content && Array.isArray(content.data) ? content.data : [];
}
```

And update the imports at the top of the file:

```ts
import type { PersistedResourceKey, RequestKey, ResourceKey } from '@warp-drive/core/types/identifier';

// ...

import type Store from '../store.ts';
import { getActiveTodos, getAllTodos, getCompletedTodos } from './query.ts';
import { keyForRequest, keyForSavedResource } from './utils.ts';
```

The functions call the list builders from chapter 3 to name the lists, but they
don't send those requests. `keyForRequest`, also in the shipped `utils.ts`, asks the
store for the cache key a request's response is stored under:

```ts
export function keyForRequest(store: Store, request: RequestInfo): RequestKey {
  const key = store.cacheKeyManager.getOrCreateDocumentIdentifier(request);
  if (!key) throw new Error('Expected a cacheable request');
  return key;
}
```

Then `moveBetweenLists` changes the two documents:

- `store.cache.peekRequest(key)` returns the cached document, if there is one. A
  list that was never requested has nothing to patch, and when it is requested,
  it's fetched with the todo in the right place.
- `store.cache.patch` changes the cache directly, as if the server had sent the
  change. `op: 'add'` inserts the todo's key into the list's `data`, and
  `op: 'remove'` takes it out.
- `index` says where in the list to insert it. `serverIndex` works out where the
  server would put the todo, so the cached list matches what a refetch would
  return.

Every `<Request>` rendering one of those lists re-renders, just as it does when a
response arrives.

## Put the todo where the server would

Patching the cache yourself means knowing the server's rules. Here that includes
its sort order: the server returns todos in the order they were created. A
filtered list is that order with some todos left out, so a todo's place in the
completed list is after every completed todo that was created before it.

The unfiltered list from `getAllTodos` holds that order. `serverIndex` reads it:

- `store.cache.peekRequest(key).content` is the cached JSON:API document. For a
  list, its `data` is an array of todo keys, in the server's order.
- The cache gives each record one key object, so `indexOf` finds a todo by its
  key.
- The todo's index in its new list is how many of that list's todos come before
  it in the unfiltered list.

The footer requests `getAllTodos` on every page, so the unfiltered list is cached
whenever you can toggle a todo. If it weren't, `cachedData` would return an empty
array and the todo would go to the top of its new list.

## Call it after the save

Back in `patchTodoToggle`, after the request, move the todo:

```ts
await this.store.request(patchTodo(todo, { completed }));

if (completed) {
  patchCacheTodoCompleted(this.store, todo);
} else {
  patchCacheTodoActivated(this.store, todo);
}
```

And import the two functions next to `patchTodo`:

```ts
import { patchCacheTodoActivated, patchCacheTodoCompleted, patchTodo } from '#app/data/builders/update.ts';
```

The lists change only after the `await`, so if the save fails, they're left alone.

## Check it again

Toggle a todo. The footer count updates, and "Clear completed" appears when the
first todo is completed. On the Active page, completing a todo removes it from the
list. On the Completed page, reactivating one removes it there, and on the Active
page it's back in its original place. In the Network panel, each toggle sends one
`PATCH` and nothing else.

## What's next

In chapter 7 you delete todos. The cache can remove a deleted todo from every list
by itself, because a deleted todo belongs in no list.
