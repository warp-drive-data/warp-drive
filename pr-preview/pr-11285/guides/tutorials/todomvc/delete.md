---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11285/guides/tutorials/todomvc/delete.md
description: >-
  Write a deleteTodo builder with the deleteRecord op, send it from the × button
  and from an emptied title, and let the cache drop the todo from every list.
---

# Delete

A todo can be deleted with the × button that appears on hover, or by clearing
its title. Neither works yet. One request covers both.

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

Same shape as `patchTodo`, with no body. `op: 'deleteRecord'` with
`records: [key]` tells the cache which todo this deletes. When the API answers
`204`, the cache marks the todo deleted and every list drops it. No refetch, no
patching.

## Send it

Open `app/components/todo-app/todo-item.gts`. It has two `TODO (chapter 7)`
comments, in `DestroyForm` and `TitleForm`. Replace both with:

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
