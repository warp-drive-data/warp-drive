---
title: HoloPrograms
---

# HoloPrograms

:::danger Proposed, not implemented
Nothing on this page ships today. It describes the design holodeck is being built toward, from
[the vision PR](https://github.com/warp-drive-data/warp-drive/pull/9616). The API shapes here will
change. Everything on the other pages in this section works now.
:::

Today every test states every response it needs, one mock at a time. That is fine for a test about
one request and tedious for a test about a screen. A **HoloProgram** is a named set of simulated API
interactions that sets the scene in a single call, so a test can start from a world rather than
from a list of payloads.

```ts
import { startProgram } from '@warp-drive/holodeck';

test('borg are vulnerable to holographic bullets', async function (assert) {
  await startProgram(this, 'the-big-goodbye_chapter-13');

  // every request this test makes is now resolved by that program
});
```

A test can still override one request, or amend the program's state part way through.

```ts
// answer the next POST to /casualty with this payload, outside the program
await POST(this, '/casualty', () => ({ data: { id: '3', type: 'casualty' } }));

// or upsert into the program's own cache, for this test only
await updateProgram(this, () => ({ data: { id: '3', type: 'casualty' } }));
```

## What a program is made of

A program is three things. Route handlers, a seed, and behaviors.

**Route handlers are shared across all programs.** They parse a request and answer it, usually by
querying and updating the program's store. Sharing them is the point, because it pushes you toward
handlers realistic enough that the next test is cheap to write. The proposed router is lazy, so the
cost of importing a handler is paid only when a matching request arrives while recording.

```ts
import { Router } from '@warp-drive/holodeck';

export default new Router((r) => {
  r.GET('/officers', async () => {
    return (await import('./handlers/officers')).GET;
  });
});
```

**The seed is per program.** Each program starts from its own store state, encapsulated to the test
context so it never leaks between tests even when several record at once. Seeds are resources in the
cache format, and the seed function runs only when a program has to boot in record mode.

You are not expected to write the cache format by hand. The proposal includes `serializeCache`, so
you build the world with the same store and record APIs your application uses, then serialize it.

```ts
import { serializeCache } from '@warp-drive/holodeck';

export function generateSeed() {
  const store = new Store();
  const picard = store.createRecord('officer', { id: '1', name: 'Jean-Luc Picard' });
  store.createRecord('starship', { id: 'NCC-1701-D', name: 'Enterprise', crew: [picard] });

  return serializeCache(store);
}
```

Any record left without a primary key is assigned a UUID v4 during serialization.

**Behaviors are per program, per route.** They exist for the things a handler should not have to
know about, such as an endpoint that is slow this time, or state that changed between two requests.

```ts
await createProgram({
  name: 'The Big Goodbye | Chapter 13',
  seed: generateSeed,
  behaviors: (r) => {
    r.GET('/starships', { delay: 50 });          // every request
    r.GET('/officers', [{ delay: 20 }, { delay: 100 }]); // first request, then second
  },
});
```

The proposed set covers `requestDelay` and `responseDelay`, an `error` that replaces the handler's
response, an `after` hook that updates the store once the response has been sent, and `id` plus
`patch` for telling a handler which primary key to mint and what else to write when a mutation
creates records.

## Safety protocols

A route handler can declare schemas, written in [Valibot](https://valibot.dev/), that validate
requests going in and responses coming out. One schema then serves two purposes. It checks that the
mock matches the shape of the real API, and, through transforms that run only against real API
responses, it strips sensitive values before anything is written to disk.

That second job is what makes recording against a production-like API safe enough to commit.

## VCR style recording

VCR style takes its name from the [Rails VCR gem](https://github.com/vcr/vcr), and later
[Polly.js](https://netflix.github.io/pollyjs/). Real requests are recorded against a real API during
development, then replayed forever after.

Holodeck ships the replay half of that today. What is proposed is the recording half, in two modes.

**Static relay** re-issues your request against the real API, passes the response through a safety
protocol, and caches it for replay. No program is generated and nothing else is altered. Tests
written this way are brittle if they assert on values the API is free to change, so pair them with a
consistent dataset.

**Dynamic relay** also re-issues against the real API, but feeds the response into a store scoped to
the current context, then serializes that store as the seed for a new program. Responses are
generated from the seed by the shared route handlers, which is what makes the result reusable rather
than a transcript.

Mutations are handled by serializing the store as the seed at the first mutation, before it is
applied. The delta after the real API responds becomes a `patch` behavior, and a single new record's
id becomes an `id` behavior. `PUT`, `PATCH`, `DELETE`, and `POST` count as mutations by default,
configurable through an `isMutationRequest` hook.

## How this fits what ships now

Programs do not change replay. A program runs while recording, and its requests are written to
`.mock-cache` like any other, so a replayed suite never boots a program at all. The workflow in
[Recording and replaying](./record-and-replay.md) is the layer underneath all of this, and it is not
going away.

## Related

- [Writing mocks](./writing-mocks.md) is how you declare responses today.
- [The vision PR](https://github.com/warp-drive-data/warp-drive/pull/9616) is the source for this
  page and the place to comment on the design.
