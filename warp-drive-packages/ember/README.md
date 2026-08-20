<p align="center">
  <img
    class="project-logo"
    src="./logos/logo-yellow-slab.svg"
    alt="WarpDrive"
    width="180px"
    title="WarpDrive"
    />
</p>

![NPM Stable Version](https://img.shields.io/npm/v/ember-data/latest?label=version&style=flat&color=fdb155)
![NPM Downloads](https://img.shields.io/npm/dm/ember-data.svg?style=flat&color=fdb155)
![License](https://img.shields.io/github/license/warp-drive-data/warp-drive.svg?style=flat&color=fdb155)
[![EmberJS Discord Community Server](https://img.shields.io/badge/EmberJS-grey?logo=discord&logoColor=fdb155)](https://discord.gg/zT3asNS
)
[![WarpDrive Discord Server](https://img.shields.io/badge/WarpDrive-grey?logo=discord&logoColor=fdb155)](https://discord.gg/PHBbnWJx5S
)

<h3 align="center">Signals Integration and Component API for using <em>Warp</em><strong>Drive</strong> with 🐹 <em style="color: orange">Ember.js</em></h3>

***Warp*Drive** makes it easy to build scalable, fast, feature
rich applications &mdash; letting you ship better experiences more quickly without re-architecting your app or API. ***Warp*Drive** is:

- 🌌 Seamless Reactivity in any Framework
- ⚡️ Committed to Best-In-Class Performance
- 💚 Typed
- ⚛️ Works with any API
- 🌲 Focused on being as tiny as possible
- 🚀 SSR Ready
- 🐹 Built with ♥️ by [Ember](https://emberjs.com)

<br>
<br>

*Get Started* → [Guides](https://warp-drive.io/guides/)

<br>

---

<br>

# @warp-drive/ember


**Tagged Releases**

- ![NPM Canary Version](https://img.shields.io/npm/v/%40warp-drive%2Fember/canary?label=@canary&color=FFBF00)
- ![NPM Beta Version](https://img.shields.io/npm/v/%40warp-drive%2Fember/bet?label=@beta&color=ff00ff)
- ![NPM Stable Version](https://img.shields.io/npm/v/%40warp-drive%2Fember/latest?label=@latest&color=90EE90)
- ![NPM LTS Version](https://img.shields.io/npm/v/%40warp-drive%2Fember/lts?label=@lts&color=0096FF)
- ![NPM LTS-4-12 Version](https://img.shields.io/npm/v/%40warp-drive%2Fember/lts-4-12?label=@lts-4-12&color=bbbbbb)

## About

This library provides reactive utilities for working with promises and requests, building over these primitives to provide functions and components that enable you to build robust performant apps with elegant control flow

Documentation

- [PromiseState](#promisestate)
  - [getPromiseState](#getpromisestate)
  - [\<Await />](#await-)
- [RequestState](#requeststate)
  - [getRequestState](#getrequeststate)
  - [\<Request />](#request-)
- [PaginationState](#paginationstate)
  - [getPaginationState](#getpaginationstate)
  - [\<Paginate />](#paginate-)
- [Using with `.hbs`](#using-hbs)

---

## Why?

### DX

Crafting a performant application experience is a creative art.

The data loading patterns that make for good DX are often at odds with the patterns that reduce fetch-waterfalls and loading times.

Fetching data from components *feels* right to most of us as developers. Being able to see
what we've queried right from the spot in which we will consume and use the response of the
query keeps the mental model clear and helps us iterate quickly.

But it also means that we have to render in order to know what to fetch, in order to know what to render, in order to know what to fetch and so on until the cycle eventually completes.

Thus, while on the surface providing superior DX, component based data-fetching patterns
sacrifice the  user's experience for the developer's by encouraging a difficult-to-impossible
to optimize loading architecture.

It can also be tricky to pull off elegantly. Async/Await? Proxies? Resources? Generators?
Each has its own pitfalls when it comes to asynchronous data patterns in components and
crafting an experience that works well for both JavaScript and Templates is tough. And what
about work lifetimes?

This library helps you to craft great experiences without sacrificing DX. We still believe
you should load data based on user interactions and route navigations, not from components,
but what if you didn't need to use prop-drilling or contexts to access the result of a
route based query?

WarpDrive's RequestManager already allows for fulfillment from cache and for request
de-duping, so what if we could just pick up where we left off and use the result of a
request right away if it already was fetched elsewhere?

That brings us to our second motivation: performance.

### Performance

Performance is always at the heart of WarpDrive libraries.

`@warp-drive/ember` isn't just a library of utilities for working with reactive
asynchronous data in your Ember app. It's *also* a way to optimize your app for
faster, more correct renders.

It starts with `setPromiseResult` a simple core primitive provided by the library
`@ember-data/request` that allows the result of any promise to be safely cached
without leaking memory. Results stashed with `setPromiseResult` can then be retrieved
via `getPromiseResult`. As long as the promise is in memory, the result will be too.

Every request made with `@ember-data/request` stashes its result in this way, and
the requests resolved from cache by the CacheHandler have their entry populated
syncronously. Consider the following code:

```ts
const A = store.request({ url: '/users/1' });
const result = await A;
result.content.data.id; // '1'
const B = store.request({ url: '/user/1' });
```

The above scenario is relatively common when a route, provider or previous location
in an app has loaded request A, and later something else triggers request B.

While it is true that `A !== B`, the magic of the RequestManager is that it is able
to safely stash the result of B such that the following works:

```ts
const B = store.request({ url: '/user/1' });
const state = getPromiseResult(B);
state.result.content.data.id; // '1' 🤯
```

Note how we can access the result of B even before we've awaited it? This is useful
for component rendering where we want to fetch data asynchronously, but when it is
immediately available the best possible result is to continue to render with the available
data without delay.

These primitives (`getPromiseResult` and `setPromiseResult`) are useful, but not all
that ergonomic on their own. They are also intentionally not reactive because they
are intended for use with *any* framework.

That's where `@warp-drive/ember` comes in. This library provides reactive utilities
for working with promises, building over these primitives to provide helpers, functions
 and components that enable you to build robust performant app with elegant control flows.

---

## Documentation

### PromiseState

PromiseState provides a reactive wrapper for a promise which allows you write declarative
code around a promise's control flow. It is useful in both Template and JavaScript contexts,
allowing you to quickly derive behaviors and data from pending, error and success states.

```ts
interface PromiseState<T = unknown, E = unknown> {
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  result: T | null;
  error: E | null;
}
```

To get the state of a promise, use `getPromiseState`.

### getPromiseState

`getPromiseState` can be used in both JavaScript and Template contexts.

```ts
import { getPromiseState } from '@warp-drive/ember';

const state = getPromiseState(promise);
```

For instance, we could write a getter on a component that updates whenever
the promise state advances or the promise changes, by combining the function
with the use of `@cached`

```ts
class Component {
  @cached
  get title() {
    const state = getPromiseState(this.args.request);
    if (state.isPending) {
      return 'loading...';
    }
    if (state.isError) { return null; }
    return state.result.title;
  }
}
```

Or in a template as a helper:

```gjs
import { getPromiseState } from '@warp-drive/ember';

<template>
  {{#let (getPromiseState @request) as |state|}}
    {{#if state.isPending}} <Spinner />
    {{else if state.isError}} <ErrorForm @error={{state.error}} />
    {{else}}
      <h1>{{state.result.title}}</h1>
    {{/if}}
  {{/let}}
</template>
```

#### \<Await />

Alternatively, use the `<Await>` component

```gjs
import { Await } from '@warp-drive/ember';

<template>
  <Await @promise={{@request}}>
    <:pending>
      <Spinner />
    </:pending>

    <:error as |error|>
      <ErrorForm @error={{error}} />
    </:error>

    <:success as |result|>
      <h1>{{result.title}}</h1>
    </:success>
  </Await>
</template>
```

When using the Await component, if no error block is provided and the promise rejects,
the error will be thrown.

### RequestState

RequestState extends PromiseState to provide a reactive wrapper for a request `Future` which
allows you write declarative code around a Future's control flow. It is useful in both Template
and JavaScript contexts, allowing you to quickly derive behaviors and data from pending, error
and success states.

The key difference between a Promise and a Future is that Futures provide access to a stream
of their content, as well as the ability to attempt to abort the request.

```ts
interface Future<T> extends Promise<T>> {
  getStream(): Promise<ReadableStream>;
  abort(): void;
}
```

These additional APIs allow us to craft even richer state experiences.


```ts
interface RequestState<T = unknown, E = unknown> extends PromiseState<T, E> {
  isCancelled: boolean;

  // TODO detail out percentage props
}
```

To get the state of a request, use `getRequestState`.

### getRequestState

`getRequestState` can be used in both JavaScript and Template contexts.

```ts
import { getRequestState } from '@warp-drive/ember';

const state = getRequestState(future);
```

For instance, we could write a getter on a component that updates whenever
the request state advances or the future changes, by combining the function
with the use of `@cached`

```ts
class Component {
  @cached
  get title() {
    const state = getRequestState(this.args.request);
    if (state.isPending) {
      return 'loading...';
    }
    if (state.isError) { return null; }
    return state.result.title;
  }
}
```

Or in a template as a helper:

```gjs
import { getRequestState } from '@warp-drive/ember';

<template>
  {{#let (getRequestState @request) as |state|}}
    {{#if state.isPending}} <Spinner />
    {{else if state.isError}} <ErrorForm @error={{state.error}} />
    {{else}}
      <h1>{{state.result.title}}</h1>
    {{/if}}
  {{/let}}
</template>
```

### \<Request />

To make working with requests in templates even easier, you can use
the `<Request>` component.

The `<Request />` component is *layout-less*. It is pure declarative control
flow with built-in state management utilities, and is designed to seamlessly
integrate with preferred patterns for loading data for routes and modals.

`<Request />` taps into additional capabilities *beyond*
what `RequestState` offers.

### Completion states and an abort function are available as part of loading state

```gjs
import { Request } from '@warp-drive/ember';

<template>
  <Request @request={{@request}}>
    <:loading as |state|>
      <Spinner @percentDone={{state.completedRatio}} />
      <button {{on "click" state.abort}}>Cancel</button>
    </:loading>

    <:error as |error|>
      <ErrorForm @error={{error}} />
    </:error>

    <:content as |result|>
      <h1>{{result.title}}</h1>
    </:content>
  </Request>
</template>
```

When using the Await component, if no error block is provided and the request rejects,
the error will be thrown. Cancellation errors are not rethrown if no error block or
cancellation block is present.

### Streaming Data

The loading state exposes the download `ReadableStream` instance for consumption

```gjs
import { Request } from '@warp-drive/ember';

<template>
  <Request @request={{@request}}>
    <:loading as |state|>
      <Video @stream={{state.stream}} />
    </:loading>

    <:error as |error|>
      <ErrorForm @error={{error}} />
    </:error>
  </Request>
</template>
```

### Cancelled is an additional state.

```gjs
import { Request } from '@warp-drive/ember';

<template>
  <Request @request={{@request}}>
    <:cancelled>
      <h2>The Request Cancelled</h2>
    </:cancelled>

    <:error as |error|>
      <ErrorForm @error={{error}} />
    </:error>

    <:content as |result|>
      <h1>{{result.title}}</h1>
    </:content>
  </Request>
</template>
```

If a request is aborted but no cancelled block is present, the error will be given
to the error block to handle.

If no error block is present, the cancellation error will be swallowed.

### Idle is an additional state.

The `<:idle>` state occurs when the request or query passed to the component
is `undefined` or `null`.

```gjs
import { Request } from '@warp-drive/ember';

<template>
  <Request @request={{@request}}>
    <:idle><button {{on "click" @makeRequest}}>Load Preview?</button></:idle>
  </Request>
</template>
```

`<:idle>` states allows us to avoid wrapping `<Request />` components in `{{#if}}` blocks
when the request isn't ready to be made. E.g. No need do to this:

```gjs
import { Request } from '@warp-drive/ember';

<template>
  {{#if @request}}
    <Request @request={{@request}}>

    </Request>
  {{else}}
    <button {{on "click" @makeRequest}}>Load Preview?</button>
  {{/if}}
</template>
```

> [!IMPORTANT]
> `null` and `undefined` are only valid arguments to `<Request />` if an `<:idle>` block is provided.
An important note is that `<:idle>` is effectively a special-cased error state. If no idle block is
provided, the component *will* throw an error if the argument is `null` or `undefined`.

### Retry

Cancelled and error'd requests may be retried,
retry will reuse the error, cancelled and loading
blocks as appropriate.

```gjs
import { Request } from '@warp-drive/ember';
import { on } from '@ember/modifier';

<template>
  <Request @request={{@request}}>
    <:cancelled as |error state|>
      <h2>The Request Cancelled</h2>
      <button {{on "click" state.retry}}>Retry</button>
    </:cancelled>

    <:error as |error state|>
      <ErrorForm @error={{error}} />
      <button {{on "click" state.retry}}>Retry</button>
    </:error>

    <:content as |result|>
      <h1>{{result.title}}</h1>
    </:content>
  </Request>
</template>
```

### Reloading states

Reload will reset the request state, and so reuse the error, cancelled, and loading
blocks as appropriate.

Background reload (refresh) is a special substate of `content` that can be entered while
existing content is still shown.

Both reload and background reload are available as methods that can be invoked from
within `content`. Background reload's can also be aborted.

```gjs
import { Request } from '@warp-drive/ember';

<template>
  <Request @request={{@request}}>
    <:cancelled>
      <h2>The Request Cancelled</h2>
    </:cancelled>

    <:error as |error|>
      <ErrorForm @error={{error}} />
    </:error>

    <:content as |result state|>
      {{#if state.isBackgroundReloading}}
        <SmallSpinner />
        <button {{on "click" state.abort}}>Cancel</button>
      {{/if}}

      <h1>{{result.title}}</h1>

      <button {{on "click" state.refresh}}>Refresh</button>
      <button {{on "click" state.reload}}>Reload</button>
    </:content>
  </Request>
</template>
```

Usage of request can be nested for more advanced handling of background reload

```gjs
import { Request } from '@warp-drive/ember';

<template>
  <Request @request={{@request}}>
    <:cancelled>
      <h2>The Request Cancelled</h2>
    </:cancelled>

    <:error as |error|>
      <ErrorForm @error={{error}} />
    </:error>

    <:content as |result state|>
      <Request @request={{state.latestRequest}}>
        <!-- Handle Background Request -->
      </Request>

      <h1>{{result.title}}</h1>

      <button {{on "click" state.refresh}}>Refresh</button>
    </:content>
  </Request>
</template>
```

### Autorefresh behavior

Requests can be made to automatically refresh under any combination of three separate conditions
by supplying a value to the `@autorefresh` arg.

- `online` when a browser window or tab comes back to the foreground after being backgrounded
or when the network reports as being online after having been offline.
- `interval` which occurs whenever `@autorefreshThreshold` has been exceeded
- `invalid` which occurs when the store associated to the request emits an invalidation notification for the request in use.

These conditions can be used in any combination by providing a comma separated list e.g.
`interval,invalid`

A value of `true` is equivalent to `online,invalid`.

```gjs
import { Request } from '@warp-drive/ember';

<template>
  <Request @request={{@request}} @autorefresh={{true}}>
    <!-- ... -->
  </Request>
</template>
```

By default, an autorefresh will only occur if the browser was backgrounded or offline for more than
30s before coming back available. This amount of time can be tweaked by setting the number of milliseconds
via `@autorefreshThreshold`.

The behavior of the fetch initiated by the autorefresh can also be adjusted by `@autorefreshBehavior`

Options are:

- `refresh` update while continuing to show the current state.
- `reload` update and show the loading state until update completes)
- `policy` (**default**) trigger the request, but let the cache handler decide whether the update should occur or if the cache is still valid.

---

Similarly, refresh could be set up on a timer or on a websocket subscription by using the yielded
refresh function and passing it to another component.

```gjs
import { Request } from '@warp-drive/ember';

<template>
  <Request @request={{@request}}>
    <:content as |result state|>
      <h1>{{result.title}}</h1>

      <Interval @period={{30_000}} @fn={{state.refresh}} />
      <Subscribe @channel={{@someValue}} @fn={{state.refresh}} />
    </:content>
  </Request>
</template>
```

If a matching request is refreshed or reloaded by any other component, the `Request` component will react accordingly.

### PaginationState

PaginationState provides a reactive wrapper for a paginated collection, keyed to the
request that loaded its first page. It is the `pages` object yielded by the
`<Paginate />` component, and is equally usable directly in JavaScript.

The pages themselves are kept in a cache shared by every PaginationState for the same
collection, so multiple components paginating the same collection share loaded pages
while keeping their own local navigation state (active page, loaded range).

It exposes two navigation surfaces over the same collection. When using the
`<Paginate />` component, the `@mode` arg picks one (`'paged'` is the default) and
the component yields only that surface, so mixing the two APIs is a type error.

- **Paged** (`@mode="paged"`, single page at a time): render
  `activePage`/`activePageRequest`, navigate with `loadPage` or the links yielded
  by `<EachLink />`.

```ts
interface PagedPaginationState<RT = unknown, E = unknown> {
  activePage: PageCache<RT, E> | null;
  activePageRequest: Future<RT> | null;
  totalPages: number;
  loadPage: (url: string) => Promise<RT | null>;
}
```

- **Infinite** (`@mode="infinite"`, accumulated set): render `data`, grow it with
  `loadNext`/`loadPrev`, and derive loading states from `nextRequest`/`previousRequest`.
  `pages` is the same run as `data` but yields the `PageCache` objects, for UIs that
  need per-page boundaries or request states.

```ts
interface InfinitePaginationState<RT = unknown, E = unknown> {
  data: Iterable<ContentItem<RT>>;
  pages: Iterable<PageCache<RT, E>>;
  hasNext: boolean;
  hasPrevious: boolean;
  nextRequest: Future<RT> | null;
  previousRequest: Future<RT> | null;
  totalPages: number;
  loadNext: () => Promise<RT | null>;
  loadPrev: () => Promise<RT | null>;
}
```

### getPaginationState

`getPaginationState` returns the PaginationState for a request. Repeated calls with the
same request return the same instance — keyed by request identity, just like
`getRequestState` — so JavaScript and templates observing the same request share state.

The returned state carries both surfaces — the mode narrowing is a type-level feature
of the `<Paginate />` component, so programmatic consumers may use whichever fits.

```ts
import { getPaginationState } from '@warp-drive/ember';

const request = store.request({ url: '/users', method: 'GET' });
const pages = getPaginationState(request);

await request;
await pages.loadNext();

for (const user of pages.data) {
  // first two pages
}
```

An optional second argument accepts a `PageHints` function for APIs that do not expose
`currentPage`/`totalPages` in the default `meta` locations (see the Total Pages Hints
example below).

#### <Paginate />

The `<Paginate />` component is *layout-less*. Just like `<Request />`, it is pure
declarative control flow with built-in state management utilities.

`<Paginate />` works *because* it understands pagination links.

> [!Tip]
> Pagination links are a feature of WarpDrive/EmberData response documents. If your API does
> not generate pagination links, you may want consider using a handler to process API responses
> for paginated queries that generates pagination links for you. This is useful to do
> *even if you do not use `<Paginate />`* as quite a few WarpDrive/EmberData features work best
> with links.

`<Paginate />`'s API mimics `<Request />`, but expands the possibilities to afford an extremely
flexible toolbox for managing the state of any paginated flow we want to build.

All of the same top-level states (`idle` `loading` `content` `error` `cancelled`) are
available to us for use. `idle`, `loading`, `error` and `cancelled` apply only to the state of
the initiating request passed into the component.

The `content` block is entered when the initial request resolves, and yields a `pages`
object exposing the pagination state, along with a `features` object for controlling
the initiating request.

One new block is added:
- `<:default>`, which allows use of `Paginate` without any other blocks. It receives the same
  params as the `content` block, and renders regardless of the state of the initiating request.

> [!TIP]
> If the `<:default>` block is provided, no other named blocks will ever be utilized. E.g. the use of
> default represents a separate mode for the component in which we have signaled that request state
> management will occur elsewhere

**Choosing a mode**

The `@mode` arg selects which navigation surface the component yields: `'paged'`
(the default) or `'infinite'`. The mode is type-only — it narrows the `pages` and
`features` params yielded to the `content`, `always` and `default` blocks so the two
surfaces cannot be mixed, and it is never read at runtime.

```gjs
<Paginate @request={{@request}} @mode="infinite">
  <:content as |pages|>
    {{! pages is InfinitePaginationState — pages.activePageRequest is a type error }}
  </:content>
</Paginate>
```

**Content features**

Alongside `pages`, the `content`, `always` and `default` blocks yield a `features`
object with the state and controls of the initiating request — `refresh`, `reload`,
`isRefreshing`, `abort` (while refreshing), `latestRequest`, `isOnline`, `isHidden` —
plus the mode's navigation entry point: `loadPage` in paged mode, `loadNext` and
`loadPrev` in infinite mode (the same functions exposed on the state).

```gjs
<Paginate @request={{@request}} @mode="infinite">
  <:content as |pages features|>
    {{#each pages.data as |item|}}{{item.title}}{{/each}}
    {{#if pages.hasNext}}
      <button {{on "click" features.loadNext}}>Load more</button>
    {{/if}}
    <button {{on "click" features.refresh}}>Refresh</button>
  </:content>
</Paginate>
```

In infinite mode, requests for the previous and next pages are exposed as
`pages.previousRequest` and `pages.nextRequest`. Because these are plain requests, we
can wrap them in `<Request />` (or any other tool) and place them wherever our layout
calls for — the component does not bake any ordering into the DOM.

Below, we show a number of example usages.

#### Render an infinite list

Here we use `<Paginate />` together with [VerticalCollection](https://github.com/html-next/vertical-collection/)
to provide bidirectional infinite scroll.

**without error/loading states**

```gjs
import { Paginate } from '@warp-drive/ember';

<template>
  <Paginate @request={{@request}} @mode="infinite" as |pages|>
    <VerticalCollection
      @items={{pages.data}}
      @lastReached={{pages.loadNext}}
      @firstReached={{pages.loadPrev}}
      as |item|
    >
      {{item.title}}
    </VerticalCollection>
  </Paginate>
</template>
```

**With a loading state for the initial request**

```diff
  <Paginate @request={{@request}} @mode="infinite">
+   <:loading><Spinner /></:loading>
+
+   <:content as |pages|>
      <VerticalCollection
        @items={{pages.data}}
        @lastReached={{pages.loadNext}}
        @firstReached={{pages.loadPrev}}
        as |item|
      >
        {{item.title}}
      </VerticalCollection>
+   </:content>
  </Paginate>
```

**With an error state for errors on the initial request**

```diff
  <Paginate @request={{@request}} @mode="infinite">
    <:loading><Spinner /></:loading>

    <:content as |pages|>
      <VerticalCollection
        @items={{pages.data}}
        @lastReached={{pages.loadNext}}
        @firstReached={{pages.loadPrev}}
        as |item|
      >
        {{item.title}}
      </VerticalCollection>
    </:content>
+
+   <:error as |error state|>
+     <ErrorForm @error={{error}} />
+     <button {{on "click" state.retry}}>Retry</button>
+   </:error>
  </Paginate>
```

**Displaying a spinner when a subsequent request is loading**

`pages.previousRequest` and `pages.nextRequest` are `null` until a load is triggered, then
expose the in-flight request until it resolves. Wrapping them in `<Request />` gives us a
loading state for each direction, placed wherever our layout calls for.

```diff
  <Paginate @request={{@request}} @mode="infinite">
    <:loading><Spinner /></:loading>

    <:content as |pages|>
+     {{#if pages.hasPrevious}}
+       <Request @request={{pages.previousRequest}}>
+         <:loading><Spinner /></:loading>
+       </Request>
+     {{/if}}

      <VerticalCollection
        @items={{pages.data}}
        @lastReached={{pages.loadNext}}
        @firstReached={{pages.loadPrev}}
        as |item|
      >
        {{item.title}}
      </VerticalCollection>

+     {{#if pages.hasNext}}
+       <Request @request={{pages.nextRequest}}>
+         <:loading><Spinner /></:loading>
+       </Request>
+     {{/if}}
    </:content>

    <:error as |error state|>
      <ErrorForm @error={{error}} />
      <button {{on "click" state.retry}}>Retry</button>
    </:error>
  </Paginate>
```

**Displaying errors from a subsequent request**

When an error occurs on a `next` or `prev` request, `pages.nextRequest`/`pages.previousRequest`
continue to reference that request until a load succeeds. This enables us to handle the full
control flow for the subsequent request by passing it into `<Request />`!

```gjs
import { Paginate, Request } from '@warp-drive/ember';

<template>
  <Paginate @request={{@request}} @mode="infinite">
    <:loading><Spinner /></:loading>

    <:content as |pages|>
      {{#if pages.hasPrevious}}
        <Request @request={{pages.previousRequest}}>
          <:loading><Spinner /></:loading>

          <:error as |error state|>
            <ErrorForm @error={{error}} />
            <button {{on "click" state.retry}}>Retry</button>
          </:error>
        </Request>
      {{/if}}

      <VerticalCollection
        @items={{pages.data}}
        @lastReached={{pages.loadNext}}
        @firstReached={{pages.loadPrev}}
        as |item|
      >
        {{item.title}}
      </VerticalCollection>
    </:content>

    <:error as |error state|>
      <ErrorForm @error={{error}} />
      <button {{on "click" state.retry}}>Retry</button>
    </:error>
  </Paginate>
</template>
```

**Load-more buttons for subsequent requests**

The `<:idle>` state of a wrapping `<Request />` pairs naturally with `pages.loadPrev` and
`pages.loadNext` to build load-more sentinels: idle until the user triggers a load, a spinner
while the page loads, and gone once the frontier advances onto the loaded page.

```diff
  <Paginate @request={{@request}} @mode="infinite">
    <:loading><Spinner /></:loading>

    <:content as |pages|>
+     <Request @request={{pages.previousRequest}}>
+       <:loading><Spinner /></:loading>
+       <:idle><button {{on "click" pages.loadPrev}}>Load More</button></:idle>
+     </Request>

      <VerticalCollection
        @items={{pages.data}}
        @lastReached={{pages.loadNext}}
        @firstReached={{pages.loadPrev}}
        as |item|
      >
        {{item.title}}
      </VerticalCollection>

+     <Request @request={{pages.nextRequest}}>
+       <:loading><Spinner /></:loading>
+       <:idle><button {{on "click" pages.loadNext}}>Load More</button></:idle>
+     </Request>
    </:content>

    <:error as |error state|>
      <ErrorForm @error={{error}} />
      <button {{on "click" state.retry}}>Retry</button>
    </:error>
  </Paginate>
```

#### Render Individual pages

The `<Paginate />` component works equally well for tab / link style pagination
UX as it does for InfiniteFeed style UX.

**Render the active page**

> [!TIP]
> Remember, the `<:loading>` and `<:error>` states apply only to the initial request,
> not to the activePage.

```gjs
import { Paginate } from '@warp-drive/ember';

<template>
  <Paginate @request={{@request}}>
    <:loading><Spinner /></:loading>
    <:content as |pages|>
      <MyPageDisplay @page={{pages.activePage}} />
    </:content>
    <:error as |error state|>
      <ErrorForm @error={{error}} />
      <button {{on "click" state.retry}}>Retry</button>
    </:error>
  </Paginate>
</template>
```

**Render Pagination Links**

The `<EachLink />` companion component yields the navigation links derived from a
paged state's shared page graph. It renders no markup of its own: it yields a single
links state, and the consumer decides which links to render, with what markup, and
in what order. The yielded state exposes:

- `links` — the numbered page links, with placeholders standing in for gaps of
  not-yet-loaded pages. Discriminate the two with `isReal`. A numbered link
  exposes `index`, `text`, `isCurrent`, `distanceFromActiveIndex` and a stable
  `setActive` action that loads the page and makes it active; a placeholder's
  `text` is a single `'.'`, and it exposes the `indexRange` it covers along with
  `rangeSize` and `distanceFromActiveIndex`. Empty for cursor-based collections,
  which expose no page numbers.
- `prev` / `next` — the relational links relative to the active page (or `null`
  at the collection's edges), with the same `setActive` action. For cursor-based
  collections these are the only navigation.
- `first` / `last` — the relational links to the collection's edges, when the
  response exposes them. Usually present on every page — including the edge page
  itself, where the link's `isCurrent` is `true` (useful for disabling the
  control).

```diff
- import { Paginate } from '@warp-drive/ember';
+ import { Paginate, EachLink } from '@warp-drive/ember';

 <template>
   <Paginate @request={{@request}}>
     <:loading><Spinner /></:loading>

     <:content as |pages|>
       <MyPageDisplay @page={{pages.activePage}} />
+
+      <EachLink @pages={{pages}} as |state|>
+        {{#if state.prev}}
+          <button {{on "click" state.prev.setActive}}>Previous</button>
+        {{/if}}
+        {{#each state.links as |link|}}
+          {{#if link.isReal}}
+            <button class={{if link.isCurrent "active"}} {{on "click" link.setActive}}>{{link.index}}</button>
+          {{else}}
+            {{link.text}}
+          {{/if}}
+        {{/each}}
+        {{#if state.next}}
+          <button {{on "click" state.next.setActive}}>Next</button>
+        {{/if}}
+      </EachLink>
     </:content>

     <:error as |error state|>
       <ErrorForm @error={{error}} />
       <button {{on "click" state.retry}}>Retry</button>
     </:error>
   </Paginate>
 </template>
```

In JavaScript, the same reactive links are available via `getPaginationLinks`, keyed
by state identity so repeated calls share one instance:

```ts
import { getPaginationLinks } from '@warp-drive/ember';

const links = getPaginationLinks(pages);
links.links; // numbered links and placeholders
links.first; // relational first link, or null
links.prev; // relational prev link, or null
links.next; // relational next link, or null
links.last; // relational last link, or null
```

**Total Pages Hints**

Pagination utilizes two hints for managing the page graph and links: `currentPage` and `totalPages`.
When the response does not expose these values through the default `meta` locations
(`meta.page`/`meta.currentPage` and `meta.totalPages`), we can provide them by passing a
`PageHints` function to the component. Whenever a request loads, the hint function will be run.

```ts
interface PageHints {
  (document: ReactiveDocument<unknown>): { currentPage: number; totalPages: number; }
}
```

```hbs
<Paginate @request={{@request}} @pageHints={{@pageHintsFn}}>
```

Because the hints attach to the collection's shared cache, every `<Paginate />` sharing
a collection must receive the *same function reference* (asserted in dev) — define it
once at module scope and import it everywhere.

> [!Tip]
> The `<Paginate />` component is agnostic to page size. If we would like to hint
> to something like `VerticalCollection` how many total items might conceivably be loaded,
> we can easily access that information from the response! For example, if we were
> Using the JSON:API Pagination Profiles Spec, the hint could come from
> `pages.activePage.meta.estimatedTotal.bestGuess`

**Substates for loading individual pages**

Often in a tabbed structure we will want individual loading states for the request for each
individual page. This is a scenario where using the `default` block comes in handy.

Below is the same example as above but with a loading state per-page.

In this case, the `activePageRequest` will start as the request for the first page,
and update as the user clicks through.

In addition to per-page control-flow, this gives us the ability to provide a stable ui-frame
and navigation experience that wraps these loading and error states.

```gjs
import { Paginate, EachLink, Request } from '@warp-drive/ember';

<template>
  <Paginate @request={{@request}} as |pages|>
    <Request @request={{pages.activePageRequest}}>
      <:loading><Spinner /></:loading>
      <:content as |page|>
        <MyPageDisplay @page={{page}} />
      </:content>
      <:error as |error state|>
        <ErrorForm @error={{error}} />
        <button {{on "click" state.retry}}>Retry</button>
      </:error>
    </Request>
    <EachLink @pages={{pages}} as |state|>
      {{#each state.links as |link|}}
        {{#if link.isReal}}
          <button {{on "click" link.setActive}}>{{link.index}}</button>
        {{else}}
          {{link.text}}
        {{/if}}
      {{/each}}
    </EachLink>
  </Paginate>
</template>
```

**Autorefresh and external subscription management**

`<Paginate />` accepts the same `@autorefresh`, `@autorefreshThreshold` and
`@autorefreshBehavior` args as `<Request />`, applied to the initiating request
(see the Autorefresh section above).

To manage the component's lifecycle externally, create the subscription yourself with
`createPaginationSubscription` and pass it in via `@subscription` — the component then
uses it instead of creating (and disposing) its own.

**Route-driven navigation: a changed `@request`**

When the `@request` arg changes, `<Paginate />` does not throw away its state. The
existing content stays rendered while the new request resolves; the component then
inspects the response's collection identity (its `first` — or `self` — link):

- **Same collection** — the request is a page of the collection already on screen
  (for example a route reload caused by the browser back button changing a `?page=`
  query param). The page is adopted as the new `activePage` of the *same*
  `PaginationState` — links, totals and (in infinite mode) the accumulated run are
  preserved. An adjacent page extends the infinite run; a disjoint page jumps to it.
- **Different collection** — the pagination resets, exactly like today: fresh state,
  fresh links, and the `loading` block for the initial setup.

While the changed request resolves, the content features expose `isNavigating`, so a
lightweight indicator can be shown without tearing down the page:

```gjs
<Paginate @request={{@request}}>
  <:content as |pages features|>
    {{#if features.isNavigating}}<SmallSpinner />{{/if}}
    <Request @request={{pages.activePageRequest}}>
      ...
    </Request>
  </:content>
</Paginate>
```

This makes it natural to drive `<Paginate />` from the URL: let links transition the
route (updating query params), let the route's model hook issue the request, and pass
it to `@request` — back/forward buttons then work for free.

The same mechanism is available programmatically when managing a `PaginationState`
directly: `pages.adoptPage(request)` awaits the request, verifies it belongs to the
state's collection, and makes its page the active page — resolving to the page's
document, or to `null` (leaving the state untouched) when the request fails or
belongs to a different collection.

```ts
const pages = getPaginationState(initialRequest);
// later, e.g. reacting to a ?page= query param:
const adopted = await pages.adoptPage(store.request(query));
if (adopted === null) {
  // not part of this collection — start a fresh pagination
}
```

## Using .hbs

The components and utils this library exports are intended for use with `
Glimmer Flavored JavaScript (`gjs`). To use them in handlebars files, your
app should re-export them. For instance:

*app/components/await.ts*
```ts
export { Await as default } from '@warp-drive/ember';
```

```hbs
<Await @promise={{this.getTheData}}></Await>
```

This approach allows renaming them to avoid conflicts just by using a different
filename if desired:

*app/components/warp-drive-await.ts*
```ts
export { Await as default } from '@warp-drive/ember';
```

```hbs
<WarpDriveAwait @promise={{this.getTheData}}></WarpDriveAwait>
```

---

### ♥️ Credits

 <details>
   <summary>Brought to you with ♥️ love by <a href="https://emberjs.com" title="EmberJS">🐹 Ember</a></summary>

  <style type="text/css">
    img.project-logo {
       padding: 0 5em 1em 5em;
       width: 100px;
       border-bottom: 2px solid #bbb;
       margin: 0 auto;
       display: block;
     }
    details > summary {
      font-size: 1.1rem;
      line-height: 1rem;
      margin-bottom: 1rem;
    }
    details {
      font-size: 1rem;
    }
    details > summary strong {
      display: inline-block;
      padding: .2rem 0;
      color: #000;
      border-bottom: 3px solid #bbb;
    }

    details > details {
      margin-left: 2rem;
    }
    details > details > summary {
      font-size: 1rem;
      line-height: 1rem;
      margin-bottom: 1rem;
    }
    details > details > summary strong {
      display: inline-block;
      padding: .2rem 0;
      color: #555;
      border-bottom: 2px solid #555;
    }
    details > details {
      font-size: .85rem;
    }

    @media (prefers-color-scheme: dark) {
      details > summary strong {
        color: #fff;
      }
    }
    @media (prefers-color-scheme: dark) {
      details > details > summary strong {
        color: #afaba0;
      border-bottom: 2px solid #afaba0;
      }
    }
  </style>
</details>
