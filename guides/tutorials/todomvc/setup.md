---
title: 0. Setup
description: Create the TodoMVC starter app with npx @warp-drive/tutorials, run it with pnpm, and see which files ship finished and where you write WarpDrive code.
---

# Setup

## Get the starter

```sh
npx @warp-drive/tutorials@canary todomvc-ember
cd todomvc-ember
pnpm install
pnpm start
```

Open the URL Vite prints. You should see the TodoMVC header and the new todo input,
with an empty list below it. The list stays empty until you make your first request
in the next chapter.

## What's in the starter

```
todomvc-ember/
  api-worker/     the API; you don't need to read it
  app/
    components/   the TodoMVC UI, finished
    data/
      builders/   your request builders go here, next to a shipped utils.ts
      schemas/    the todo schema, finished
      store.ts    the store, finished
    routes/       one route per filter: all, active, completed
    templates/
  tests/
```

The Ember side of the app is done. You won't write routes, components or
templates. You write ***Warp*Drive** code in two kinds of places:

- New files in `app/data/`, starting with the request builders in chapter 3.
- Short additions to the shipped files, marked with a `TODO` comment that names the
  chapter:

  ```ts
  // TODO (chapter 1): request the todos from /api/todo
  ```

  To list the `TODO`s for a chapter:

  ```sh
  grep -rn "chapter 1" app
  ```

## The API

The app talks to a JSON:API server at `/api`. The server runs in the browser as a
[service worker](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API),
so there is no backend process to start. The app waits for the worker before it
boots, so the first request never reaches the network.

The API starts with three todos. It saves your changes in the browser, so they
survive a reload. To start over, clear the site data for the page in your browser's
developer tools.

The worker is not part of the tutorial. To your app it behaves like any other
JSON:API server.
