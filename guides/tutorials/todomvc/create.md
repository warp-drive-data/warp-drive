---
title: 4. Create
description: Write a createTodo builder that POSTs a new todo, send it from the new todo form, and let the store invalidate and refetch every todo list.
---

# Create

Typing a todo and pressing Enter clears the input, but the todo isn't saved. In
this chapter you write the request that saves it, and the lists update themselves.

## Write the builder

Create `app/data/builders/create.ts`:

```ts
import type { ReactiveDataDocument } from '@warp-drive/core/reactive';
import { withReactiveResponse } from '@warp-drive/core/request';
import type { RequestInfo } from '@warp-drive/core/types/request';
import { buildBaseURL } from '@warp-drive/utilities';

import type { Todo, TodoAttributes } from '../schemas/todo.ts';

/** POST /api/todo */
export function createTodo(attributes: TodoAttributes): RequestInfo<ReactiveDataDocument<Todo>> {
  return withReactiveResponse<Todo>({
    method: 'POST',
    url: buildBaseURL({ resourcePath: 'todo' }),
    body: JSON.stringify({ data: { type: 'todo', attributes } }),

    // Invalidates every cached 'todo' query, so lists refetch with the new todo.
    op: 'createRecord',
    cacheOptions: { types: ['todo'] },
  });
}
```

- The `body` is a JSON:API document with a `type` and `attributes` but no `id`.
  The server assigns the id and returns the saved todo.
- `withReactiveResponse<Todo>` types the response as a single todo, not a list.
- The request has no headers. The handler from chapter 3 adds `Accept` and
  `Content-Type`, and this is the first request that needs `Content-Type`,
  because it's the first with a body.
- `op: 'createRecord'` tells the store this request creates a record.

The last line is what makes the lists update. In chapter 3, each list request
registered itself for the `todo` type with `cacheOptions: { types: ['todo'] }`.
When a `createRecord` request succeeds, the store invalidates every request
registered for the types in its own `cacheOptions.types`. Here that's `todo`, so
every todo list is invalidated.

## Send it

Open `app/components/todo-app/create-todo.gts`. The form's submit handler reads the
trimmed title into `attributes`, then reaches a `TODO (chapter 4)` comment. Replace
the comment with the request:

```ts
await this.store.request(createTodo(attributes));
```

And import the builder:

```ts
import { createTodo } from '#app/data/builders/create.ts';
```

The component awaits the request so it clears the form only when the save
succeeds. If the request fails, the `catch` below it reports the error and leaves
the title in the input.

## Check it

Add a todo. It appears at the bottom of the list, and the count in the footer goes
up by one.

Nothing in the component updates the list. This is what happens:

```
store.request(createTodo(...))
  │
  ▼
POST /api/todo ──► 201, the saved todo
  │
  ▼
the cache stores the new todo
  │
  ▼
the store invalidates every request registered for 'todo':
  GET /api/todo                          the list
  GET /api/todo?filter[completed]=false  the footer count
  GET /api/todo?filter[completed]=true   "Clear completed"
  │
  ▼
each <Request @autorefresh={{true}}> sees its request invalidated
and fetches it again
```

That's the second case chapter 1 mentioned: `@autorefresh` fetches a request again
when the store marks it as stale. `@autorefreshBehavior="refresh"` keeps the
current list on screen while the new one loads.

While the browser tab is hidden, `<Request>` doesn't refetch. It remembers that
its request is stale and fetches it when you switch back to the tab.

In the Network panel, one todo sends four requests: the `POST`, then a `GET` for
each list on the page. The new todo is in the `POST`'s response, and comes back
again in the list's `GET`. That costs requests, but the server decides what each
list contains and in what order, so the lists can't drift from it.

Chapter 1's inline request didn't set `cacheOptions.types`. Without the builders
from chapter 3, nothing would have been registered for `todo`, and the list
wouldn't have updated until you reloaded the page.

Chapter 6 shows the other approach: changing the cached lists yourself instead of
fetching them again.

See [Mutations](../../the-manual/mutations/index.md) for more on saving data.

## What's next

You can create todos, but not change them. In chapter 5 you edit a todo's title.
