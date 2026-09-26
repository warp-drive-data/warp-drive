---
title: 7. Delete
description: Write a deleteTodo builder with the deleteRecord op, send it from the destroy button and from an emptied title, and let the cache drop the todo from every list.
---

# Delete

A todo can be deleted two ways: with the × button that appears when you hover over
it, or by clearing its title while editing. Neither does anything yet. In this
chapter you write one request for both.

## Write the builder

Create `app/data/builders/delete.ts`:

```ts
import type { ReactiveDataDocument } from '@warp-drive/core/reactive';
import { withReactiveResponse } from '@warp-drive/core/request';
import type { RequestInfo } from '@warp-drive/core/types/request';
import { buildBaseURL } from '@warp-drive/utilities';

import type { Todo } from '../schemas/todo.ts';
import { keyForSavedResource } from './utils.ts';

/** DELETE /api/todo/:id */
export function deleteTodo(todo: Todo): RequestInfo<ReactiveDataDocument<Todo>> {
  const key = keyForSavedResource(todo);

  return withReactiveResponse<Todo>({
    method: 'DELETE',
    url: buildBaseURL({ op: 'deleteRecord', resourcePath: 'todo', identifier: key }),

    // The 'deleteRecord' op plus the todo's key tells the cache to remove it
    // from every cached list it appears in once the request succeeds.
    op: 'deleteRecord',
    records: [key],
  });
}
```

It has the same shape as chapter 5's `patchTodo`, with no body. `op: 'deleteRecord'`
with `records: [key]` tells the cache which record the request deletes. The API
answers with `204 No Content`, and when it does, the cache marks the todo as
deleted.

Lists don't show deleted records. So unlike chapter 6, there's no list to patch
by hand, and unlike chapter 4, nothing to refetch: the todo drops out of every
cached list, whichever filter produced it.

## Send it

Open `app/components/todo-app/todo-item.gts`. It has two `TODO (chapter 7)`
comments, both in a method called `deleteTodo`:

- In `DestroyForm`, the × button.
- In `TitleForm`, which calls `deleteTodo` when you submit an empty title.

Replace each comment with the same line:

```ts
await this.store.request(deleteTodo(todo));
```

Then import the builder at the top of the file:

```ts
import { deleteTodo } from '#app/data/builders/delete.ts';
```

Inside each component, `this.deleteTodo` is the component's method, and
`deleteTodo` is the builder you imported.

## Check it

Delete a todo with the × button. It disappears once the API confirms, not before:
the component waits for the request. If you delete an active todo, the footer count
goes down. Delete the last completed todo, and "Clear completed" disappears.

Double-click a todo, clear its title and press Enter. The todo is deleted.

In the Network panel, each deletion sends one `DELETE` and nothing else.

## What's next

Each todo can now be created, edited, toggled and deleted. Chapter 8 adds the two
controls that act on many todos at once: "Mark all as complete" and "Clear
completed".
