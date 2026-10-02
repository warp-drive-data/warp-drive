---
title: Why Autofetch Is Going Away, and How to Deal With That
description: Learn why WarpDrive is removing the fetch-on-access behavior of async belongsTo and hasMany relationships, what replaces it, and how to migrate an app one step at a time.
date: 2026-10-02
outline:
  level: 2,3
---

# Why Autofetch Is Going Away, and How to Deal With That

<SinceBadge version="5.10.0" /> &nbsp; 2026-10-02

**Who this is for:** apps that define `belongsTo` or `hasMany` relationships with `async: true`
(or with no `async` option, which used to default to `true`) on a `Model` or a
[LegacyMode](/guides/the-manual/schemas/resources/legacy-mode.md) schema, and anyone who has
read that [PolarisMode](/guides/the-manual/schemas/resources/polaris-mode.md) "does not support
async relationships" and wondered why. It assumes you know how async relationships behave today.

Reading an async relationship in ***Warp*Drive**, and in EmberData before it, does two things at
once: it returns a promise proxy for the related records, and if any of them aren't loaded, it
starts a request for them. That second half is **autofetch**. It is going away. The relationship
itself isn't: `async` survives with a narrower meaning, and loading related data becomes
something your code asks for instead of something reading a property does.

This post explains why, in the words of the people who ran into it for a decade, and then lays
out a migration you can start today, one relationship at a time.

## What Autofetch Does

Take a post with comments, where each comment has an author:

```ts
class Post extends Model {
  @hasMany('comment', { async: true, inverse: 'post' }) comments;
}

class Comment extends Model {
  @belongsTo('user', { async: true, inverse: null }) author;
}
```

```hbs
{{#each @post.comments as |comment|}}
  <p>{{comment.author.name}}: {{comment.body}}</p>
{{/each}}
```

Nothing in that template looks like a request, but rendering it can make many:

1. Reading `@post.comments` returns a `PromiseManyArray` and fetches every comment that isn't in
   the cache: one request by the relationship's link, or one request per comment (one in total
   if the adapter coalesces them).
2. The `#each` renders nothing until those arrive, then renders everything.
3. Each `comment.author` returns a `PromiseBelongsTo` and fetches its author: another request per
   comment, which can only start after step 1 finished, because only then does rendering reach
   it.

That is a request waterfall and an N+1 query, written by nobody, decided by whichever template
happened to render first.

## Why It Seemed Like a Good Idea

Async relationships come from a time when, as
[RFC 846](https://rfcs.emberjs.com/id/0846-ember-data-deprecate-proxies/) put it, "Native
Proxies did not yet exist, Promises were relatively unheard of, and async state management was
the Wild West." Templates could render a promise proxy without any ceremony, so a relationship
that fetched itself made lazy loading free.

It really is convenient at first. Edward Faulkner made the best case for it in 2019:

> When you're just starting out, they're really convenient. They let you traverse the graph of
> models lazily, on-demand and not need to stop and worry about it. […] It means you can first
> spend effort getting your UI right, and later when you're ready spend effort reducing the number
> of network requests[.]
>
> — [ef4 on Ember Discuss, 2019-06-18](https://discuss.emberjs.com/t/what-are-the-benefits-of-async-relationship/16688/3)

and then, in the next paragraph, said why it doesn't hold up:

> As soon as people go beyond the basic cases, there's a cliff you step off and the asynchrony is
> more painful than helpful. I think people hit the cliff early enough that it's not worth it.

## What It Cost

### Reading Data Became a Network Side Effect

The core problem is that one property read means two very different things. Ryan Toronto, in
EmberMap's [The case against async relationships](https://embermap.com/notes/83-the-case-against-async-relationships)
(2017-11-17):

> Our main gripe with this API is that it combines the concerns of local data access with remote
> data fetching into a single method call. This makes it harder for developers to write
> expressive, intention-revealing code[.]

Is `post.comments` reading comments a route already loaded, kicking off a request, or doing a
background refresh? The code can't say, so neither can the person reading it. And because a
template or a getter is just a property read, any of them can become an accidental data loader.

### Requests Nobody Wrote

Because the template decides when relationships are read, it also decides what gets fetched and
in what order. Users found out from their network tab:

> Let's say I want to load a category, and that category has 112 products in it. […] when this is
> loaded, it's going to trigger 113 xhr's.
>
> — [midget2000x, 2017-03-29](https://discuss.emberjs.com/t/ember-data-and-json-api-why-handle-relationships-client-side/12675/1)

> Rendering the generator is super slow as the call to @model.items seems to result in thousands
> of queries to the #show endpoint.
>
> — [palmergs, 2023-04-17](https://discuss.emberjs.com/t/avoiding-n-1-query-on-association-with-async-true/20050/1)

Even `{{invoice.payer.id}}`, reading an id the client already had, fetched the whole payer: in a
table of 50 invoices, that was 50 requests. As Brendan McLoughlin explained, "Ember Data never
has a chance to detect that you are only attempting to access a property that is already loaded"
([#2705](https://github.com/warp-drive-data/warp-drive/issues/2705#issuecomment-70269202)).
`coalesceFindRequests` could fold some of those requests into one, when the adapter and server
supported it, but it was off by default, hard to discover, and broke whenever URL building was
customized.

Fetching on render also means nothing starts until rendering gets there. For server-side
rendering that is fatal: relationships "don't actually start loading until you try to render
them, and fastboot has no reason to know to wait for that to finish"
([ef4, 2018-10-02](https://discuss.emberjs.com/t/my-second-order-relationships-are-not-rendered-by-fastboot/15579/2)).

### Nothing Owns the Loading State

When a property read starts a request, no code owns that request, so nothing has a natural place
to show a spinner, handle an error, or retry. Templates flash empty, then full. A failed fetch
was remembered: reading the relationship again returned the same rejected promise rather than
trying again ([#5046](https://github.com/warp-drive-data/warp-drive/issues/5046), open since
2017). Apps sprinkled reads of `isFulfilled` and `isPending` through computed properties just to
make them recompute ([#7904](https://github.com/warp-drive-data/warp-drive/issues/7904)).

### "Not Loaded" Looks Like "Empty"

An async relationship always hands back a proxy, loaded or not, so a missing value and a value
that hasn't arrived look the same. A belongsTo "is going to return a special promise, which of
course will never be null"
([dknutsen, 2022-09-06](https://discuss.emberjs.com/t/detect-if-belongsto-is-null-and-toggle-associations/19702/2)).
Worse, saving a record whose async hasMany had never loaded could serialize it as `[]` and wipe
the relationship on the server
([#2750](https://github.com/warp-drive-data/warp-drive/issues/2750)).

### Proxies Aren't the Thing They Wrap

The proxy pretends to be the record or the array, and the pretense leaks:

- It is never `===` to the record it wraps, so components comparing values miss changes
  ([#5575](https://github.com/warp-drive-data/warp-drive/issues/5575)).
- `{{#if this.book.authors}}` is always true, because the proxy is always there
  ([#8847](https://github.com/warp-drive-data/warp-drive/issues/8847)).
- It is a promise and an array at the same time. "It's always both. […] This works great in
  templates, but it can be pretty confusing in javascript"
  ([ef4, 2019-08-18](https://discuss.emberjs.com/t/when-does-record-relationship-getting-return-promises/16962/2)).
- TypeScript can't describe a property that reads as a promise and is set to a record:
  "typescript makes it impossible to have an async getter with a sync setter"
  ([#8817](https://github.com/warp-drive-data/warp-drive/issues/8817#issuecomment-1703088270)).
- It was expensive. RFC 846 put the cost of the legacy framework infrastructure behind these
  proxies "as high as 30% of the overall runtime cost of EmberData."

Code also came to depend on the proxy's quirks without knowing it. When EmberData 3.28 tightened
relationship state, one team reported "hundreds of computed properties based on async hasMany
relationships, all of which worked perfectly prior to the upgrade, but many of which are now
causing issues"
([harrysundown, 2022-03-28](https://discuss.emberjs.com/t/computed-properties-on-async-hasmany-relationships/19469/1)).

### The Community Was Already Turning It Off

By 2017 experienced teams were opting out. EmberMap built
[ember-data-storefront](https://github.com/embermap/ember-data-storefront), whose first README
stated the case plainly: async relationships "use a single API that mixes data fetching over the
network with local data access." Storefront made every relationship `async: false`, first with a
runtime patch, then a Babel plugin, and finally an
[ESLint rule](https://github.com/embermap/eslint-plugin-ember-data-sync-relationships), and gave
apps an explicit `load()` instead. EmberMap's article ends:

> Async relationships end up being a footgun for beginners: they make it easy to write n + 1 bugs,
> and they make data loading seem like a smaller piece of Ember app development than it actually
> is.

Going sync had its own trap, though: a sync relationship whose data wasn't in the payload was
treated as empty. Ryan Toronto again, in 2019, described where the real answer lay: links and
sync relationships "let you access data without triggering network requests, but also let you
lazily load data when you need it"
([ryanto, 2019-03-01](https://discuss.emberjs.com/t/ember-data-jsonapi-and-known-to-be-empty-relationships-that-are-definitely-not-empty/16219/6)).
That is the design ***Warp*Drive** is landing on.

## What's Changing

Autofetch is being retired in stages, and the first ones have already shipped:

- **Promise proxy behaviors were deprecated** by RFCs [745](https://rfcs.emberjs.com/id/0745-ember-data-deprecate-methods-on-promise-many-array/)
  and [846](https://rfcs.emberjs.com/id/0846-ember-data-deprecate-proxies/), and removed in 5.0.
  An async hasMany now returns a thin promise wrapper rather than an Ember proxy. The async
  belongsTo proxy was kept as-is on purpose, because "encouraging folks to refactor towards
  `await` before use is key for the next stage in which async relationships will not exist at all
  in their current form."
- **The legacy request paths were deprecated** by
  [RFC 964](https://rfcs.emberjs.com/id/0964-deprecate-legacy-request-support/), which names "the
  `hasMany` and `belongsTo` async auto-fetch behaviors on `@ember-data/model`" among them, and
  explains why adapters and serializers aren't deprecated yet: "to do so we must also deprecate the
  auto-fetch behaviors of async relationships."
- **PolarisMode never had autofetch.** Its relationships are `async: false` and use
  [LinksMode](/guides/the-manual/misc/links-mode.md), which loads a relationship through the
  request pipeline instead of an adapter, and only when asked.

Next come two new relationship field kinds, `resource` and `collection`, which replace
`belongsTo` and `hasMany`. They are being built now and are not in a release yet. They keep the
`async` option but change what it means:

- An `async` relationship is one that **can be fetched on its own**: it has a link. Its value is a
  [ReactiveDocument](/api/@warp-drive/core/reactive/types/ReactiveDocument)-like object with
  `data`, `links` and `meta`. `data` holds whatever the cache has, or nothing if the relationship
  was never loaded, and reading it never makes a request. Loading it is an explicit call.
- A sync relationship is one whose data **always arrives with its parent** and is never fetched
  separately.

In other words, `async` stops being a behavior of the UI, something that happens when a template
reads a property, and becomes a fact about the data: whether your API serves that relationship
separately. This is the plan runspired sketched on Ember Discuss in 2019, down to the names:
relationships needed "information about meta/errors/links beyond just the records that they
contain," and you would opt in "by changing from belongsTo and hasMany to resource and collection
decorators"
([runspired, 2019-06-19](https://discuss.emberjs.com/t/what-are-the-benefits-of-async-relationship/16688/7)).

## How to Deal With It

None of this has to happen at once, and none of it requires leaving `Model` first. Moving off
adapters to requests, moving off models to schemas, and moving off autofetch are separate shifts;
you can make them in any order. The steps below work on `Model` and LegacyMode today, and each
one leaves your app working.

### Step 1: Make Every Async Read Explicit

Keep your `async: true` relationships for now, but stop relying on the proxy. Wherever a template
renders an async relationship, render it through [`<Await>`](/api/@warp-drive/ember/classes/Await),
which gives the pending and error states a home:

```glimmer-ts
import { Await } from '@warp-drive/ember';

<template>
  <Await @promise={{@post.comments}}>
    <:pending>Loading comments…</:pending>
    <:error as |error|>Couldn't load comments: {{error.message}}</:error>
    <:success as |comments|>
      {{#each comments as |comment|}}
        <Comment @comment={{comment}} />
      {{/each}}
    </:success>
  </Await>
</template>
```

Use one `<Await>` per level and pass the resolved record down, rather than chaining
`comment.author.name` through two proxies. In JavaScript, `await` the relationship before using
it, or derive its state with
[`getPromiseState`](/api/@warp-drive/core/reactive/functions/getPromiseState) in a getter instead
of reading `isPending` or `.content`. [Async as Reactive State](/guides/the-manual/reactivity/derivation.md)
covers both patterns.

The app still autofetches after this step, but every place that does is now visible and handles
loading and failure, and none of it depends on proxy behavior.

### Step 2: Load Relationships Through Requests

Next, decide where each relationship's data should come from, and fetch it there on purpose.
Data a page needs up front belongs in the request that loads the page, using `include`:

```ts
import { findRecord } from '@warp-drive/utilities/json-api';

const request = findRecord('post', postId, { include: ['comments', 'comments.author'] });
```

Issue that request from a route, or render it with [`<Request>`](/api/@warp-drive/ember/classes/Request).
Requests are deduplicated, so a route can start a request early and a component can render the
same request later without fetching twice. That is how you tune your waterfall: hoist requests
the page can't render without, and leave the rest to the components that need them.

Data you want only on demand, like comments behind a "Show comments" button, can be requested by
the relationship's link. The relationship's reference exposes it:

```glimmer-ts
import Component from '@glimmer/component';
import { on } from '@ember/modifier';
import { Request } from '@warp-drive/ember';

export default class PostComments extends Component {
  get commentsRequest() {
    const url = this.args.post.hasMany('comments').link();
    return url ? { url, method: 'GET' } : null;
  }

  <template>
    {{#if this.commentsRequest}}
      <Request @query={{this.commentsRequest}}>
        <:loading>Loading comments…</:loading>
        <:error as |error state|>
          Couldn't load comments.
          <button type="button" {{on "click" state.retry}}>Retry</button>
        </:error>
        <:content as |result|>
          {{#each result.data as |comment|}}
            <Comment @comment={{comment}} />
          {{/each}}
        </:content>
      </Request>
    {{/if}}
  </template>
}
```

Once every request that loads a parent either includes the relationship or gives it a related
link, the relationship no longer needs autofetch. Switch it to `async: false` and turn on
`linksMode: true`. With LinksMode, development builds check every payload for the relationship
and throw if it has neither a related link nor full linkage, so a missing `include` shows up as an
error while you develop instead of an unexpected request in production. When every relationship is
in LinksMode and nothing else uses an adapter, `useLegacyStore({ linksMode: true, … })` sets up a
store with no adapter or serializer layer at all.

### Step 3: Move to `resource` and `collection`

When the new field kinds ship, a LinksMode relationship moves over with a schema change:
`belongsTo` becomes `resource`, `hasMany` becomes `collection`, and reads change from
`post.comments` to `post.comments.data`. Relationships you fetch on demand become `async` again,
in the new sense: `post.comments.fetch()` loads them by their link and fills in `data`. A migration
guide will ship alongside them.

### What Isn't Solved Yet

Two patterns have no migration path today:

- **Relationships to records the payload never includes**, where the app expects to have loaded
  them some other way.
- **Reading ids without loading records**, as `post.hasMany('comments').ids()` and
  `post.belongsTo('author').id()` allow.

Keep those on `belongsTo` and `hasMany` for now. [RFC 0006](/rfcs/0006-pointer-and-reference-fields.md),
still a proposal, introduces `pointer` and `reference` field kinds for exactly these cases.

### If You Used ember-data-storefront

Storefront's ideas carry over almost one for one:

| ember-data-storefront | ***Warp*Drive** |
| --- | --- |
| `async: false` on every relationship, enforced by lint | LinksMode relationships, then `resource` and `collection`; reading never fetches |
| `store.loadRecords` / `loadRecord` with include-aware caching | Requests with `include`, cached by request |
| `model.load('comments')` | `<Request>` on the relationship's link today; `fetch()` on `resource` and `collection` |
| `{{assert-must-preload}}` | LinksMode's payload validation in development builds |
| data-provider components | `<Request>` and `<Await>` |

## Further Reading

- [Async as Reactive State](/guides/the-manual/reactivity/derivation.md): `getPromiseState` and
  `<Await>`.
- [Making Requests](/guides/the-manual/requests/index.md): `<Request>`, builders and `include`.
- [LinksMode](/guides/the-manual/misc/links-mode.md): requirements and behavior.
- [Incremental adoption](/upgrading/v5/incremental-adoption.md) and the
  [two-store migration](/upgrading/v5/two-store-migration.md), for apps that lean heavily on
  proxies.
- [The case against async relationships](https://embermap.com/notes/83-the-case-against-async-relationships),
  EmberMap, 2017.
