---
title: 3. Request builders
description: Write request builders for the all, active and completed todo lists, use them in the routes and the footer, then move the JSON:API headers into a handler.
---

# Request builders

Chapter 1's request is an object literal in the index route. The Active and
Completed routes need their own lists, and so does the footer, which counts the
active todos and hides "Clear completed" when nothing is completed. Rather than
write those requests by hand in five places, you write them once as builders.

A builder is a function that returns a request. It doesn't send anything. You pass
what it returns to `store.request`, or to `<Request>`, which sends it for you.

## Write the builders

Create `app/data/builders/query.ts`:

```ts
import { withReactiveResponse } from '@warp-drive/core/request';
import type { RequestInfo } from '@warp-drive/core/types/request';
import { buildBaseURL, buildQueryParams } from '@warp-drive/utilities';

import type { Todo, TodosDocument } from '../schemas/todo.ts';

function queryTodos(filter?: { completed: boolean }): RequestInfo<TodosDocument> {
  const url = buildBaseURL({ resourcePath: 'todo' });
  const query = filter ? `?${buildQueryParams({ 'filter[completed]': filter.completed })}` : '';

  return withReactiveResponse<Todo[]>({
    method: 'GET',
    url: `${url}${query}`,
    headers: new Headers({ Accept: 'application/vnd.api+json' }),

    // 'query' requests for the 'todo' type are invalidated whenever a todo is
    // created, so every list refetches and picks up the new todo.
    op: 'query',
    cacheOptions: { types: ['todo'] },
  });
}

/** GET /api/todo */
export function getAllTodos(): RequestInfo<TodosDocument> {
  return queryTodos();
}

/** GET /api/todo?filter[completed]=false */
export function getActiveTodos(): RequestInfo<TodosDocument> {
  return queryTodos({ completed: false });
}

/** GET /api/todo?filter[completed]=true */
export function getCompletedTodos(): RequestInfo<TodosDocument> {
  return queryTodos({ completed: true });
}
```

The three exported builders share one private function, `queryTodos`. Going through
it line by line:

- `buildBaseURL` joins the API's host and namespace with the resource path. The
  host and namespace are set once, in `app/app.ts`:

  ```ts
  setBuildURLConfig({ host: '/', namespace: 'api' });
  ```

  So `buildBaseURL({ resourcePath: 'todo' })` returns `/api/todo`.
- `buildQueryParams` turns an object into a query string. It sorts the parameters,
  so the same filter always produces the same URL, and so the same cache entry.
- `withReactiveResponse<Todo[]>` changes nothing at runtime. It records the
  response type on the request, so `store.request` knows it returns a list of
  todos. Chapter 1 had to write `store.request<TodosDocument>` to say that.
- `headers` sends the JSON:API `Accept` header. Chapter 2 noted that most JSON:API
  servers require it. You move it somewhere better at the end of this chapter.
- `op: 'query'` says the request reads a list.
- `cacheOptions: { types: ['todo'] }` tells the cache that this list holds todos.
  When a request for a new todo succeeds, the store invalidates every request
  registered for the `todo` type. Chapter 4 depends on that.

See [Builders](../../the-manual/requests/builders.md) for more on writing them.

## Use them in the routes

Open `app/routes/index.ts` and replace chapter 1's request with `getAllTodos`:

```ts
import { getAllTodos } from '#app/data/builders/query.ts';

// ...

model(): { todos?: Future<TodosDocument> } {
  return {
    todos: this.store.request(getAllTodos()),
  };
}
```

`store.request` no longer needs a type argument. It reads the type from the builder.

Do the same at the `TODO (chapter 3)` comments in `app/routes/active.ts` and
`app/routes/completed.ts`, using `getActiveTodos` and `getCompletedTodos`:

```ts
todos: this.store.request(getActiveTodos()),
```

```ts
todos: this.store.request(getCompletedTodos()),
```

## Use them in the footer

The footer has three `TODO (chapter 3)` comments. Each one needs a list, and each
passes a builder to `<Request>` as `@query` rather than `@request`. With
`@request` you pass a `Future` you've already started. With `@query` you pass the
request itself, and `<Request>` calls `store.request` for you.

In `app/components/todo-app/footer.gts`, show the footer only when there are
todos:

```handlebars
<Request @query={{(getAllTodos)}} @autorefresh={{true}} @autorefreshBehavior="refresh">

  <:content as |content|>
    {{#if content.data.length}}
      <footer class="footer">
        {{yield}}
      </footer>
    {{/if}}
  </:content>

  <:error as |error|>
    <HandleError @error={{error}} />
  </:error>

</Request>
```

`(getAllTodos)` calls the builder from the template. A template can call any plain
function this way.

In `app/components/todo-app/todo-count.gts`, count the active todos:

```handlebars
<Request @query={{(getActiveTodos)}} @autorefresh={{true}} @autorefreshBehavior="refresh">
  <:content as |content|>
    <Remaining @remaining={{content.data.length}} />
  </:content>
  <:error as |error|>
    <HandleError @error={{error}} @toast="Could not get active todos for Todo Remaining Count." />
  </:error>
</Request>
```

In `app/components/todo-app/clear-completed-todos.gts`, pass the completed todos to
the button, which renders only when there are some:

```handlebars
<Request @query={{(getCompletedTodos)}} @autorefresh={{true}} @autorefreshBehavior="refresh">
  <:content as |content|>
    <ClearCompleted @completed={{content.data}} />
  </:content>
  <:error as |error|>
    <HandleError @error={{error}} @toast="Could not get completed todos for 'Clear Completed'." />
  </:error>
</Request>
```

Import each builder at the top of its file:

```ts
import { getAllTodos } from '#app/data/builders/query.ts';
```

On the All page, the footer's `getAllTodos` request is the same request as the
route's. The store doesn't fetch it twice: the footer gets the route's response.

## Check it

Reload the page. The footer shows "2 items left" and a "Clear completed" button,
because one of the three todos from the API is completed. The Active and Completed
links now show their lists.

## Move the headers into a handler

Every builder you write from now on needs the JSON:API headers. The `POST` and
`PATCH` requests in the next chapters also send a body, so they need
`Content-Type` too. Rather than repeat both headers in every builder, you add them
in one place: a handler.

Chapter 2 showed where handlers sit: after the cache, before the network. Every
request that isn't answered from the cache passes through them.

Create `app/data/handlers/json-api.ts`:

```ts
import type { Future, Handler, NextFn } from '@warp-drive/core/request';
import type { RequestContext } from '@warp-drive/core/types/request';

const JSON_API = 'application/vnd.api+json';

/** Adds the JSON:API content negotiation headers to every request. */
export const JsonApiHandler: Handler = {
  request<T>(context: RequestContext, next: NextFn<T>): Future<T> {
    const headers = new Headers(context.request.headers);
    headers.set('Accept', JSON_API);
    headers.set('Content-Type', JSON_API);
    return next(Object.assign({}, context.request, { headers }));
  },
};
```

A handler receives the request as `context.request`, and passes it on by calling
`next`. The request is read-only, so the handler copies its headers, sets the
two JSON:API headers, and calls `next` with a copy of the request that uses them.

Register the handler in `app/data/store.ts`, at the `TODO (chapter 3)` comment:

```ts
import { JsonApiHandler } from './handlers/json-api.ts';

// ...

handlers: [JsonApiHandler],
```

Then delete the `headers` line from `queryTodos` in
`app/data/builders/query.ts`. The builders now describe only what to fetch, and
the handler decides how it's sent.

The pipeline from chapter 2 now has a handler in it:

```
store.request(getAllTodos())
  │
  ▼
CacheHandler ──── fresh response cached for this request? ──► return it
  │ no
  ▼
JsonApiHandler    adds Accept and Content-Type
  │
  ▼
Fetch ──────────► GET /api/todo ──► API worker
```

Reload the page. It looks the same. In your browser's developer tools, the
requests to `/api/todo` in the Network panel now carry both headers.

See [Handlers](../../the-manual/requests/handlers.md) for what else a handler can
do.

## What's next

Every list in the app now loads through a builder. Nothing writes to the API yet.
In chapter 4 you create todos, and the lists update without being told to.
