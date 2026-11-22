---
title: Streams
description: Proposes `store.stream()`, a long-lived connection driven by a handler chain whose inbound frames apply to the cache and whose outbound frames carry record commits and raw messages, with a `<Stream>` component beside `<Request>`.
warp-drive-rfc: 10
emberjs-rfc:
emberjs-pr:
emberjs-branch:
sync-hash:
stage: proposed
start-date: 2026-09-22T00:00:00.000Z
release-date:
release-versions:
teams:
  - data
  - typescript
prs:
  accepted:
project-link:
suite:
---

# Streams

## Summary

This RFC introduces **streams**: long-lived, optionally bidirectional connections opened with
`store.stream(request)`. A stream is driven by a **handler chain** shaped like the
`RequestManager` pipeline: every handler is a step a frame passes through on its way in (server
→ cache) or out (client → server). Frames that reach the end of the inbound chain apply to the
Cache through `cache.put` / `cache.patch`; frames a handler consumes on the way never do, which
is how server **commands** are intercepted and acted on. Outbound, `send(record)` is a commit
over the connection using the existing `willCommit` / `didCommit` / `commitWasRejected`
lifecycle, and `emit(frame)` carries anything that is not a record.

For app code: you open a stream with `store.stream(chatStream(id))` or
`<Stream @query={{chatStream id}}>`, read what arrives from its document like any query result,
and call `send(record)` to send one. The chain that drives it is attached by the builder, so a
call site never names one. The design is sized to two concrete use cases — an AI chat and
background uploads and downloads — and names what it leaves for follow-up RFCs.

## Motivation

`RequestManager` models terminal request/response: a `Future` resolves once, the `CacheHandler`
applies data once. Response bodies can already be streamed (`context.setStream`,
`future.getStream`, `RequestLoadingState`), but only inbound and only for the life of one
response.

Two product features do not fit that model:

1. **AI chat.** A user enters a conversation and sees its history as a paginated list. From then
   on they send messages and receive messages over one connection. Assistant replies arrive
   incrementally. The same connection also carries **commands** from the server — "run this
   client-side tool and reply", "navigate" — which are not data to render but instructions to
   act on.
2. **Uploads and downloads.** A transfer starts, the user navigates elsewhere, and the connection
   must stay open until the work is done, with progress visible from any screen — a background
   process the store owns.

Both reduce to the same missing primitives: a connection whose lifecycle outlives one resolution,
an outbound channel, per-message cache application, and a place in the pipeline where a frame
can be acted on without touching the cache. The cache already has the right write primitives;
pagination already renders the history; records already carry an in-flight lifecycle. What is
missing is the transport and orchestration layer that feeds them repeatedly.

## Detailed design

### Terminology

- **Frame**: one message on the connection, in either direction.
- **Chain**: the ordered array of handlers a stream runs through.
- **Transport**: the handler at the end of the chain that owns the socket.
- **Codec**: the handler that turns wire text into frames the cache understands, and back.
- **Handshake**: opening the connection; request-shaped, like a fetch.
- **Command**: a frame the server sends to make the client act, which never reaches the cache.

### Minimal example

```ts
// app/streams.ts
import { WebSocketTransport } from '@warp-drive/core';
import { jsonApiCodec, streamQuery } from '@warp-drive/utilities/json-api';

export const ChatStream = [jsonApiCodec(), WebSocketTransport];
export const chatStream = (chatId: string) =>
  streamQuery<Message>('message', { chatId }, { handlers: ChatStream });
```

```gts
<Stream @query={{chatStream @chatId}}>
  <:content as |live features|>
    {{#each live.data as |message|}}<p>{{message.body}}</p>{{/each}}
    <Composer @send={{features.send}} />
  </:content>
  <:error as |error|>…</:error>
</Stream>
```

```ts
// in Composer
const message = store.createRecord('message', { body, chatId });
await features.send(message);     // optimistic; confirmed when the server echoes its lid
```

Everything below is what makes that work, and what to reach for when it is not enough.

### 1. `store.stream(request)` and chains

```ts
import { StreamManager, StreamCacheHandler, WebSocketTransport } from '@warp-drive/core';
import { jsonApiCodec, streamQuery, streamRecord } from '@warp-drive/utilities/json-api';
import { auth, reconnect, chatCommands, chunkCodec } from './handlers'; // app-written, see §2 and §4

// app/streams.ts — every chain the app uses, as exported constants.
// Array order: cache side first, transport last (§2).
export const DefaultStream = [auth, reconnect(), jsonApiCodec(), WebSocketTransport];
export const ChatStream = [auth, chatCommands, reconnect(), jsonApiCodec(), WebSocketTransport];
export const UploadStream = [auth, chunkCodec(), WebSocketTransport];

// app builders bake the chain in, so call sites never name one
export const chatStream = (chatId: string) =>
  streamQuery<Message>('message', { chatId }, { handlers: ChatStream });
export const uploadStream = (id: string) =>
  streamRecord<Upload>('upload', id, { handlers: UploadStream, streamOptions: { lifetime: 'detached' } });

// app/services/store.ts
store.streamManager = new StreamManager().use(DefaultStream).useCache(StreamCacheHandler);
```

```ts
store.stream(streamQuery<Message>('message', { chatId }));                           // default chain
store.stream(streamQuery<Message>('message', { chatId }, { handlers: ChatStream }));  // this chain
store.stream(chatStream(chatId));                                                    // same, via app builder
store.stream({ url: '/jobs/123/progress' });                                         // no builder: url is enough
```

`use` registers the **default chain**, used by any request that carries no `handlers` key. A
request that does carry one opens with exactly that chain, and **builders are what put it
there** (§5). `handlers` is pipeline configuration riding on the request object, not request
data: the manager removes it before any handler sees the request, and it never affects the
`RequestKey`. The cache handler registered with `useCache` is always position 0 ahead of
whichever chain is in effect. `use` and `useCache` throw once any stream has opened, as
`RequestManager` does.

A chain is **a value you import, not a name you register**. Keeping every chain in one module as
exported constants keeps them inspectable and tree-shakeable, and gives the dedupe check in §6 a
meaningful identity: two openers of the same stream import the same array. Each chain — default
or passed — is validated and frozen at its first use, so a chain constant must not be mutated
after a stream has opened with it. Inline arrays remain the low-level escape hatch for tests and
one-offs.

A stream's lifecycle has two phases, both served by one handler type:

- **Handshake**: request-shaped — url, headers, auth, protocol negotiation. A
  chain-of-responsibility with `next`, for the same reasons it fits `RequestManager`.
- **Data**: two directed frame flows, long-lived — inbound (server → client) and outbound
  (client → server).

### 2. `StreamHandler` — one interface, three optional hooks

```ts
interface StreamHandler {
  /** Handshake. Default: (ctx, next) => next(ctx.request) */
  request?(context: StreamContext, next: NextStreamFn): Promise<Connection>;
  /** Wire → app. Return null to consume the frame here. */
  inbound?(frame: Frame, ctx: FrameContext): Frame | null | Promise<Frame | null>;
  /** App → wire. Same shape. */
  outbound?(frame: Frame, ctx: FrameContext): Frame | null | Promise<Frame | null>;
}

type NextStreamFn = (request: StreamRequestInfo) => Promise<Connection>;

/** The request as handlers see it: an ImmutableRequestInfo whose `store` is always set. */
type StreamRequestInfo = Omit<ImmutableRequestInfo, 'store' | 'op'> & {
  store: Store;                           // only store.stream() opens a stream
  op?: 'streamRecord' | 'streamQuery';    // added to RequestInfo['op'] by this RFC
  streamOptions?: { lifetime?: 'observed' | 'detached'; graceMs?: number };
};

interface StreamContext {
  readonly request: StreamRequestInfo;
  readonly signal: AbortSignal;           // fires on abort (§7)
  readonly controller: AbortController;
  readonly chain: readonly StreamHandler[];   // the chain this stream opened with
  setStatus(status: 'open' | 'reconnecting' | 'resyncing'): void;
}

interface FrameContext {
  readonly request: StreamRequestInfo;
  readonly signal: AbortSignal;
  setStatus(status: 'open' | 'reconnecting' | 'resyncing'): void;
  /** Write an app-format frame outbound, through the hooks transport-side of this handler. */
  emit(frame: Frame): Promise<void>;
}

interface Connection {
  readable: ReadableStream<Frame>;
  writable: WritableStream<Frame>;
  response: ResponseInfo | null;
}
```

`Frame` is `unknown` at the pipeline level: each handler narrows its own input and output, and
agreement between adjacent handlers is a documentation contract, not a compile-time one.

**Direction and ordering** (framework-enforced): frames near the transport are wire-format, near
the cache app-format. `outbound` hooks run in array order; `inbound` hooks run in reverse array
order. For the chain `[auth, chatCommands, reconnect(), jsonApiCodec(), WebSocketTransport]`:

```
cache ──outbound──▶ auth → chatCommands → reconnect → jsonApiCodec → WebSocketTransport ──▶ wire
cache ◀──inbound─── auth ← chatCommands ← reconnect ← jsonApiCodec ← WebSocketTransport ◀── wire
```

So "cache-side of the codec" means *earlier in the array*: `chatCommands` sees frames the codec
has already decoded. Handler authors never touch `ReadableStream` / `WritableStream` plumbing —
the manager lifts hooks into the pipeline once. When a handler defines both `request` and frame
hooks, the hooks apply at that handler's own layer.

Handler archetypes:

| Handler              | `request`                      | `inbound`                          | `outbound`       |
| -------------------- | ------------------------------ | ---------------------------------- | ---------------- |
| Auth                 | inject token                   | —                                  | —                |
| Codec                | —                              | decode wire → app frame            | encode           |
| Commands (§4)        | —                              | act, maybe `emit` a reply, consume | —                |
| Reconnect (§6)       | retry loop, resume, `setStatus`| track `seq`                        | queue while down |
| Transport (terminal) | open socket → `Connection`     | —                                  | —                |

The Reconnect row is why this is one interface rather than separate handshake and frame
registries: cross-cutting concerns need both touch points with shared state, and their position
relative to transforms is semantic — a sequence tracker cache-side of `Reconnect` survives
reconnects, transport-side of it resets per connection.

`ctx.request.store` is how a handler reaches the store and, through its owner, app services —
chain constants are created at module load and cannot inject anything. *(advanced)* A handler
typed against only `{ request }` plus `next`, that returns `next(...)` and touches neither
`setResponse` nor the returned value, is portable between `RequestManager` and `StreamManager`
chains by structural typing; anything else is not.

*(advanced)* Stateful and N:M handlers — debatching one wire frame into many, buffering until a
sequence gap closes, coalescing bursts (§9) — implement
`inboundStream(frames: AsyncIterable<Frame>, ctx)` instead of `inbound` (defining both is an
error). Closure variables hold per-connection state.

### 3. Frames and what reaches the cache

After every inbound hook has run, a frame reaching the cache handler must be one of two shapes:

```ts
type CacheFrame =
  | { type: 'document'; payload: ResourceDocument; seq?: number }  // cache.put: snapshot / resync
  | { type: 'operations'; ops: Operation[]; seq?: number };         // cache.patch: deltas, membership
```

`operations` frames use the existing `Operation` vocabulary (`add` / `update` / `remove` on
resources, documents, relationships, fields; see
[Patching The Cache](/guides/the-manual/mutations/operations.md)). Deltas MUST be
operations, never partial `document` frames — a partial resource in a `put` clobbers untouched
fields. The wire message for "assistant appended text to message 7", through `jsonApiCodec`:

```jsonc
{ "operations": [
  { "op": "update", "record": { "type": "message", "id": "7" }, "field": "body", "value": "Hello, wor" }
] }
```

**Anything else reaching position 0 is terminal**, in development and production alike: the
stream moves to
`error` with a `StructuredErrorDocument`, the connection aborts, every joiner sees it. The same
holds for a well-formed `CacheFrame` whose `put` / `patch` throws. A codec that cannot decode
frame N cannot trust frame N+1's framing; per-frame skip-and-continue is a handler's own choice,
by returning `null`. This is the contract that makes commands work: a frame that is not cache
data **must be consumed by a handler cache-side of the codec**. The cache handler validates
nothing about the builder's expectations; conformance is the chain's job.

**Sequence (`seq`)**: optional, per stream, monotonic. The cache handler drops a frame whose `seq`
is at or below the last applied one, and treats an `add` of a resource the document already
holds as an `update`. This makes at-least-once delivery, reconnect replay overlap, and the brief
double-socket window of a reconnect safe. A server that cannot number frames gets arrival-order
semantics and must not redeliver.

**Client identity echo (`lid`)**: any inbound frame about a resource the client created SHOULD
carry that client's `lid`, echoed verbatim, in every frame referencing it — directed reply or
broadcast. This one rule replaces an acknowledgment concept; see §6. The server MUST also treat
`lid` as an idempotency key for creates over the stream: a send replayed after a reconnect (§6)
must not create a second message.

### 4. Commands

A command is an app-format frame the server sends to make the client *do* something. It is
not cache data and never reaches the cache handler. The codec decodes it into a recognizable
shape (§11: `{ type: 'command', id, name, args }`); a command handler cache-side of the codec acts
on it and returns `null`:

```ts
// app/handlers.ts
import { getOwner } from '@ember/owner';

const isCommand = (f: unknown): f is Command => (f as Command)?.type === 'command';

export const chatCommands: StreamHandler = {
  inbound(frame, ctx) {
    if (!isCommand(frame)) return frame;             // not ours: pass it along
    const { store } = ctx.request;
    switch (frame.name) {
      case 'tool':                                   // the AI asks the client to run a tool
        // long work stays off the pull path (§6); reply carries the server's id for correlation
        void runTool(frame.args).then((result) =>
          ctx.emit({ type: 'command', id: frame.id, name: 'tool-result', args: result })
        );
        break;
      case 'navigate':
        getOwner(store)!.lookup('service:router').transitionTo(frame.args.route);
        break;
    }
    return null;                                     // consumed
  },
};
```

A consumed frame must return promptly: the inbound runner is serial (§6), so an `await` inside
`inbound` stalls every frame behind it — including the assistant's own tokens. `ctx.emit` stays
legal after the hook that called it has returned, and a hook must never `await` its own `emit`
(the transport may be waiting on the readable the hook is blocking). Nothing in `@warp-drive/*`
knows what a command is; the pattern needs only ordering, `ctx.request.store`, and `ctx.emit`.
Client → server commands ("stop generating", typing indicators) go out with `handle.emit` (§6).

### 5. Builders and `op`

Stream requests are plain objects, as request configs are. Hand-written, only `url` is required;
`handlers` and `streamOptions` are optional; everything else below is filled by builders.

Two builders ship beside `findRecord` / `query` in `@warp-drive/utilities/json-api`, deriving
urls through `buildBaseURL` and typing the result the way `RequestSignature` types a request:

```ts
const s = store.stream(streamRecord<Upload>('upload', '42', { handlers }));          // StreamRecordHandle<Upload>
const s = store.stream(streamQuery<Message>('message', { chatId }, { handlers }));   // StreamQueryHandle<Message>
```

Builder output (reference):

```ts
{ url, method: 'GET', op: 'streamRecord', records: [{ type, id }], cacheOptions: { key: `stream:${url}` }, handlers, streamOptions }
{ url, method: 'GET', op: 'streamQuery',  cacheOptions: { key: `stream:${url}` },                        handlers, streamOptions }
```

**A stream never shares a `RequestKey` with a fetch request.** `getOrCreateDocumentIdentifier`
keys a GET by `cacheOptions.key ?? url`, so a stream builder deriving the same path as `query`
would otherwise `put` its first frame over the fetched page. Builders prefix the key with
`stream:`; a hand-written request gets the same prefix from the cache handler when it sets no
`cacheOptions.key`.

`op` has exactly two jobs, both in the cache handler, and neither is envelope validation:

|                     | `streamRecord`                                   | `streamQuery`                                    |
| ------------------- | ------------------------------------------------ | ------------------------------------------------ |
| Document membership | fixed: the builder's `records`                   | from frames: snapshot, then document ops         |
| `send(record)`      | patch of the dirty record                        | commit of a new record: optimistic add + lid echo |

A hand-written request with no `op` behaves as `streamQuery`. Handlers read `ctx.request.op` the
same way `CachePolicy` reads a request's `op` today, when one chain serves several kinds of stream.
A builder therefore has three jobs: derive the url and key, attach the chain, type the handle.
The recommended layout is one app module (§1) that exports the chains *and* thin app builders
wrapping the shipped ones with the chain already set, so a call site, a `<Stream @query>`, and a
test all open the same stream the same way.

Builders do **not** choose transport (that is the chain's, by url scheme — §11) and do **not**
decode frames.

### 6. The cache handler: what app code sees, then how it works

**Inbound.** Each frame applies to the cache as it arrives, strictly in arrival order, one
notification flush per frame. The stream's document is a collection whose `data` is the records
the stream holds. Membership changes only through a `document` frame (replace — reserved for the
initial snapshot and server resyncs) and through `add` / `remove` ops addressed to the document
(`record: { type: '@document' }`, which the cache handler rebinds to the stream's key). Resource
`add` / `update` ops never change membership — a broadcast shared across channels cannot leak
into the wrong collection. A resource `remove` leaves the document, as it leaves every document
today. For `streamRecord`, membership is the builder's `records`.

**Outbound** has one primitive and one convenience:

- `handle.emit(frame)` writes an app-format frame through the outbound hooks to the transport.
  It resolves when the transport has accepted the frame; `WebSocketTransport` honors backpressure
  by waiting for `bufferedAmount` to fall under its high-water mark before accepting the next. It
  rejects on transport write failure, bounded-queue overflow, or after the stream is terminal.
- `handle.send(record, { timeoutMs = 10_000 })` is **commit over the stream**, built on `emit`.
  The record is one from `createRecord` (new) or an edited existing one (dirty):

  1. `cache.willCommit(identifier, null)` — the record enters in-flight state; `isSaving` works
     unchanged. A second `send` of the same record waits for the first to confirm.
  2. For `streamQuery`, an `add` op on field `data` appends the record to the stream's document;
     it renders at once, pending derived from `isNew && isSaving`. This widens
     `AddToDocumentOperation.value` to `ResourceKey` (today `PersistedResourceKey`), and the
     JSON:API cache accepts a new identifier in a document's `data` — a small, compatible
     spec change this RFC carries.
  3. The record serializes with the existing utilities (`serializeResources` for new,
     `serializePatch` for dirty — a full field set, so a replay is safe) into a frame carrying
     `lid`, which is emitted.
  4. Request state tracks the send as a `saveRecord` mutation for the record, settling on
     **confirmation** (below) rather than on flush, so `isSaving` stays truthful.

`await send()` resolves when the frame is accepted by the transport. Confirmation is cache state:

| Inbound frame                          | Tracked `lid`?  | Action                                                               |
| -------------------------------------- | --------------- | -------------------------------------------------------------------- |
| resource carries `lid` this stream sent | yes            | `cache.didCommit` — server id lands on the same identifier           |
| resource carries `lid`                 | no              | normal `put` / `patch` (a fetch-based save, or another stream, owns it) |
| no `lid`                               | —               | normal `put` / `patch`; new identifier if unknown                    |
| `errors` for a tracked `lid`           | yes             | `cache.commitWasRejected` — record keeps its dirt; retry is `send` again |
| nothing within `timeoutMs`             | yes             | `commitWasRejected` with a synthetic timeout error                   |

A directed reply and a broadcast echo are the same frame through the same path, so arrival order
is irrelevant. There is no auto-rollback; a rejected message stays rendered in a failed state
with a retry affordance, matching mutation failure today. `mergeIdentifiers` remains the fallback
for servers that cannot echo lids on broadcasts.

**Before open and during reconnect.** `send` / `emit` while `status` is `connecting` do their
optimistic cache work immediately and queue in the manager, flushing in order at `open`; they
reject with the handshake error if the handshake fails. While `reconnecting`, a Reconnect
handler's outbound hook queues them and replays at resume (safe by the `lid` idempotency rule of
§3); without one, `emit` rejects. The optimistic record stays pending in cache throughout.

**Reconnect contract.** A Reconnect handler owns the retry loop and re-handshakes carrying the
last applied `seq` (SSE's `Last-Event-ID` is the native form; `SSETransport` surfaces it). The
server either replays the gap or answers with a `document` resync frame; while that is pending
the handler reports `resyncing`. A resync is membership-complete only for the stream's own
document: records deleted during the gap that live in other documents must arrive as `remove`
ops, or the handler must invalidate the affected requests itself.

**Keying and application.** The `RequestKey` is assigned synchronously at `store.stream()`,
before the handshake, so the stream backs a `ReactiveDocument` the same way a request does,
`lid` is known at creation, and state (§8) can read what the cache already holds under that key
while the socket connects. The document is never seeded: a stream with no data reads as "no
data", not as an empty collection. Per frame, `@document` ops are rebound to the stream's key,
`{ type, id }` addresses resolve to cache keys, a tracked `lid` resolves to its `ResourceKey`,
and the frame is applied and published as one transaction. A `document` frame is keyed under the
stream's key, as a response to the stream request would be. Any handler failure normalizes to a
`StructuredErrorDocument`, as it does in `RequestManager`. Frames are processed one at a time —
a frame's hooks and cache application finish before the next is pulled — so backpressure follows
for transports that honor pull.

**Connection registry**, per store: `RequestKey → { connection, refcount, policy, chain,
request, sent: Map<lid, ResourceKey> }`. A second `store.stream()` with the same key joins the
live connection. A joiner that passes no `handlers` joins unconditionally; one that passes a
chain whose identity differs from the live one fails a DEBUG assertion, and in production its
chain is ignored. Likewise `streamOptions` beyond `lifetime` come from the first opener.

### 7. Return type and lifetime

```ts
interface FutureStream<T> extends Promise<StreamHandle<T>> {   // resolves at open, rejects on handshake failure
  lid: RequestKey;
  release(reason?: string): void;
  abort(reason?: string): void;
}

interface StreamHandle<T> {
  lid: RequestKey;
  document: ReactiveDataDocument<T[]>;
  emit(frame: Frame): Promise<void>;
  release(reason?: string): void;          // drop this consumer's retain; idempotent
  abort(reason?: string): void;            // hard kill for every consumer; parity with Future.abort
  readonly closed: Promise<CloseInfo>;     // passive; always resolves — CloseInfo.error is set on fatal close
  finished(signal?: AbortSignal): Promise<CloseInfo>;  // retaining; rejects on fatal close; signal drops the retain
  response: ResponseInfo | null;
}
interface StreamRecordHandle<T> extends StreamHandle<T> { record: T; send(record: T, opts?): Promise<void> } // dirty record only
interface StreamQueryHandle<T>  extends StreamHandle<T> { send(record: T, opts?): Promise<void> }            // new or dirty
```

`release`, not `close`: a deduped stream has many handles, and only the last release closes the
connection. `closed` never rejects — a passive promise nobody awaits must not raise
`unhandledrejection` — and `finished()` is the only rejecting surface, because it is explicitly
awaited. Post-open failures surface through state (§8).

**Terminal states.** A stream ends in `closed` (success) or `error`. Success is **not** a socket
close: it is an explicit end frame from the server, or an app-level `status` op the Reconnect
handler recognizes. Every socket close is the Reconnect handler's decision — `1000` after an end
frame is terminal; `1001`, `1006`, `1012`, `1013` reconnect; without a Reconnect handler any
close is terminal, with `clean` reflecting the code. A server restart must not resolve
`finished()` on a half-received upload.

**Lifetime is refcounted** with three holder kinds — a subscription (component mount), an
imperative handle, and a `finished()` token — and one policy per request:

```ts
store.stream({ url: '/uploads/42', streamOptions: { lifetime: 'detached' } });
```

- `observed` (default): alive while refcount > 0; the last release closes after `graceMs`
  (default 1000) so route transitions do not thrash sockets.
- `detached`: the cache handler calls `finished()` itself at open — a floor retain until the
  server ends the stream. Zero observers ≠ close; frames keep merging into cache unobserved.
  Same key, different policies → `detached` wins. `release` never closes a `detached` stream;
  `abort` does.

| Event                                      | Effect                                                              |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `release()` while the handshake is pending | if last retain: aborts the handshake; `FutureStream` rejects        |
| `release()`, then same key within `graceMs` | the close timer is cancelled; the joiner adopts the live connection |
| `release()` on a deduped stream            | drops one retain; nothing else                                      |
| `abort()`                                  | signal fires; transport closes now; pending `emit` / `send` reject; unapplied frames are dropped; every handle's `closed` resolves `{ clean: false }` |
| `finished(signal)` and `signal` fires      | that retain drops; the promise stays pending                        |
| `store.destroy()`                          | iterates the registry and aborts every stream, `detached` included  |

If you render with `<Stream @query>`, the component retains and releases for you; call
`release()` only on a handle you got from `store.stream()` yourself. Use `detached` only for
background work like uploads. Ownership follows creation site, as with `<Request>`: `@query` is
component-owned, `@stream={{handle}}` caller-owned. `store.streamManager.active()` lists live
streams, each with `abort`, for an "in progress" tray or devtools. All of this survives
navigation, not reload; durability across reloads is worker territory (§12).

**Transport contract** (§11): a transport MUST close the socket when its `writable` closes or its
`readable` is cancelled (a release: finish pending writes, close `1000`) and when `signal` fires
(an abort: close immediately, reject pending writes). The manager never aborts to release.

### 8. Reactive state and the `<Stream>` component

`getStreamState(futureStreamOrHandle)` returns a signal-backed `StreamState`. *(advanced)* Reach
for it instead of `<Stream>` from a service or a tray with no template of its own.

```ts
class StreamState<T> {
  status: 'connecting' | 'open' | 'reconnecting' | 'resyncing' | 'closed' | 'error';
  document: ReactiveDataDocument<T[]> | null;   // whatever the cache holds under the key, possibly before open
  hasData: boolean;
  isReconnecting: boolean;
  closeReason: CloseInfo | null;
  error: StructuredErrorDocument | null;
}
```

`@warp-drive/core` ships `FutureStream`, `getStreamState` and `StreamSubscription` (the
refcount owner, the `RequestSubscription` analog); framework packages ship a thin component:

```gts
<Stream @query={{this.liveQuery}}>
  <:connecting />
  <:empty />
  <:content as |doc features|>
    {{#each doc.data as |message|}}…{{/each}}
    {{#if features.isReconnecting}}<Badge>reconnecting…</Badge>{{/if}}
  </:content>
  <:closed as |reason doc| />
  <:error as |error features| />
</Stream>
```

Sources are `@query` (owned), `@stream` (observed), or `@subscription`; the chain comes with the
query. The one divergence from `<Request>`: **degradation must not unmount content** — `content`
is active whenever the document has data, including during the handshake (cached history renders
before the socket opens) and reconnection. Status lives in `features`, extending the
`isRefreshing` precedent. `features` aligns with `ContentFeatures`: `isOnline`, `isHidden`,
`isReconnecting`, `abort`, `reconnect` (the `reload` analog: abort and reopen with the same
query, keeping the cached document), `handle`, `send` and `emit`. `release` is not a feature of
an owned stream — the component owns that. The `error` block yields `retry`. On the server the
component opens nothing.

### 9. Walkthrough: AI chat

```gts
<Paginate @query={{query 'message' (hash chatId=@id)}} @mode="infinite">
  <:content as |history|>{{#each history.data as |message|}}…{{/each}}</:content>
</Paginate>
<Stream @query={{chatStream @id}}>
  <:content as |live features|>
    {{#each (without live.data history.data) as |message|}}…{{/each}}
    <Composer @send={{features.send}} />
  </:content>
</Stream>
```

- **History** is `<Paginate>` over the existing `query` builder — nothing new. Pages are cache
  documents keyed by url; the stream's document is keyed `stream:` (§5), so they never collide.
- **Live tail** is the stream's own document: each inbound message is an `add` op addressed to
  `@document`; `document` frames are reserved for resync. The server sends only what happened
  after open — or the client passes a `since` cursor from page 1 in the handshake, through a
  handler reading `ctx.request`. A message that is both in a page and in the tail is one record
  in the cache but, without the `without` identity filter above, **renders twice** after a
  history refresh. A blessed composition of the two components is a follow-up RFC (§12).
- **Sending** is `send(record)`: the message appears instantly as `isNew && isSaving`, the server
  echoes its `lid`, `didCommit` lands the server id.
- **Assistant replies** stream as `update` ops on the message's `body` with the full-so-far
  value — idempotent and reconnect-safe. At token rate that is one apply-and-flush per token, so
  the codec (or an `inboundStream` handler) coalesces frames per animation frame before they
  reach position 0, keeping the last `update` per field. An `append` op is an unresolved
  question below.
- **Commands** ride the same connection and are consumed by `chatCommands` (§4), including the
  AI's client-side tool calls, answered with `ctx.emit`.

### 10. Walkthrough: uploads and downloads

**Upload** is outbound-heavy and needs no record send. Over the stream it looks like:

```ts
const handle = await store.stream(uploadStream(id));   // detached, UploadStream chain (§1)
let offset = handle.record.bytesReceived ?? 0;         // resume cursor, from the cache
for await (const chunk of file.slice(offset).stream()) {
  await handle.emit({ offset, bytes: chunk });          // backpressure via the transport (§6)
  offset += chunk.byteLength;
}
await handle.emit({ type: 'end' });
```

`chunkCodec` is app-written: it encodes chunks as binary frames. The server reports progress as
`update` ops on the `upload` record — `bytesReceived`, `status` — so any screen renders it from
the cache (`<Stream @query={{uploadStream id}}>` yielding `features.handle.record.bytesReceived`),
and the tray lists it through `active()`. `detached` keeps the connection open after the user
navigates away. A Reconnect handler reads `bytesReceived` before replaying its queue, so chunks
the server already has are not resent. The server's end frame (§7) is what `finished()` awaits.

This is the demonstration, not the recommendation. For bytes, HTTP is the production path —
tus (`HEAD` for the offset, then `PATCH`) or a `fetch` with a streaming body — with the stream
carrying progress only. Durable across reload it is not (§7).

**Download** of a single response body is already covered by `store.request` with
`future.getStream()` and `RequestLoadingState`; this RFC does not replace that. The stream case
is a **server-driven job** — an export being generated — whose progress the server pushes as ops
on a record. Its terminal frame is an `update` op putting a signed `url` on the record; the
client then downloads it with `fetch` + `getStream()`. A handler that receives bytes over the
stream instead must write them to OPFS (`FileSystemWritableFileStream`), never hold them in
memory, and replace each chunk with a progress op so the cache sees progress and never bytes.

What both cases rely on from above: `emit` with transport backpressure, `detached` lifetime,
record-shaped progress in the cache, and the rule that a handler may replace a frame on the way
to the cache.

### 11. Shipped handlers and packaging

- `WebSocketTransport` and `SSETransport` (`@warp-drive/core`, terminal). With both in a chain the
  url scheme picks. Each implements the transport contract (§7), reports the handshake as
  `ResponseInfo`, surfaces close codes and `Last-Event-ID` to a Reconnect handler. SSE is
  inbound-only; `emit` on it rejects.
- `jsonApiCodec()` (`@warp-drive/utilities/json-api`). A JSON message with a top-level
  `operations` array decodes to an `operations` frame; one with `command` to
  `{ type: 'command', id, name, args }`; anything else is a JSON:API document. A top-level `seq`
  is carried onto the frame. Outbound `send` frames encode as a JSON:API document whose resource
  carries `lid`; `emit` frames encode as given.
- `MockTransport`, an imperative faucet for tests and demos:

  ```ts
  const transport = new MockTransport();
  const chain = [jsonApiCodec(), transport];
  await render(<template><Stream @query={{streamQuery 'message' (hash chatId='1') (hash handlers=chain)}}>…</Stream></template>);
  transport.push({ operations: [{ op: 'add', record: { type: '@document' }, field: 'data', value: [{ type: 'message', id: '9' }] }] });
  await settled();                      // renders message 9
  await features.send(store.createRecord('message', { body: 'hi' }));
  transport.sent;                       // the encoded frame, lid included
  transport.push({ data: { type: 'message', id: '10', lid: '@lid:message-1', attributes: { body: 'hi' } } });
  transport.close({ code: 1000 });      // or .error(), .failNextHandshake()
  ```

  Holodeck records the HTTP handshake only; socket frames are mocked through `MockTransport`
  until holodeck grows stream fixtures (§12).

While experimental, primitives ship from `@warp-drive/experiments/streams` and the component from
`@warp-drive/ember/experiments`; `openStream(store, request)` stands in for the method and
`store.streamManager` is the registration point. Before `store.stream()` lands in
`@warp-drive/core` the experiment must cover `send` with confirmation timeout, a Reconnect
handler with `seq` resume, the two transports and codec, the lifecycle table of §7, and holodeck
fixtures.

### 12. Out of scope

Each of these is a follow-up RFC, not part of this one:

- **Composing history and live tail.** The `without` filter in §9 is a convention; a
  `<PaginatedStream>` (or similar) that yields one deduped `data` is what a virtualized list
  will want. Its argument shape and reconnect-without-replay behaviour (refresh history?) are
  that RFC's to settle.
- **One socket, many streams.** v1 opens one connection per `RequestKey`. Phoenix Channels,
  `graphql-ws` and socket.io multiplex topics over one socket; a transport that does the same,
  with the handshake becoming a subscribe frame, is additive but changes what "a connection" is
  in the registry.
- **Shared connections across tabs and durability across reloads**: `DataWorker` /
  `SharedWorker` territory.
- **Holodeck stream mocking**, for testing against real wire formats. Until then socket frames
  are mocked through `MockTransport` (§11).

### Ecosystem implications

- **Lint rules:** a rule analogous to `template-require-request-error-block` should require
  `<:error>` on `<Stream>`.
- **Third-party caches:** `AddToDocumentOperation.value` widens to `ResourceKey` and a document's
  `data` may hold a new identifier (§6); a custom `Cache` must accept both to support `send` on a
  `streamQuery`. Everything else a stream does to the cache goes through the existing `put` /
  `patch` / commit lifecycle.
- **Server-side rendering:** `<Stream>` opens nothing on the server, and `store.stream()` is not
  expected to be called there; cached data under the stream's key renders as it does for any
  request.
- **DevTools / Inspector:** `store.streamManager.active()` is the surface a devtools panel
  ([RFC 3](/rfcs/0003-warp-drive-devtools-extension.md)) would list live streams from, with
  `abort` per entry.
- **TypeScript:** `RequestInfo['op']` gains `'streamRecord' | 'streamQuery'`; the handler, handle,
  state and frame types are exported from the packages that ship them (§11).
- **Framework packages:** each ships its own `<Stream>` over the shared `StreamSubscription`,
  as they do `<Request>`. Blueprints, Engines and IDE support: no changes.

## How we teach this

"A stream is a request that stays open." The manual's requests section gains a page, *Streams*,
that opens with the minimal example and teaches in this order: the builders, beside `findRecord`
/ `query`; `<Stream>`, beside `<Request>`, with its one behavioral difference (content stays
through reconnects); `send(record)` as "save over the stream", in terms of `isNew` / `isSaving`
/ errors; `emit` for everything that is not a record; and handlers last, for integrators, with
the chains-and-builders module as the recommended layout. The
[Real-time Updates](/guides/the-manual/realtime/index.md) guide, which today says WarpDrive does
not open connections for you, gains a pointer to that page as the alternative to hand-rolled
socket glue. API docs ship with the implementation.

Vocabulary stays small: *stream*, *frame*, *handle*, *command*, *lifetime*. "Ack" is deliberately
absent — confirmation is the lid-echo rule.

## Drawbacks

- **A second pipeline.** A manager, handler interface, component, and state class to maintain,
  even with the architectural reuse.
- **Server conventions.** The full experience wants lid echo, `lid` as an idempotency key, and
  `seq` numbering for safe replay; without them the fallbacks are strictly worse.
- **Backpressure is only as good as the socket.** Raw WebSocket exposes only `bufferedAmount`;
  under a firehose the transport buffers in JS regardless of this design.
- **Retains pin connections.** `detached` and `finished()` keep sockets alive by design; a
  misused retain pins a connection until `abort`.
- **Frame errors are shared.** They are terminal for every joiner of a deduped stream: one
  malformed broadcast closes the chat for everyone on it. The alternative — silently skipping —
  hides corruption.
- **Commands are a convention**, not a `@warp-drive` concept; nothing stops an app from placing
  the command handler transport-side of the codec, where it sees undecoded text.

## Alternatives

- **Overload `RequestManager` with `op: 'stream'`**: `Future`'s resolve-once contract and the
  auto-currying rules fight the long-lived model. Rejected in favor of a separate manager with
  the same architecture; request-decorating handlers are shared structurally.
- **Two handler registries** (handshake vs frame transforms): rejected — cross-cutting handlers
  span both, and ordering between them is semantic.
- **Chains registered by name** on the manager: rejected — a name is one more registry to keep in
  sync; an imported constant is inspectable, tree-shakeable, and identity-comparable.
- **The chain as a second argument to `store.stream()`**: rejected — it splits "what to open"
  from "how" across two call-site values that must always travel together, and leaves
  `<Stream @query>` needing a second arg. Builders own both.
- **A first-class command frame type in the cache handler**: rejected for v1 — a handler already
  expresses it with no new surface, and the chain keeps commands ordered relative to codecs and
  reconnect.
- **A dedicated acknowledgment frame**: rejected for the lid-echo rule.
- **Doing nothing**: apps hand-roll socket-to-store glue, each reinventing identity
  reconciliation, optimistic sends, reconnect and merging, usually bypassing the cache.

Prior art: Netty `ChannelPipeline` for the one-list, direction-tagged pipeline; Phoenix Channels
for `ref`-correlated replies and rejoin; SSE `Last-Event-ID` and socket.io connection-state
recovery for bounded resume; Relay's `ConnectionHandler` and Replicache-style sync engines for
op-based merge into a normalized cache; WHATWG `WebSocketStream` for the dual-promise lifecycle.
Of those, multiplexed topics over one socket is what §12 still lacks.

## Unresolved questions

- **`append` and `increment` operations.** Token streaming and counters are expressible as
  full-value `update` ops today; every LLM provider ships deltas, and dedicated ops with `seq`
  would cut payload and avoid races with local edits, but grow the `Operation` spec.
- **Typed frames.** `Frame = unknown` leaves `emit` untyped. `StreamHandler<In, Out>` and a
  handle generic supplied by the builder are the obvious shape; deferred until chains are stable.
- **Ephemeral state.** Presence, typing indicators and cursors are neither cache data nor a
  command to act once on. They fit a command handler writing to a signal, but have no home in
  `@warp-drive/*` yet.
- **Mid-stream auth refresh and visibility.** A handler can re-handshake with a fresh token; pause
  on hidden is undecided between a lifetime policy and a Reconnect-handler concern.
- **Async `outbound` hooks.** `WritableStream` handles backpressure mechanically; the contract
  should state it.
- **Handler lifecycle hooks** beyond `setStatus` (`opened` / `closed` / `error`): deferred until
  a concrete need.
- **Naming.** `FutureStream` vs `StreamFuture`; `streamQuery` vs `streamCollection`; `emit` vs
  `write`; `finished()` vs `hold()`; `inboundStream` vs a detected generator form.
