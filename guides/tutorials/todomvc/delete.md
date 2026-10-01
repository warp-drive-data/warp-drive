---
title: 7. Delete
description: Delete a todo with one request, and let the cache drop it from every list.
---

# Delete

A todo can be deleted with the × button that appears on hover, or by clearing
its title. Neither works yet. One request covers both.

## Write the builder

Create a new file, `app/data/builders/delete.ts`:

```ts
import { recordIdentifierFor } from '@warp-drive/core';
import type { ReactiveDataDocument } from '@warp-drive/core/reactive';
import { withReactiveResponse } from '@warp-drive/core/request';
import type { RequestInfo } from '@warp-drive/core/types/request';
import { buildBaseURL } from '@warp-drive/utilities';

import type { Todo } from '../schemas/todo.ts';

/** DELETE /api/todo/:id */
export function deleteTodo(todo: Todo): RequestInfo<ReactiveDataDocument<Todo>> {
  return withReactiveResponse<Todo>({
    method: 'DELETE',
    url: buildBaseURL({ op: 'deleteRecord', identifier: { type: 'todo', id: todo.id } }),

    // The 'deleteRecord' op plus the todo's key tells the cache to remove it
    // from every cached list it appears in once the request succeeds.
    op: 'deleteRecord',
    records: [recordIdentifierFor(todo)],
  });
}
```

Same shape as `patchTodo`, with no body. `op: 'deleteRecord'` with the todo's
key in `records` tells the cache which todo this deletes. When the API answers
`204`, the cache marks the todo deleted and every list drops it. No refetch, no
patching: the cache knows which lists hold each todo.

## Send it

In `app/components/todo-app/todo-item.gts`, two components delete a todo:
`DestroyForm`, behind the × button, and `TitleForm`, when the title is cleared.
Each has a `deleteTodo` method that doesn't send anything yet. Have both send
the request:

```ts
await this.store.request(deleteTodo(todo));
```

Import the builder:

```ts
import { deleteTodo } from '#app/data/builders/delete.ts';
```

::: tip
Inside each component, `this.deleteTodo` is the component's method and
`deleteTodo` is the builder.
:::

## Check it

Hover a todo and click ×. It disappears once the API confirms, and the footer
count drops. Double-click another, clear its title, press Enter. Gone too. One
`DELETE` each.

## What's next

Every single-todo operation works. Chapter 8 handles many at once. It's
optional, so you can also skip to [Where next](./bulk-operations.md#where-next).
