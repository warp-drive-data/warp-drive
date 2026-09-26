---
title: 5. Edit title
description: Learn how checkout gives each todo an editable copy, write a patchTodo builder with the updateRecord op, and save a todo's new title.
---

# Edit title

Double-click a todo and its title turns into an input. Type a new title and press
Enter, and the old title comes back, because nothing saves it. In this chapter you
write the request that does.

## Editable copies

Chapter 2 noted that a todo's fields are read-only. The todo list works around
that before you write anything. Open `app/components/todo-app/todo-list.gts`:

```handlebars
{{#each @todos as |immutableTodo|}}
  <Await @promise={{this.checkout immutableTodo}}>
    <:success as |mutableTodoCopy|>
      <TodoItem @todo={{mutableTodoCopy}} ... />
    </:success>
  </Await>
{{/each}}
```

```ts
checkout(todo: Todo): Promise<EditableTodo> {
  return checkout<EditableTodo>(todo);
}
```

`checkout` returns an editable copy of a record. It's asynchronous, so the list
renders it with `<Await>`. Each `TodoItem` gets an `EditableTodo`, which chapter 2's
schema file typed with writable fields.

Changes to the copy stay on the copy. The cache, and every other view of the same
todo, keep showing what the server last sent until you save. Any field you haven't
changed on the copy shows the cache's value, so the copy stays up to date when the
cache does.

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

    // The 'updateRecord' op plus the todo's key tells the cache this request
    // saves the todo. On success the response is committed to it, and every
    // list holding it re-renders with the new attributes.
    op: 'updateRecord',
    records: [key],
  });
}
```

`keyForSavedResource` comes from `app/data/builders/utils.ts`, which the starter
ships:

```ts
export function keyForSavedResource(todo: Todo): PersistedResourceKey<'todo'> {
  const key = recordIdentifierFor(todo);
  if (key.id === null) throw new Error('Expected a saved todo');
  return key as PersistedResourceKey<'todo'>;
}
```

A record's key is how the cache identifies it: its `type`, its `id`, and an `lid`
the store assigns. `keyForSavedResource` returns it, and throws if the todo has no
`id` yet, because you can't `PATCH` a todo the server hasn't saved.

The rest of the builder:

- `buildBaseURL` appends the key's `id` to the resource path, so the URL is
  `/api/todo/2` for the todo with id `2`.
- `attributes` is `Partial`, so the body carries only the fields that changed. A
  JSON:API `PATCH` leaves the other fields alone.
- `op: 'updateRecord'` with `records: [key]` tells the cache which record the
  request saves. When it succeeds, the cache commits the response to the todo. If
  it fails, the todo keeps its old values.

## Send it

Open `app/components/todo-app/todo-item.gts` and find `TODO (chapter 5)`, in the
`patchTodoTitle` method of `TitleForm`. Replace the comment with the request:

```ts
await this.store.request(patchTodo(todo, { title }));
```

Import the builder at the top of the file:

```ts
import { patchTodo } from '#app/data/builders/update.ts';
```

The form's submit handler calls `patchTodoTitle` only when the trimmed title has
changed. When it's empty, the handler deletes the todo instead, which you write in
chapter 7.

## Check it

Double-click a todo, change its title and press Enter. The new title stays. Reload
the page, and it's still there, because the API saved it.

The Network panel shows the `PATCH` and no `GET`: nothing refetched the list. The
`PATCH` response updated the one cached todo. Every list holds that todo, not a
copy of it, so every list shows the new title, including the Active or Completed
page.

The copy in the `TodoItem` shows the new title for the same reason. `TitleForm`
read the title from the input and never set it on the copy, so the copy's title
comes from the cache.

## What's next

In chapter 6 you save a todo's completed state. It's another `patchTodo`, but it
changes which lists the todo belongs in, and the cache can't work that out by
itself.
