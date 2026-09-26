---
title: 4. Create
description: Write a createTodo builder that POSTs a new todo, send it from the form, and let the store refetch every todo list.
---

# Create

Type a todo and press Enter. The input clears, but nothing is saved. Let's write
the request, and watch the lists update themselves.

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

The body is a JSON:API document without an `id`. The server assigns one. The
last two lines are the important part: when a `createRecord` request succeeds,
the store invalidates every request registered for the types in its
`cacheOptions.types`. Here that's all three lists from chapter 3.

## Send it

Open `app/components/todo-app/create-todo.gts` and replace the `TODO (chapter 4)`
comment:

```ts
await this.store.request(createTodo(attributes));
```

Import the builder:

```ts
import { createTodo } from '#app/data/builders/create.ts';
```

## Check it

Add a todo. It appears at the bottom, and the footer count goes up. Nothing in
the component touched the list. Here's what did:

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

Each `<Request>` keeps the old list on screen until the new one arrives. That's
one `POST` and a `GET` per list, and the server stays in charge of what each
list holds. Chapter 6 shows the other way: updating the cached lists yourself.

See [Mutations](../../the-manual/mutations/index.md) for more on saving data.

## What's next

You can create todos but not change them. Chapter 5 edits a title.
