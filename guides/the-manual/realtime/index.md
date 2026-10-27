---
title: Overview
description: Keep cached data live by turning WebSocket or server-sent event messages into cache operations or request invalidations, so every record and list on screen updates without a refetch.
---

# Real-time Updates

In a real-time app, the server tells the client when data changes instead of waiting
to be asked: a teammate renames a project, a new comment arrives, an order ships. The
messages usually arrive over a [WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
or as [server-sent events](https://developer.mozilla.org/en-US/docs/Web/API/EventSource).

***Warp*Drive** doesn't open those connections for you, and it doesn't define a message
format. Your app owns both. What ***Warp*Drive** gives you is a place to put what the
messages say: the cache. Apply a message to the cache, and every record, relationship, and
request result that reads the changed data updates, wherever it's shown, just as if a
response had brought the change.

## Two Ways to Apply a Message

A message either says exactly what changed, or says only that something did.

**If the message carries the change**, apply it with
[`cache.patch`](/api/@warp-drive/core/types/cache/types/Cache#patch). A message with a
resource's new state becomes an `'update'` operation, a deletion becomes a `'remove'`, and
so on. Nothing is fetched. [Patching The Cache](../mutations/operations.md) covers every
operation and how to get the cache keys they need.

**If the message only says something changed**, such as "todos changed", invalidate the
cached requests it affects and let them refetch. Use this when working out the change
yourself would mean knowing the server's rules, such as which filtered lists a todo now
belongs in, or the order a sorted list puts it in. The server already knows; let it answer.

Most apps use both: patch the records a message names, and invalidate the lists it might
change.

## Choosing a Message Format

You design the messages, so design them to be easy to apply. Two shapes go a long way:

- **The resource's new state, as a JSON:API resource object.** If your API speaks JSON:API,
  this is the same object a response would have put in `data`, so the cache can merge it
  as-is.
- **A deletion or a "this type changed" notice**, naming the type, and the id when there is
  one.

This page uses these messages:

```ts
import type { ExistingResourceObject } from '@warp-drive/core/types/spec/json-api-raw';

type ChangeMessage =
  // A resource was created or updated; here is its new state
  | { kind: 'changed'; resource: ExistingResourceObject }
  // A resource was deleted
  | { kind: 'deleted'; type: string; id: string }
  // Lists of this type may have changed; refetch them
  | { kind: 'stale'; type: string };
```

If your API doesn't speak JSON:API, convert each resource into this shape before you apply
it, the same way your request handlers convert responses.

## Applying Messages

One function turns a message into cache updates:

```ts
import type Store from './store.ts';

export function applyMessage(store: Store, message: ChangeMessage): void {
  switch (message.kind) {
    case 'changed': {
      const { type, id } = message.resource;
      const record = store.cacheKeyManager.getOrCreateRecordIdentifier({ type, id });
      store.cache.patch({ op: 'update', record, value: message.resource });
      break;
    }
    case 'deleted': {
      const record = store.cacheKeyManager.getOrCreateRecordIdentifier({ type: message.type, id: message.id });
      store.cache.patch({ op: 'remove', record });
      break;
    }
    case 'stale': {
      store.lifetimes.invalidateRequestsForType(message.type, store);
      break;
    }
  }
}
```

`'changed'` merges the new state into the resource, whether or not it was already cached.
Fields the message leaves out keep their cached values, so a message can carry only the
fields that changed.

`'deleted'` removes the resource from the cache, the same way a saved deletion would.

`'stale'` invalidates every cached request registered for that type. A request registers
for a type by listing it in `cacheOptions.types`; requests that don't, aren't invalidated:

```ts
export function getTodos(): RequestInfo<TodosDocument> {
  return {
    url: '/api/todo',
    method: 'GET',
    cacheOptions: { types: ['todo'] },
  };
}
```

An invalidated request refetches the next time it's made. To refetch the ones already on
screen, render them with a `<Request>` whose `autorefresh` includes `invalid`, such as
`autorefresh="invalid"` or `autorefresh="online,invalid"`. It refetches when its request is
invalidated, and keeps the old result showing until the new one arrives.
See `<Request>` for [Ember](/api/@warp-drive/ember/classes/Request) or
[React](/api/@warp-drive/react/functions/Request).

`store.lifetimes` is the store's cache policy. `invalidateRequestsForType` is part of the
default policy that [`useRecommendedStore`](/api/@warp-drive/core/functions/useRecommendedStore) sets up; a custom policy may not have it.

## Connecting

Open the connection once, after the store exists, and close it when the app shuts down.
With server-sent events:

```ts
import type Store from './store.ts';
import { applyMessage, type ChangeMessage } from './apply-message.ts';

export function connectRealtime(store: Store, url: string): () => void {
  const source = new EventSource(url);

  source.addEventListener('message', (event: MessageEvent<string>) => {
    applyMessage(store, JSON.parse(event.data) as ChangeMessage);
  });

  return () => source.close();
}
```

A WebSocket works the same way: parse each message in its `message` listener and pass it to
`applyMessage`.

Where to call `connectRealtime` depends on your framework: an Ember service or
instance-initializer, a React effect near the root of the app, and so on. Call it once per
store, not once per component.

## Sending Several Changes at Once

If a message can carry several changes, such as a `resources` array of JSON:API resource
objects, apply them in a single `cache.patch` call with an array of operations. Everything
that reads the changed data then updates once, after the last change, instead of once per
change:

```ts
store.cache.patch(
  resources.map((resource) => ({
    op: 'update' as const,
    record: store.cacheKeyManager.getOrCreateRecordIdentifier({ type: resource.type, id: resource.id }),
    value: resource,
  }))
);
```

## Things to Plan For

**Unsaved edits.** A message changes the cache's remote state, the server's view, and leaves
unsaved edits alone. A user editing a form keeps seeing their own value until they save or
discard it. If a message brings the same value as their edit, the edit counts as saved and is
dropped. See [Remote State Only](../mutations/operations.md#remote-state-only).

**Your own changes come back.** Many servers broadcast a change to every client, including the
one that made it. Applying it again is harmless: it merges the same state the save already put
in the cache.

**Missed messages.** While the connection is down, messages are lost. `EventSource` reconnects
on its own; when it does, its `open` event fires again. Treat a reconnect as "everything may have
changed", and invalidate the types your app shows:

```ts
let connected = false;
source.addEventListener('open', () => {
  // The first open is the initial connection; later ones are reconnects.
  if (connected) {
    for (const type of ['project', 'comment']) {
      store.lifetimes.invalidateRequestsForType(type, store);
    }
  }
  connected = true;
});
```

This is separate from `autorefresh="online"`, which refetches when the browser itself comes
back online. A dropped connection to your server doesn't always mean the browser went
offline, so use both if you want both.

**Lists.** A `'changed'` message updates a resource everywhere it already appears, but it can't
add a new resource to a cached list, or move one between filtered lists, because the cache
doesn't know what a list's URL means. Either send a `'stale'` message for the type, or, when you
know which lists changed and where, patch them; see
[Request Results](../mutations/operations.md#request-results).

## What's Next

- [Patching The Cache](../mutations/operations.md) lists every operation `cache.patch` accepts.
- [Caching](../caching/index.md) explains how the cache stores resources and request results.
