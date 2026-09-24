---
title: 1. First request
description: Request the todos with store.request in the index route, then render the Future it returns with a <Request> block in the TodoMVC starter app.
---

# First request

The list is empty because nothing asks the API for todos. In this chapter you
request them in the index route, then render the response.

## Request the todos

Open `app/routes/index.ts`. The `model` hook returns an empty object with a
`TODO (chapter 1)` comment inside it. Replace the comment with a request:

```ts
model(): { todos?: Future<TodosDocument> } {
  return {
    todos: this.store.request<TodosDocument>({ url: '/api/todo' }),
  };
}
```

`store.request` returns a `Future` at once, without waiting for the response. The
route passes the `Future` to the page instead of awaiting it, so the page renders
straight away and shows a loading state until the todos arrive.

`TodosDocument` is the type of the response: a document whose `data` is an array of
todos. It's defined next to the todo schema, which chapter 2 covers.

## Render the response

The index template passes `@model.todos` to `TodoProvider` as `@todoFuture`. Open
`app/components/todo-app/todo-provider.gts`, find `TODO (chapter 1)`, and replace it
with a `<Request>` block:

```handlebars
<Request @request={{@todoFuture}} @autorefresh={{true}} @autorefreshBehavior="refresh">

  <:loading><LoadingSpinner /></:loading>

  <:content as |content|>
    <TodoListState @todos={{content.data}}>
      <:toggle as |list|>{{yield list to="toggle"}}</:toggle>
      <:list as |list|>{{yield list to="list"}}</:list>
    </TodoListState>
  </:content>

  <:error as |error|>{{this.appState.onUnrecoverableError error}}</:error>

</Request>
```

`<Request>` takes a `Future` and renders one of its blocks, depending on the
request's state:

| Block        | Renders when                  | Here                                                        |
| ------------ | ----------------------------- | ----------------------------------------------------------- |
| `<:loading>` | the request is in flight      | a spinner                                                   |
| `<:content>` | the request has succeeded     | the todo list, from `content.data`                          |
| `<:error>`   | the request has failed        | hands the error to the app, which shows an error screen     |

`@autorefresh={{true}}` makes the request run again when the browser comes back
online, and when the store marks the request as stale. Chapter 4 relies on the
second case. `@autorefreshBehavior="refresh"` refetches in the background, so the
current list stays on screen while it does.

## Check it

Reload the page. The three todos from the API render.

Nothing else works yet: new todos aren't saved, the checkboxes don't toggle, and
the footer is missing. The next chapters build each of those.

The Active and Completed pages don't work yet either. Their routes don't request
anything until chapter 3, so if you open `/active` or `/completed`, `<Request>` throws
because it has no request to render.

Before that, chapter 2 looks at why this request worked with so little code.
