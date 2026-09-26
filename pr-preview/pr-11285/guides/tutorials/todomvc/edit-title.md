---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11285/guides/tutorials/todomvc/edit-title.md
description: >-
  See how checkout gives each todo an editable copy, then write a patchTodo
  builder with the updateRecord op and save a new title.
---

# Edit title

Double-click a todo, type a new title, press Enter. The old title comes back.
Let's save it.

## Editable copies

Chapter 2 said a todo's fields are read-only. The list gets around that before
you write anything. In `app/components/todo-app/todo-list.gts`, each todo passes
through `checkout`:

```handlebars
{{#each @todos as |immutableTodo|}}
  <Await @promise={{this.checkout immutableTodo}}>
    <:success as |mutableTodoCopy|>
      <TodoItem @todo={{mutableTodoCopy}} ... />
    </:success>
  </Await>
{{/each}}
```

`checkout` returns an editable copy of a record. Changes stay on the copy until
you save. The cache, and every other view of the todo, keep showing what the
server last sent.

## Write the builder

Create `app/data/builders/update.ts`:

```ts
import type { ReactiveDataDocument } from '@warp-drive/core/reactive';
import { withReactiveResponse } from '@warp-drive/core/request';
import type { RequestInfo } from '@warp-drive/core/types/request';
import { buildBaseURL } from '@warp-drive/utilities';

import type { Todo, TodoAttributes } from '../schemas/todo.ts';
import { keyForSavedResource } from './utils.ts';

/** PATCH /api/todo/:id */
export function patchTodo(todo: Todo, attributes: Partial<TodoAttributes>): RequestInfo<ReactiveDataDocument<Todo>> {
  const key = keyForSavedResource(todo);

  return withReactiveResponse<Todo>({
    method: 'PATCH',
    url: buildBaseURL({ op: 'updateRecord', resourcePath: 'todo', identifier: key }),
    body: JSON.stringify({ data: { type: 'todo', id: key.id, attributes } }),

    // 'updateRecord' plus the todo's key: on success the cache commits the
    // response to this todo, and every list holding it re-renders.
    op: 'updateRecord',
    records: [key],
  });
}
```

`keyForSavedResource`, shipped in `utils.ts`, returns the todo's cache key: its
`type` and `id`. `op: 'updateRecord'` with `records: [key]` tells the cache
which todo this request saves, so the response is written into that todo.
`attributes` is `Partial`, so the body carries only what changed.

## Send it

Open `app/components/todo-app/todo-item.gts` and find `TODO (chapter 5)` in
`TitleForm`. Replace it:

```ts
await this.store.request(patchTodo(todo, { title }));
```

Import the builder:

```ts
import { patchTodo } from '#app/data/builders/update.ts';
```

## Check it

Double-click a todo, change its title, press Enter. It sticks, and it's still
there after a reload.

The Network panel shows one `PATCH` and no `GET`. The response updated the one
cached todo, and every list holds that same todo, so every list shows the new
title.

## What's next

Chapter 6 saves a todo's completed state. It's the same `patchTodo`, but this
time the todo has to change lists, and the cache can't work that out on its own.
