---
title: HoloPrograms
warp-drive-rfc: 6
emberjs-rfc:
emberjs-pr:
emberjs-branch:
sync-hash:
stage: proposed
start-date: 2026-09-23T00:00:00.000Z
release-date:
release-versions:
teams:
  - data
  # DECISION: also list "learning"? This RFC changes guide pages and adds an agent skill.
prs:
  accepted:
project-link:
suite:
---

<!--
The number 6 is provisional. 0003 merged as rfcs/0003-warp-drive-devtools-extension.md (#11213).
Open PRs #11087 (rfcs/0003-warp-drive-aql.md) and #11154 (rfcs/0003-cache-layouts.md) still
claim 0003, so they are expected to move to 0004 and 0005. Re-check rfcs/ at merge time and
renumber to the next unused number if either closes unmerged.
-->

# HoloPrograms

## Summary

A HoloProgram is a reusable API scenario for `@warp-drive/holodeck` tests. Today a test declares
one mock per request and restates each response and request body by hand. A program pairs a
seed, which is the starting server state, with a router of route handlers that every program
shares, plus optional per-route behaviors such as a delay or an error. A test opts in with
`startProgram(this, program)`. While the suite records, which is what a local run does, the
program answers each request from a per-test WarpDrive store and writes the answer to
`.mock-cache`, the committed fixture directory, through the existing `POST /__record` endpoint.
**A replayed suite, which is what CI runs, never boots a program.** Replay reads the same fixtures
it reads today. Every committed fixture reproduces byte for byte, and the only changes to replay
are two Phase 0 fixes that also help suites without programs: honoring a recorded delay and
serving 5xx fixtures. The design comes from the vision PR #9616 by runspired (2024-12-07). This
RFC carries it forward, corrected against `main`, and supersedes that PR as the design of record.

Recording against a real API is out of scope. Safety protocols (validation and sanitization) and
the static and dynamic relay modes move to a follow-up RFC, "Recording Holodeck Mocks Against a Real
API" (RFC B). This RFC reserves the names RFC B needs and defines what happens if a handler uses
them early. [One RFC instead of two](#one-rfc-instead-of-two) explains the split.

## Motivation

### One mock per request

Today a test states every response it needs, one mock at a time (the testing guide on #11169,
`guides/the-manual/testing/holo-programs.md:13`). Each mock restates data the test already set up,
and each mutation mock carries the exact request body string so the fixture key matches (#11169,
`guides/the-manual/testing/writing-mocks.md:68-99`).

The test `update hasMany with repeated patch`
(`tests/json-api/tests/integration/cache/mutation-request-test.ts:133`) shows the cost. It pushes
two users and two pets into the client store (`:137`). Its `patchUser1` helper (`:207`) builds a
body string, declares a `PATCH` mock for `/api/user/1` with that string, and writes the response by
hand, including the `firstName`, `lastName`, and relationship `links` the push already holds
(`:220-245`). The test calls the helper twice (`:270`, `:285`), so it declares two responses that a
server would compute from its own state. That file and `did-commit-notification-test.ts` declare
seven mocks (`:79`, `:220`, `:334`, and `:203`, `:235`, `:273`, `:306`). All seven answer requests
for `user` resources, and each one repeats them by hand.

### What a program changes for a test author

The author writes the server once. A seed holds the users and pets. A shared
`PATCH /api/user/:id` handler applies the request body to the program's store and returns the
result. The test starts the program and makes its requests. It declares no mock and restates
neither the response nor the body string.

```ts
test('update hasMany with repeated patch', async function (assert) {
  startProgram(this, usersAndPets); // from '@warp-drive/holodeck/program'
  // ... push the same users and pets, then build and send each PATCH as before, with no PATCH mock
});
```

The program records the request text it received, so the body key cannot drift from the request.
The next test that needs "user 1 after a pet transfer" starts the same program.

### What stays the same

- The mode. `SHOULD_RECORD` decides it at build time
  (`warp-drive-packages/build-config/src/-private/utils/get-env.ts:17`). Local runs record and CI
  replays.
- The fixtures. Programs write through `POST /__record` (`packages/holodeck/server/node.js:138-182`),
  the only code that writes fixtures, and replay reads them through `replayRequest`
  (`server/node.js:24-89`). [Phase 0](#phased-delivery) changes that function only to wait for a
  recorded `delay` and to serve 5xx fixtures; every committed fixture reproduces byte for byte.
- Per-test scoping. Program state lives on the test's `TEST_IDS` entry
  (`packages/holodeck/src/index.ts:13`) and goes away with `setTestId(this, null)`
  (`src/index.ts:182-189`).
- The mock helpers from `@warp-drive/holodeck/mock` keep their signatures. Inside a program test
  they become overrides.

### Why WarpDrive can do this

A generic mock library does not know the application's data. Mirage keeps a second model layer
that exists only inside Mirage ([models](https://miragejs.com/docs/main-concepts/models/)), and
`@msw/data` asks for collection schemas written again in a validation library
([mswjs/data](https://github.com/mswjs/data)). A program's store is a real WarpDrive `Store` with
the application's own schemas. Seeds are JSON:API resource objects, hand-written until Phase 3 adds
`serializeCache` to build them with `createRecord`, and in DEBUG builds the cache checks every
write against those schemas (`warp-drive-packages/json-api/src/-private/cache.ts:390-407`). The
application's request builders produce the URLs the router matches.

Issue #9627 asked what holodeck offers that MSW does not, and whether WarpDrive has the resources to
compete with MSW. Nobody answered in writing. The answer is that holodeck does not compete with
MSW's interception. It serves real HTTP/2 responses from a separate process, so the application's
`fetch` is never patched, and it commits fixtures per test, so a replayed suite does no setup work.
HoloPrograms add scene-setting to the recording side only, using WarpDrive's schemas instead of a
parallel model. [MSW and @msw/data](#msw-and-msw-data) gives the full comparison.

## Detailed design

### Terminology

- **HoloProgram**, or **program**. The object `createProgram` returns. It names a seed, a router, a
  store factory, and optional behaviors. A test starts at most one.
- **Seed**. A program's starting server state, as an array of JSON:API resource objects.
- **Program store**. The `Store` that holds a program's state for one test while recording. It is
  never the store the application under test uses.
- **Router** and **route handler**. The router maps a method and URL pattern to a handler, which
  reads and writes the program store and returns a response.
- **Behavior**. A per-program, per-route adjustment, such as a delay or an error. The vision also
  says "adjustment" and "augmentation". This RFC says "behavior" only.
- **Override**. A mock declared with the existing helpers in a test that started a program. It
  answers one request in place of the program.
- **Phase 0**. The server and counter fixes in [Phased delivery](#phased-delivery) that programs
  depend on. Each one also helps suites that use no program.

"Program" already means something in holodeck. The server's default export has `launchProgram` and
`endProgram` (`packages/holodeck/server/index.js:7,22`), and the startup banner prints `program:`
and the package name (`server/node.js:387`). There, "program" means the mock server process. This
RFC keeps both function names, because every `diagnostic.js` that launches holodeck calls them
(for example `tests/ember-data__request/diagnostic.js:4-15`) and renaming them breaks those files
for no gain. Phase 1 changes the banner label to `project:`. Documentation calls the process "the
holodeck server" and keeps "program" for HoloPrograms.

### Where things execute

Programs run in the browser test bundle, next to the test. The holodeck server gains no per-test
state and no endpoint.

| Piece | Runs in | Runs when |
| --- | --- | --- |
| `createProgram`, `new Router(...)` | Browser | Module evaluation. Both store thunks only. |
| Router `define` callback | Browser | First program-served request in the bundle, while recording |
| Store factory, seed thunk, `behaviors` callback | Browser | First program-served request of each test, while recording |
| Route handlers, `after` | Browser | Each program-served request, while recording |
| `updateProgram` callback | Browser | The call, while recording. Never in replay. |
| Fixture write | Holodeck server worker | `POST /__record`, as today |
| Serving a fixture from disk | Holodeck server worker | Every request, in both modes, as today |

Three facts decide this. Only the client knows the mode, through `getIsRecording()`
(`src/index.ts:244-259`), while the server routes by path (`server/node.js:138`). Seeds and
handlers need the application's schemas and store, which exist only in its build. The server runs
in a worker (`server/index.js:16`) that receives options by `postMessage` (`server/node.js:265-268`),
so it cannot receive functions. [Server-side programs](#server-side-programs) has the evidence.

The record branch goes into `MockServerHandler.request` (`src/index.ts:277-294`) and the legacy
`installAdapterFor` wrapper (`src/index.ts:431-438`), after `setupHolodeckFetch` assigns the
request number (`src/index.ts:348-352`). The program answers, posts the scaffold to `/__record` at
that request number, awaits that response as `mock()` does today and fails the request if the
server refused the fixture (`src/index.ts:502-514`), then lets the request continue to the server,
which serves the fixture it just wrote from disk. The forwarded request takes the same server path
in both modes. In this RFC, "replay" names the mode CI runs in, not that server step. The diagram
extends the guide's record and replay diagram (#11169, `guides/the-manual/testing/index.md:68-79`).

```
record run                                   replay run
  startProgram(this, usersAndPets)             startProgram(this, usersAndPets)
    stores the program on the test entry         stores the program on the test entry

  store.request(PATCH /api/user/1)             store.request(PATCH /api/user/1)
    MockServerHandler numbers it #0              MockServerHandler numbers it #0
    no override owns #0                          no override owns #0
    boots the program store (first time)         nothing runs
    router matches PATCH /api/user/:id
    handler updates the program store
    POST /__record at #0
    server writes .mock-cache/…
    PATCH /api/user/1?__xTestId=…                PATCH /api/user/1?__xTestId=…
    server reads .mock-cache/…                   server reads .mock-cache/…
    responds from disk                           responds from disk
    after() runs, if a behavior sets one
```

### Entry point

The API ships as a new subpath, `@warp-drive/holodeck/program`, built by tsdown next to `./mock`.
The root specifier resolves to the server under `node`, `bun`, `deno`, and `default`, and to the
client under `browser` and `import` (`packages/holodeck/package.json:69-88`). A subpath leaves the
root client entry unchanged for suites without programs. It follows `./mock`, which already imports
internals from `.` (`src/mock.ts:1`).

### `createProgram`

```ts
import type { Store } from '@warp-drive/core';
import type { ObjectValue } from '@warp-drive/core/types/json/raw';

export interface SeedIdentifier { type: string; id: string }

export interface SeedResource {
  type: string;
  id: string;
  attributes?: ObjectValue;
  relationships?: Record<string, { data?: SeedIdentifier | SeedIdentifier[] | null; links?: ObjectValue; meta?: ObjectValue }>;
  links?: ObjectValue;
  meta?: ObjectValue;
}

export type Seed = SeedResource[];

// Phase 2, for updateProgram
export interface SeedDocument { data: SeedResource | SeedResource[] | null; included?: SeedResource[] }

export interface ProgramDefinition {
  name?: string;
  store: () => Store;
  seed: () => Seed | Promise<Seed>;
  router: Router;
  behaviors?: (r: BehaviorMap) => void; // Phase 2
}

export interface Program { readonly name: string | null } // opaque, see below

export function createProgram(definition: ProgramDefinition): Program;
```

A seed is JSON:API resource objects with ids and no lids, which `store._push({ data })` and
`cache.put` both accept in the prototype. `seed` is a thunk that runs only when a test boots the
program while recording, so a seed loaded with `import()` costs nothing in replay. `store` returns a
fresh `Store` with the application's schemas; `TestStore` in the examples stands for the test
app's store class. `name` is optional and appears only in errors and fixture metadata.
`createProgram` is synchronous and registers nothing. `Program` is opaque: holodeck reads the
definition back through a private `WeakMap`, so nothing in a test file can reach the seed or the
router through the object.

```ts
// tests/json-api/programs/users-and-pets.ts
export const usersAndPets = createProgram({
  name: 'users and pets',
  store: () => new TestStore(),
  seed: async () => (await import('./seeds/users-and-pets.json')).default,
  router,
});
```

### `startProgram` and `updateProgram`

```ts
export function startProgram(context: object, program: Program): void;
export function updateProgram(context: object, update: () => Seed | SeedDocument): Promise<void>;
```

`startProgram` takes a program object, not a registered name. The vision passed a slug,
`'the-big-goodbye_chapter-13'`, that had to resolve to a program named
`'The Big Goodbye | Chapter 13'` (#9616, `holo-programs.md:45,194`). A name needs a registry, code
that fills it, and lazy loading by name. An imported object needs none of that, is typed, and stays
lazy because its seed, store factory, and handlers are thunks.

`startProgram` stores the program on the test's `TEST_IDS` entry and boots nothing, in either mode.
It is synchronous, so a missing `await` cannot race the first request. It throws when the context
has no test id, when the entry already holds a program, and when the test already issued a
request, which any nonzero `test.request` counter shows.

`updateProgram` upserts resources into the program store for the current test. Like a mock's
response function, its callback runs only while recording. It boots the program store first if
needed, so seed and schema errors surface at the call rather than at the next request.

```ts
await updateProgram(this, () => ({ data: { type: 'pet', id: '3', attributes: { name: 'Muffin' } } }));
// every later request that returns pet:3 sees Muffin
```

### Program lifecycle

- `startProgram` adds a `program` field to the entry, whose type is a literal object shape today
  (`src/index.ts:13-128`).
- The first program-served request of a recording test boots the program. Boot calls the store
  factory, awaits the seed, pushes it in one `_join`, runs the router's `define` callback if no
  earlier test has, and then runs the `behaviors` callback, which validates its patterns against
  the routes. Concurrent first requests await one boot.
- `setTestId(this, null)` removes the entry and runs `reportUnrequestedMocks`
  (`src/index.ts:183-188`, added by #11177, the unused-mock check). The program store goes with
  the entry.
  [Override precedence](#override-precedence-and-the-counters) keeps that check correct.

### Router and route handlers

```ts
export type ProgramMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'QUERY';
export type LazyHandler = () => RouteHandler | Promise<RouteHandler>;
export type RouteMap = { [M in ProgramMethod]: (pattern: string, handler: LazyHandler) => void };

export declare class Router { constructor(define: (r: RouteMap) => void) }

export interface RouteHandler {
  request(ctx: ProgramContext, request: Request): HandlerResult | Promise<HandlerResult>;
  protocols?: never; // this member and the next two are reserved for RFC B
  requestProtocol?: never;
  responseProtocol?: never;
}

export interface ProgramContext {
  readonly store: Store;
  readonly params: Readonly<Record<string, string>>;
  readonly query: URLSearchParams;
  readonly body: unknown;
  readonly route: string;
  readonly routeRequestNumber: number; // Phase 2
  find(type: string, id: string): SeedResource | null;
  findAll(type: string): SeedResource[];
  push(resources: SeedResource | Seed): void;
  remove(type: string, id: string): void;
  desiredId(): string | null; // Phase 2
  desiredPatch(): Seed | null; // Phase 2
  commitDesiredPatch(): void; // Phase 2
}

export interface HandlerResult {
  status?: number;
  statusText?: string;
  headers?: Record<string, string>;
  body: ObjectValue | null;
}
```

Each handler is imported the first time a request matches it, the lazy pattern the vision
describes (#9616, `holo-programs.md:147-158`).

```ts
export const router = new Router((r) => {
  r.PATCH('/api/user/:id', async () => (await import('./handlers/user')).PATCH);
});

// ./handlers/user.ts
export const PATCH: RouteHandler = {
  request(ctx) {
    const { data } = ctx.body as { data: SeedResource };
    ctx.push({ ...data, id: ctx.params.id });
    return { body: { data: ctx.find('user', ctx.params.id) } };
  },
};
```

`params` holds the pattern's named groups. `query` holds the search params without `__xTestId` and
`__xTestRequestNumber`. `body` is `JSON.parse` of the request text, or `null`. `route` is the
matched pattern and `routeRequestNumber` is the per-route counter behaviors use. `find`, `findAll`,
`push`, and `remove` work in seed shape, without lids. `push` upserts through the cache, so
attributes and relationships merge into an existing resource the way `store._push` merges them.
`find` returns `cache.peek` for the key with its `lid` stripped. `remove` unloads the record and
does not touch relationships that pointed at it. Holodeck keeps its own index of what it pushed,
because core has no public way to list every resource in a cache (see
[`serializeCache`](#serializecache)). A handler that writes through `ctx.store` directly bypasses
that index, and `findAll` does not see those records. `desiredId`, `desiredPatch`, and
`commitDesiredPatch` expose the `id` and `patch` behaviors.

<!--
DECISION: the push, find, and remove semantics above are a proposed default the prototype did not
settle. Each choice changes fixture bytes: merge or replace on push, peek or a private map on find,
and whether remove also clears inbound relationship references. Confirm or change them.
-->

A handler may be sync or async. It returns one explicit `HandlerResult` shape, not a `Response` or
a bare document, so holodeck never guesses which one it got. Bodies are JSON only, because the
server stores `JSON.stringify(response)` (`server/node.js:149`).

### From a handler result to a scaffold

The program converts each result to the existing `Scaffold` (`src/mock.ts:6-14`):

- `method` is the request method. `url` is the request URL without origin and without holodeck's
  two query params. [Phase 0](#phased-delivery) makes the server normalize it the way replay does.
- `body` is the exact request text, or `null`. A non-string request body fails while recording,
  because only a string produces a matching key (`server/utils.js:78`).
- `status` defaults the way the mock helpers default (`src/mock.ts:59-324`). `GET`, `HEAD`, and
  `QUERY` get `200`. `POST` gets `201` with a body and `204` without. `PUT`, `PATCH`, and `DELETE`
  get `200` with a body and `204` without. A program fixture then matches what a hand-written mock
  would record.
- `statusText` defaults from `STATUS_TEXT_FOR` (`src/mock.ts:84-146`) for every method. Browsers
  see an empty `statusText` over HTTP/2 anyway
  (`tests/ember-data__request/tests/integration/fetch-handler-test.ts:70`), and `Fetch` fills an
  error's `statusText` in from the status code
  (`warp-drive-packages/core/src/request/-private/fetch.ts:277`).
- `headers` pass through. The server defaults `Content-Type` to `application/vnd.api+json` and
  always sets `Content-Encoding`, `Cache-Control`, and `Content-Length` (`server/node.js:150-157`).
- `response` is the result's `body`, or `{}` when it is `null`.

<!--
DECISION: a bodiless mock helper records whatever its response function returned, not `{}`
(`src/mock.ts:163-173`), so this default breaks the "matches a hand-written mock" claim for empty
bodies, and a 204 fixture would carry a `{}` body. Options: record `null` and have the server write
an empty body for it, or keep `{}` and drop the byte-for-byte claim for 204s.
-->

### URL matching

Route patterns are `URLPattern` pathname patterns, native in current browsers, matched against the
request's pathname. Origin is ignored, as fixtures ignore it (`server/utils.js:58-64`). Queries do
not take part in matching, and a handler reads `ctx.query` instead. Explicit mocks keep today's text
matching, where parameter order and encoding count (#11169,
`guides/the-manual/testing/writing-mocks.md:118-134`). A program does not guess the encoded URL,
because it records the URL the request carried.

### The per-test store, isolation, and concurrency

Each test that boots a program gets its own program store on its `TEST_IDS` entry, keyed by the
test context object (`src/index.ts:13`). Diagnostic runs tests concurrently and isolates them by
that object (`packages/diagnostic/README.md:94-98`), so program stores never meet. The prototype
booted two stores, one to build a seed and one program store, in about 3 ms.

Within one test, handlers run one at a time. Without behaviors they run in the order the test
issued the requests. Request numbers are assigned synchronously (`src/index.ts:348-352`), so
concurrent requests get distinct fixture slots. An async handler holds the queue until it settles.
A request with a `requestDelay` joins the queue when its delay ends. The fixed order keeps store
mutations, and therefore fixtures, stable across recordings.

### Override precedence and the counters

The rule a test author needs is short. A mock answers the next request with its method and URL
that no earlier mock owns, and the program answers every other request. The rest of this section
is the mechanics that make that hold in both modes.

Holodeck counts per test today. `test.mock` counts declared mocks per method and the URL string the
test wrote (`src/index.ts:487-492`). `test.request` counts issued requests per method and absolute
URL and sets `__xTestRequestNumber` (`src/index.ts:348-352`). With a program, each request also
needs an owner. The prototype showed the collision. A program recorded `GET officers` request #0.
A later `GET(this, 'officers', ...)` meant for the next request recorded at its own counter, also 0,
overwrote the program's fixture, and request #1 replayed `400 MOCK_NOT_FOUND`. Four rules fix it:

1. Both counters use one normalized URL key. `reportUnrequestedMocks` already compares them through
   `normalizeUrlKey` (`src/index.ts:198-201,221-229`). Phase 0 moves the key into the counters.
2. Request *n* belongs to an override when `n < test.mock[method][key]`. The program skips it. The
   handler does not run, the store does not change, and the per-route counter does not advance.
   This is the vision's "this particular request [will] NOT update any HoloProgram state" (#9616,
   `holo-programs.md:68-73`).
3. Otherwise the program owns request *n* and sets
   `test.mock[method][key] = max(test.mock[method][key], n + 1)`. An override declared afterwards
   lands on the next request.
4. Rules 2 and 3 run synchronously, at the moment `setupHolodeckFetch` assigns the request number,
   before any `requestDelay` or queueing. A mock declared while a delayed or async request is
   still in flight therefore lands after it, instead of claiming the slot that request already
   holds. They run in both modes. In replay the program does not run, but holodeck still assigns
   owners and advances the counter, so the counters come out the same in record and replay.

```ts
startProgram(this, usersAndPets);
await store.request(getUser('1'));                                  // GET #0, program
await PATCH(this, 'api/user/1', () => ({ data: null }), { body }); // override
await store.request(patchUser('1', body));                          // PATCH #0, override
await store.request(patchUser('1', body));                          // PATCH #1, program
```

The override leaves the program store alone, so the second `PATCH` sees the state before the first.
The unused-mock check keeps its meaning. An override no request reached still fails the test from
`afterEach`. Program-served requests raise `test.mock` only up to the request count, so they never
cause a false report.

### Behaviors

```ts
export interface Behavior {
  requestDelay?: number;
  responseDelay?: number;
  error?: { status: number; statusText?: string; headers?: Record<string, string>; body?: ObjectValue };
  after?: (request: Request, store: Store) => void | Promise<void>;
  id?: string;
  patch?: Seed;
}

export type BehaviorMap = { [M in ProgramMethod]: (pattern: string, behavior: Behavior | Behavior[]) => void };
```

```ts
behaviors: (r) => {
  r.GET('/api/pet/:id', { responseDelay: 50 });               // every request
  r.PATCH('/api/user/:id', [{}, { error: { status: 409 } }]); // first succeeds, second conflicts
},
```

An object applies to every program-served request on the route. An array applies one entry per
program-served request, in order, and nothing after the last. The index is
`ctx.routeRequestNumber`, counted per method and pattern. It is not the fixture counter, which is
per URL, and only the fixture counter reaches disk. Boot throws if a behavior names a pattern the
router does not define for that method, or if an `error` status is below 400.

- `requestDelay` waits before the handler runs, while recording. A mutation from another request
  that lands during the wait is visible to the handler.
- `responseDelay` waits after the handler, before the response.
- The fixture stores `delay = requestDelay + responseDelay` in `meta.json`, and Phase 0 makes
  `replayRequest` wait that long. The forwarded request of a recording run is served from disk
  too, so a recording run sleeps both delays in the browser and then waits for their sum again on
  the server. Replay latency matches the behavior.
- `error` replaces the response and skips the handler. `statusText` defaults from
  `STATUS_TEXT_FOR`. The fixture is an ordinary scaffold with that status. Phase 0 fixes 5xx
  fixtures with a body, which break replay today.
- `after` runs once the forwarded request settles, after `await future` in
  `MockServerHandler.request` (`src/index.ts:281-283`), inside the per-test queue. A request issued
  while this one is in flight sees the state before `after` runs. Replay never runs `after`, and
  does not need to.
- `id` is the primary key a handler should mint for a created record, read with `ctx.desiredId()`.
- `patch` is resources a mutation should also upsert, read with `ctx.desiredPatch()` and pushed by
  `ctx.commitDesiredPatch()`. A handler may ignore `id` and `patch`.

The vision's examples use a `{ delay: 50 }` shorthand (#9616, `holo-programs.md:277,285`) that its
type does not declare (`:306,311`). This RFC keeps the two named fields and drops the shorthand.

<!--
DECISION: recording spends every delay twice as written. Options: (a) accept it, delays are small;
(b) skip the browser-side sleeps while recording and let the server wait stand in for both, which
stops `requestDelay` from ordering mutations during recording; (c) send a query param on the
forwarded request that tells the server to skip the wait, which adds API. Pick one and update
unresolved item 28 to match.
-->

### `serializeCache`

```ts
export function serializeCache(store: Store, options?: { mintId?: (type: string, ordinal: number) => string }): Promise<Seed>;
```

```ts
export async function loadUsersAndPets(): Promise<Seed> {
  const store = new TestStore();
  const rey = store.createRecord('pet', { id: '1', name: 'Rey' });
  const pixel = store.createRecord('pet', { name: 'Pixel' }); // no id
  store.createRecord('user', { id: '1', firstName: 'Chris', pets: [rey, pixel] });
  return serializeCache(store);
}
```

It depends on a change in core. The Cache interface specifies
`dump(): Promise<ReadableStream<unknown>>` (`warp-drive-packages/core/src/types/cache.ts:288`), but
`JSONAPICache.dump()` throws `Not Implemented`
(`warp-drive-packages/json-api/src/-private/cache.ts:959-961`), and core has no other public way to
list every resource. This RFC asks core to implement `JSONAPICache.dump()` as a stream of
`cache.peek()` resource objects, which SSR can reuse. If core prefers, the fallback is a public
iterator over resource keys on `store.cacheKeyManager`. Phase 3 waits for one of them.

Holodeck then serializes in two passes. A `createRecord` seed points at id-less records by
`{ id: null, lid }`, and minting ids alone leaves those references dangling. The prototype's program
store rejected such a seed with "Encountered a relationship identifier without an id". Pass one
walks the dump in order and mints an id for each resource without one. Pass two rewrites every
relationship reference from lid to id and drops all lids.

Minted ids are deterministic. The vision used UUID v4 (#9616, `holo-programs.md:255`), which would
change ids in `.mock-cache` on every re-record. The default `mintId` returns
`` `${type}-${ordinal}` ``, where the ordinal counts id-less resources of that type in dump order,
so a deterministic seed function mints the same ids every time. An application that validates id
format passes its own `mintId`. Deleted records are skipped. New records serialize as remote state,
which is the intent of a `createRecord` seed.

### The fixture contract

The directory layout `.mock-cache/<testId>/<METHOD>::<url>::<n>/` (`server/utils.js:87-95`), the
body-hash file names (`server/utils.js:76-81`), and the brotli `.body.br` (`server/utils.js:44-53`)
do not change. New `meta.json` fields are written only when set, so re-recording a suite without
programs still reproduces every committed file byte for byte. Two fields are added:

- `delay`, in milliseconds, when nonzero (Phase 0). Replay waits before responding.
- `program`, the `name` of the program that recorded the fixture. Replay ignores it. It lets
  `git grep '"program":"users and pets"'` find every fixture a program produced.

A changed seed, handler, or behavior does not invalidate fixtures. Programs never run in replay,
and the cache key comes from the request. Local runs record everything, so a test run locally after
the change rewrites its fixtures. The risk is a test nobody ran. Its old fixtures still replay and
pass in CI. The recommended practice after changing a seed or a shared handler is to run the whole
suite locally with `pnpm test`, commit the `.mock-cache` diff with the change, and run
`CI=1 pnpm test` to confirm replay. The `program` field tells a reviewer which fixtures to expect
in the diff.

### Error messages

A test author sees these through the rejected request unless noted:

```
Holodeck: program "users and pets" has no route for GET api/user/1/pets (request #0).
Add the route to the program's Router, or declare an override for this request with
GET(this, 'api/user/1/pets', ...).

This test started program "users and pets". Programs do not run in replay, so every request
the program serves needs a committed fixture. Run the test locally to record it, then commit
.mock-cache.

Holodeck: the route handler for GET /api/user/:id declares "protocols". The members protocols,
requestProtocol, and responseProtocol are reserved for safety protocols, which this version of
holodeck does not run. Remove them.
```

The first is thrown while recording when no route matches, and nothing is recorded. The second is
appended in replay to the `MOCK_NOT_FOUND` detail (`server/node.js:29-42`) that holodeck already
lifts into the error (`src/index.ts:284-293`). The third is thrown while recording, when the handler
is first imported. In addition:

- A handler that throws fails its request with the handler's message, prefixed by
  `Holodeck: the route handler for <pattern> in program <name> threw while recording request #n`.
- A non-string request body, a misused `startProgram`, a bad behavior at boot, and a mock declared
  for an already-served slot (Phase 0) each throw a message naming the cause.

### Reserved extension points for RFC B

This RFC reserves the following and defines nothing else about them:

- The optional `protocols`, `requestProtocol`, and `responseProtocol` members of `RouteHandler`.
  They are typed `never`, so TypeScript rejects them. At runtime a handler that declares one throws
  while recording. Replay never imports a handler, so the type error is the only guard CI has. A
  validation step that silently does nothing is worse than none, because the author believes the
  fixture was checked.
- The name `SafetyProtocols.sanitize`, for the relay-only sanitizing function.
- The server route `/__relay`. Relay will return upstream responses to the browser, which records
  them through `/__record`, so `/__record` stays the only writer of fixtures.

RFC B is expected to type validation on Standard Schema v1, with Valibot as the documented example
and no runtime dependency. RFC B decides it.

### Changes from the vision

Each place this RFC departs from #9616:

- `startProgram` takes an object. `createProgram` is synchronous, returns it, and registers
  nothing. The vision awaited `createProgram` and started programs by name.
- A program has a `store` factory. The vision never said which store a program uses.
- Imports come from `@warp-drive/holodeck/program` and `@warp-drive/holodeck/mock`. The handler is
  `MockServerHandler`, not `HolodeckHandler`.
- Seeds are JSON:API resource objects, not "the configured cache format".
- `serializeCache` is async and mints deterministic ids instead of UUID v4.
- `RouteHandler` compiles. The vision's `keyof ReturnType<this.protocols>`
  (#9616, `holo-programs.md:171-172`) does not. Handlers return one `HandlerResult` shape.
- Behaviors drop the `delay` shorthand. `error.body` is JSON, not a string. `id` is a string.
- Safety protocols and relay move to RFC B, and Valibot as a dependency gives way to Standard
  Schema, decided there.
- Local runs record by default, and the per-mock `RECORD` option, which records one request even
  while the suite replays, is a local-only override (#11177). The vision replayed by default and
  used `RECORD` to author.

### Phased delivery

Each phase ships on its own and ends in a named gate, as in RFC 0001 §6
(`rfcs/0001-warp-drive-transactional-notifications.md:250-275`).

**Phase 0. Server and counter prerequisites.** These fix defects in holodeck today and help
suites without programs.

- (a) Normalize the recorded URL with the function replay uses. Record keys on the scaffold URL as
  written (`server/node.js:140-148`). Replay re-serializes the query through `URLSearchParams`
  (`server/utils.js:58-64`). The prototype recorded `GET::starships?include=crew,ship::0` and the
  replay of that request returned `400`.
- (b) Fix 5xx replay. `replayRequest` drops the body at 500 and above but still sends the recorded
  `Content-Length` and `Content-Encoding` (`server/node.js:55-63`). The prototype's 503 replay
  failed with `ERR_HTTP2_STREAM_ERROR`. Keep the body, or drop both headers.
- (c) Add an optional `delay` to `Scaffold`, write it to `meta.json`, and wait for it in
  `replayRequest`. The helpers take `Partial<Omit<Scaffold, ...>>`, so each gains a `delay` option.
- (d) Key `test.mock` and `test.request` by one normalized URL (rule 1). This reaches suites
  without programs in one case: a test that requests one path from two origins gets one counter
  instead of two. Its fixtures already share a directory (`server/utils.js:58-64`), so the change
  renumbers what already collided (unresolved item 29).
- (e) `mock()` throws `MockError: request #n for <METHOD> <url> was already served` instead of
  recording over a slot a request already used. It compares the two client counters, in both
  modes, so the server stays stateless. A test that declares a mock after the request it was
  meant for already fails today, because that request ran with no fixture and the late fixture
  lands in a slot no later request reads, so no passing test is expected to change.

Gate: record, then replay under `CI=1`, a `GET` with an unencoded comma and brackets in its query,
a `503` with a JSON:API errors body, and a `GET` with `delay: 50` that takes at least 50 ms in
replay. A mock declared after its request fails with the new error. Re-recording every suite leaves
`.mock-cache` unchanged, apart from any directory (d) renumbers.

<!--
DECISION: the last gate sentence is a prediction. Once Phase 0 (d) and (e) exist, re-record the 27
mock declarations under tests/ and replace it with the observed result, naming any renumbered
directory.
-->

**Phase 1. Programs from a JSON seed.** `createProgram`, `startProgram`, `Router`, `RouteHandler`,
`ProgramContext`, scaffold conversion, the per-test store and queue, the record branch in
`MockServerHandler` and `installAdapterFor`, the reserved members, the error messages, the
`program` field, and the banner label. A test that started a program may not declare mocks yet.
`mock()` throws and names Phase 2. The type blocks above ship whole in Phase 1, with the members
marked `Phase 2` present but inert.

<!--
DECISION: "present but inert" is one option. The others are to omit the Phase 2 members from the
Phase 1 types, a type change when Phase 2 lands, or to throw when a program passes `behaviors`
before Phase 2, which is louder but stops a program from being authored ahead of time. Pick one.
-->

Gate: a program-served request records and replays under `CI=1` without importing the handler
module (a module-level flag stays unset). Two tests recording concurrently with different programs
see only their own state. An unmatched route fails with its message.

**Phase 2. Behaviors, `updateProgram`, and overrides.** All six behavior fields, the per-route
counter, queue order for `requestDelay`, `after`, `updateProgram`, and override rules 2 to 4 in
place of the Phase 1 ban.

Gate: a test with a program and an override has the same counters and the same unused-mock result
in record and replay. An array behavior applies per program-served request on its route. `error`
skips the handler. A request issued while another is in flight sees the state before its `after`.

The demo milestone closes Phase 2. It converts the seven `user` mocks in
`tests/json-api/tests/integration/cache/mutation-request-test.ts` and
`did-commit-notification-test.ts` to one `users and pets` program. The bulk create needs `id` and
`patch` for the server-assigned `id1` and `id2` (`mutation-request-test.ts:89-90`). Tests that
exercise one server quirk, such as the sparse and normalized responses at
`did-commit-notification-test.ts:273,306`, keep an override. Gate: the converted tests record
locally and replay under `CI=1` from committed fixtures, and every hand-written `user` response
body the program now computes is gone. The repository has 27 mock declarations under `tests/`
(`git grep -E "await (GET|POST|PUT|PATCH|DELETE|HEAD|mock)\(" tests`), so this proves the design.
It is not a migration.

**Phase 3. `serializeCache`.** `JSONAPICache.dump()` in core with its own tests, then the two-pass
serializer and `mintId` in holodeck.

Gate: a `createRecord` seed with id-less records and relationships to them boots a program store.
Running the seed function twice gives identical seeds, and re-recording a test that uses it leaves
`.mock-cache` unchanged.

Phase 0 precedes Phase 1, because program fixtures need (a) and overrides need (d) and
(e). Phase 2 needs Phase 0 (b) and (c). Phase 3 needs Phase 1 and the core change, and it can run
alongside Phase 2.

### Ecosystem implications

- No lint rule is required, because the types reject reserved members. No deprecations.
- The context argument is any object, as for `setTestId` today, so any test framework works.
- Addons, SSR, Engines, the Inspector, IDE support, and blueprints do not change.

## How we teach this

### Names

"HoloProgram" and "program" stay. The guide introduces a program once as "a Mirage-style scenario
with a real WarpDrive store behind it", then says "program". "Behavior" names per-route
adjustments, "override" names a mock inside a program test, and "fixture" names what lands in
`.mock-cache`. The guide does not borrow other tools' words, such as "cassette" or "scenario", as
holodeck terms.

The server setup page adds one sentence, "`launchProgram` and `endProgram` start and stop the
holodeck server, and are unrelated to HoloPrograms". Every other page says "the holodeck server".

### Guide text

The `holo-programs.md` page on #11169 becomes this when Phase 2 ships. Its "Proposed, not
implemented" banner goes, and its safety-protocol and VCR sections move to RFC B's page.

> A mock answers one request. A program answers every request a test makes, from a store that
> behaves like your API. Use one when a test needs a world rather than a payload. Import it and
> call `startProgram(this, usersAndPets)` at the top of the test.
>
> Programs run only while recording. The program answers, holodeck writes the answer to
> `.mock-cache` like any fixture, and replay serves the fixture. Commit fixtures as you would for
> a mock.
>
> Write the router once and share it across programs. Import each handler lazily so replay never
> loads it. Give each program a seed, a JSON file of resource objects with ids. Add behaviors for
> what a handler should not know, such as a slow endpoint.
>
> **Override one request with the mock helpers.** A `PATCH(this, ...)` in a program test answers
> the next matching request, and that request leaves the program's store untouched.
>
> **Re-record after changing a program.** Fixtures do not know which seed or handler produced
> them. Run the suite locally with `pnpm test`, commit the `.mock-cache` diff, and run
> `CI=1 pnpm test`.

### Pages that change

These pages exist only on #11169 today, so this section assumes it merges first.

- The testing index gains the program step in its record and replay diagram, and its HoloPrograms
  entry stops calling the page a design.
- Writing mocks gains "Override a program for one request".
- Recording and replaying gains "Fixtures a program wrote", with the `program` field and the
  re-record practice.
- Troubleshooting gains the three program errors, indexed by their text.
- Server setup gains the `launchProgram` sentence above.
- Each export of `@warp-drive/holodeck/program` gets TSDoc with an example, and the package README
  links the guide page.
- Phase 3 adds a "Build a seed with `createRecord`" section to the HoloPrograms page, covering
  `serializeCache` and `mintId`.

### Agent skill

Add `warp-drive-packages/memory-alpha/skills/holodeck/use-holoprograms-in-tests.md` and a row for it
in `warp-drive-packages/memory-alpha/skills/index.md`. It covers starting a program, writing a
handler, overriding a request, and re-recording after a change.

## Drawbacks

- Invalidation is manual. After a seed or handler change, fixtures of tests nobody ran locally
  stay stale and CI replays them. The `program` field reduces this but does not remove it.
- Program code never runs in CI. Handlers, seeds, behaviors, `after`, and the reserved-member
  check run only while recording, so a handler that throws or a seed that fails DEBUG validation
  passes CI for as long as its stale fixtures exist. Only a local run catches it.
- Recorded delays add to CI time. Replay waits for every fixture's `delay`, so a suite's replay
  grows by the sum of the delays its behaviors recorded.
- Phase 0 (d) and (e) reach suites without programs. (d) renumbers fixtures a test recorded from
  two origins, and (e) turns a late mock into an error. Both are called out under
  [Phased delivery](#phased-delivery).
- Bundle cost in record mode. Program objects and the router module are in the test bundle.
  Handlers and JSON seeds load through `import()`, so replay never fetches them, but the build
  still compiles them.
- One extra round trip per program-served request while recording, to `/__record`. Replay has none.
- Two counters to reason about. Fixtures count per method and URL, while array behaviors count per
  method and pattern. An author of an array behavior has to know which one applies.
- Inherited matching defects. Without Phase 0, programs would record query URLs replay cannot find,
  and a mock could overwrite a program's fixture. Programs record the request text, so they avoid
  the object-body defect (`src/mock.ts:10`, `server/utils.js:78`), but overrides in a program test
  still hit it.
- Windows paths. A query string puts `?` in a fixture directory name, which Windows cannot check
  out (`server/utils.js:93`). JSON:API URLs often carry `include`, so programs produce more of them.
- Dead fixtures. Nothing prunes or reports orphaned fixture directories (issue #11170, the holodeck
  adoption blockers). A program that changes which requests a screen makes leaves more behind.
- Drift from the real API. Shared handlers imitate a server, and until RFC B nothing checks them
  against the real API. DEBUG cache validation checks resource shape, not endpoint behavior.

## Alternatives

### One RFC instead of two

The vision bundles programs, safety protocols, and relay. Programs work with hand-written seeds and
no real API. Static relay needs no program (#9616, `vcr-style.md:17`). Relay brings credentials,
network egress, sanitized production data in git, and a dependency decision, each contestable on
its own, and the vision's "Adding a Safety Protocol" is an empty code block (#9616,
`holo-programs.md:379-383`). One RFC would hold programs until that design exists. RFC B depends on
this one only for dynamic relay.

### Server-side programs

Programs could live in the server worker, with state per test id, start, update, and end endpoints,
and modules loaded by path. Rejected:

- A `Store` does not load in plain Node. A plain import failed with
  `Cannot find package '@ember/debug'`, and the published `dist` still calls `@embroider/macros`.
  The prototype needed a babel pass with the test app's macro plugins, a stub for `@ember/debug`,
  the app directory as working directory to avoid `unable to locate app`, and one pinned copy of
  core to avoid "Multiple copies of WarpDrive have been detected".
- An Ember app's store service imports `@ember/*`, which does not load in Node at all.
- Worker options cross by structured clone (`server/node.js:265-268`), so `updateProgram` callbacks
  and `after` closures cannot reach the server.
- Isolation would rest on test id hygiene in one shared process instead of object identity.

Its one advantage, fetching real APIs from Node, matters only for relay. RFC B can add `/__relay`
without moving programs.

### A registered-name API

`startProgram(this, 'the-big-goodbye_chapter-13')`, as in the vision. It needs a registry, a module
that fills it before tests run, a slug rule, and lazy loading by name, and a typo fails at run time
instead of in the editor. The `name` field keeps a readable label without the registry.

### Per-test mocks only, or fixture factories

Both keep one mock per request. Factories cut typing, but the test still restates every response
and body string, and mock order still has to match request order.

### Mirage

Mirage's route handlers and ember-cli-mirage scenarios are the closest ancestor
([route handlers](https://miragejs.com/docs/main-concepts/route-handlers/),
[seeding](https://www.ember-cli-mirage.com/versions/v0.4.x/seeding-your-database/)). This RFC
borrows the split between shared handlers and per-situation data. It avoids Mirage's second model
layer ([models](https://miragejs.com/docs/main-concepts/models/)) by using the real store. It also
avoids patching the page's `fetch`. Mirage uses Pretender, whose `fetch` polyfill corrupts binary
responses ([ember-cli-mirage#1915](https://github.com/miragejs/ember-cli-mirage/issues/1915)).
Mirage's last npm release is 0.1.48, from 2023-10-30.

### MSW and @msw/data

MSW's initial handlers plus runtime overrides map onto shared handlers plus in-test overrides
([network behavior overrides](https://mswjs.io/docs/best-practices/network-behavior-overrides/)),
and `once` maps onto array behaviors. Its explicit unhandled-request policy
([listen](https://mswjs.io/docs/api/setup-server/listen/)) is why an unmatched route fails loudly
here. `@msw/data` typing collections on Standard Schema is precedent for RFC B.

This RFC does not adopt MSW's model of recording. MSW keeps recording out of its core, and its
author warns that "a recording of your traffic is not a specification for your API"
([Introducing Source](https://mswjs.io/blog/introducing-source/)). Holodeck is record and replay
first. The direct answer to #9627 is that holodeck does not intercept `fetch`. It answers real HTTP/2
requests from its own process, it commits fixtures per test so tests replay concurrently with no
setup cost, and HoloPrograms build responses from the application's own schemas. None of that
duplicates MSW, so the resourcing concern does not apply. The WarpDrive-aware MSW plugin #9627
suggests would give up committed per-test fixtures.

### Polly.js, the Rails VCR gem, WireMock, and Playwright

Polly is the closest analogue to record and replay with fixtures. Its `order` matcher is holodeck's
per-URL counter, `.times(n)` and `intercept` map onto behaviors and overrides
([configuration](https://raw.githubusercontent.com/Netflix/pollyjs/master/docs/configuration.md)),
and its `beforePersist` hook is where RFC B's sanitizing will sit. This RFC avoids its HAR files and
default header matching, which make recordings sensitive to noise.

A local holodeck run is VCR's `:all` mode and a CI run is `:none`
([record modes](https://raw.githubusercontent.com/vcr/vcr/master/features/record_modes/all.feature)).
This RFC does not borrow `re_record_interval`, because time-based re-recording churns committed
fixtures.

WireMock models state as named scenario states
([stateful behaviour](https://wiremock.org/docs/stateful-behaviour/)). This RFC models state as data
in a store, because named states multiply with every combination a test needs.

Playwright's `routeFromHAR` serves the first match for every identical request, and recording
state-changing POSTs was declined. Both reports were closed as not planned
([#32272](https://github.com/microsoft/playwright/issues/32272),
[#28167](https://github.com/microsoft/playwright/issues/28167)). Holodeck's per-URL counter avoids
the first problem, and programs address the second by computing mutation responses from a store.

## Unresolved questions

Items 1 to 23 are the questions raised against the vision, each marked answered, deferred to RFC
B, or open. Items 24 onward are open points from the design work. Open items should be settled
during the Exploring stage with the Data team.

1. What holodeck offers that MSW cannot (#9627). Answered in
   [Why WarpDrive can do this](#why-warpdrive-can-do-this) and [MSW and @msw/data](#msw-and-msw-data).
2. Which process runs seeds, handlers, the store, and `after`. Answered in
   [Where things execute](#where-things-execute). The browser runs all of them.
3. Entry points. Answered in [Entry point](#entry-point). The subpath is this RFC's pick.
4. Where programs are registered and how names resolve. Answered in
   [`startProgram` and `updateProgram`](#startprogram-and-updateprogram). Nothing is registered.
5. Fixture invalidation. Answered with a manual practice in
   [The fixture contract](#the-fixture-contract). Automatic detection, such as a program hash in
   `meta.json` checked in replay, stays open. Hashing handler source in the browser is not
   reliable, so no mechanism is proposed.
6. Behaviors in replay. Answered in [Behaviors](#behaviors). Delays are recorded as `delay`, and
   errors are ordinary fixtures.
7. Deterministic ids. Answered in [`serializeCache`](#serializecache). Whether the default should
   look like a UUID stays open.
8. Override precedence and request numbering. Answered in
   [Override precedence](#override-precedence-and-the-counters).
9. The `updateProgram` format and the cache format. Answered for JSON:API resource objects. Other
   caches, and cache layouts in #11154, stay open.
10. Isolation. Answered in [The per-test store](#the-per-test-store-isolation-and-concurrency).
11. The handler contract. Answered in [Router and route handlers](#router-and-route-handlers).
12. Router semantics. Answered for params, queries, and unmatched routes. `QUERY` stays open. The
    router accepts it, but the server's CORS list omits it (`server/node.js:308`), no helper exists,
    and a method-override header would force a preflight the server rejects (`server/node.js:307`).
13. Behavior naming and semantics. Answered in [Behaviors](#behaviors).
14. The design of "Adding a Safety Protocol". Deferred to RFC B.
15. Suppressing transforms outside relay. Deferred to RFC B.
16. Where a static-relay protocol comes from. Deferred to RFC B.
17. Valibot as a dependency. Deferred to RFC B, with Standard Schema v1 as the direction.
18. Relay configuration and credentials. Deferred to RFC B.
19. Dynamic relay scope. Deferred to RFC B.
20. Mutation handling and `isMutationRequest`. Deferred to RFC B.
21. Generated program output. Deferred to RFC B.
22. The two meanings of "program". Answered in [Terminology](#terminology).
23. Divergences from #9616. Answered in [Changes from the vision](#changes-from-the-vision).
24. Open. Batching program fixtures to save the extra round trip. Likely not worth an endpoint.
25. Open, for core. Whether `JSONAPICache.dump()` also emits documents, which seeds do not need.
26. Open. Matching on origin, which this RFC ignores because fixtures ignore it.
27. Open. Streaming or non-JSON handler bodies, which the server cannot store today.
28. Delays while recording. This RFC sleeps both delays in the browser, and the server waits for
    their sum again on the forwarded request, so a recording run spends every delay twice. The
    alternatives are in the decision note under [Behaviors](#behaviors).
29. Keying `test.request` by normalized URL (Phase 0 d). Picked here. Two origins with one path
    share a fixture directory today but get two counters. Such tests renumber on re-record.
30. A per-program or per-test `RECORD`. Programs follow `getIsRecording()` only. Open.
31. A mode that records only missing fixtures, like VCR's `:once`, so local runs stop rewriting
    fixtures they did not need. Open, and independent of programs.
32. `launchServer` and `endServer` aliases for the server functions. Open.
33. Querying the program store with AQL (#11087). Open.
34. RFC 0002, the build plugin. Programs run in the browser and need no Node build config. A
    Node-side store, for relay or a seed CLI, would need a Node-runnable core, and the unguarded
    `window?.matchMedia` calls (`warp-drive-packages/core/src/signals/reactivity/internal.ts:395`,
    `warp-drive-packages/core/src/store/-private/debug/utils.ts:175`) would need `typeof window`
    guards. Open.
