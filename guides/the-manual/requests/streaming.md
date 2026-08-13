# Streaming Requests

"Streaming" a request can mean two different things, and it's worth being precise about which one you need.

- **Progress** - you want to know how much of a response has downloaded so far, e.g. to drive a progress bar. This is handled by [`future.getStream()`](/api/@warp-drive/core/request/interfaces/Future#getstream), covered in [Using The Response](./using-the-response.md), and is a stream of raw bytes.
- **Content** - the response is a sequence of independent, application-meaningful chunks (chat tokens, log lines, incrementally-arriving search results) that you want to react to *as they arrive* rather than waiting for the entire response to finish.

This guide covers the second case: decoding a chunked response and reflecting each chunk into the store's cache as it arrives, so that anything subscribed to that resource re-renders progressively instead of waiting on the full response.

## Configuring a Streaming Parser

[`Fetch`](/api/@warp-drive/core/variables/Fetch) decides how to turn a response's text into a value using a [`Parser`](/api/@warp-drive/core/interfaces/Parser). A `Parser` marked `stream: true` may be called once per frame as the response downloads, in addition to the single final call every parser receives for the complete response text.

A built-in `'ndjson'` parser is included for the common case of newline-delimited JSON:

```ts [services/store.ts]
import { Store, RequestManager, Fetch } from '@warp-drive/core';

export default class AppStore extends Store {
  requestManager = new RequestManager()
    .use([
      new Fetch({
        parserType: (request) => (request.headers?.get('Accept')?.includes('ndjson') ? 'ndjson' : 'json'),
      }),
    ]);
}
```

If your wire format isn't newline-delimited, provide your own [`Parser`](/api/@warp-drive/core/interfaces/Parser): set `frameDelimiter` to whatever separates frames, and `parse` to handle both a single frame (`isFull: false`) and the complete accumulated text (`isFull: true`).

```ts [parsers/ccdj.ts]
import type { Parser } from '@warp-drive/core';

export const CCDJ_PARSER: Parser = {
  stream: true,
  frameDelimiter: '\x1e\n',
  parse(chunk, isFull) {
    // isFull: the whole accumulated body - parse it exactly as a non-streaming response would
    if (isFull) return ccdjDeserializer('stream', chunk);
    // one CCDJ record - returns `undefined` until a full resource (an attrs+relations
    // pair) has arrived, then the decoded resource. This buffering state lives inside
    // the parser's own closure.
    return ccdjStreamingDeserializer.next(chunk);
  },
};
```

## Reacting to Chunks as They Arrive

Set `options.onChunk` on a request to be called once per frame, alongside a streaming-capable parser. `onChunk` receives the decoded chunk and the handler [`Context`](/api/@warp-drive/core/request/classes/Context), which carries `store` when the request was issued via `store.request(...)`.

Normalization and cache updates are your responsibility, same as they would be for a non-streaming response - `onChunk` decides what a chunk means and applies it via [`Cache.patch`](/api/@warp-drive/core/types/cache/interfaces/Cache#patch) with a granular [`Operation`](/api/@warp-drive/core/types/cache/operations). [`withChunkHandler`](/api/@warp-drive/core/request/functions/withChunkHandler) types the `chunk` parameter for you - without it, `chunk` is `unknown`, since `options` is an untyped bag shared with other handler-specific configuration.

```ts
import { withChunkHandler } from '@warp-drive/core/request';
import type { Message } from '#/data/types';

options: {
  parserType: 'ndjson',
  onChunk: withChunkHandler<Message>((message, context) => {
    const { store } = context.request;
    const conversationKey = store.cacheKeyManager.getOrCreateRecordIdentifier({
      type: 'conversation',
      id: conversationId,
    });
    const messages = (store.cache.getAttr(conversationKey, 'messages') as Message[] | undefined) ?? [];
    store.cache.patch({ op: 'update', record: conversationKey, field: 'messages', value: [...messages, message] });
  }),
},
```

If the response isn't already {json:api}-shaped, normalize it the same way you would for a non-streaming response: a small, plain function, reused between your streaming and non-streaming code so the mapping logic isn't duplicated.

```ts
interface RawMessageEvent {
  id: number;
  kind: 'text' | 'commentary';
  body: string;
}

function normalizeMessage(raw: RawMessageEvent): Message {
  return { id: String(raw.id), kind: raw.kind, chunk: raw.body };
}

// then, inside onChunk:
onChunk: withChunkHandler<RawMessageEvent>((raw, context) => {
  const message = normalizeMessage(raw);
  // ...
}),
```

:::tip 💡 TIP
Misconfiguring `onChunk` on a request whose parser doesn't declare `stream: true` throws in development, since `onChunk` would otherwise silently never fire.
:::

### Modeling Chunks as Resources

Depending on your data, a stream of chunks might be better modeled as resources rather than a plain array attribute. The `onChunk` mechanics are the same either way - only the [`Operation`](/api/@warp-drive/core/types/cache/operations)s you patch with change.

:::tabs

== Primary Collection

Each chunk is its own top-level resource in the request's own result document:

```ts
onChunk: withChunkHandler<Message>((message, context) => {
  const { store } = context.request;
  const key = store.cacheKeyManager.getOrCreateRecordIdentifier({ type: 'message', id: message.id });
  const requestKey = store.cacheKeyManager.getOrCreateDocumentIdentifier(context.request);

  store.cache.patch([
    { op: 'add', record: key, value: { type: 'message', id: message.id, attributes: message, relationships: {} } },
    ...(requestKey ? [{ op: 'add', record: requestKey, field: 'data', value: key } as const] : []),
  ]);
}),
```

== Related Collection

Each chunk is added to an existing resource's `hasMany` relationship:

```ts
onChunk: withChunkHandler<Message>((message, context) => {
  const { store } = context.request;
  const conversationKey = store.cacheKeyManager.getOrCreateRecordIdentifier({ type: 'conversation', id: conversationId });
  const messageKey = store.cacheKeyManager.getOrCreateRecordIdentifier({ type: 'message', id: message.id });

  store.cache.patch([
    { op: 'add', record: messageKey, value: { type: 'message', id: message.id, attributes: message, relationships: {} } },
    { op: 'add', record: conversationKey, field: 'messages', value: messageKey },
  ]);
}),
```

:::

## A Complete Example

Putting this together: a builder and a streaming `Parser` are all that's needed - no custom `Handler` required.

:::tabs

== Builder

```ts [builders/stream-messages.ts]
import { withChunkHandler, withReactiveResponse } from '@warp-drive/core/request';
import type { Message, Conversation } from '#/data/types';

export function streamMessages(conversationId: string) {
  return withReactiveResponse<Conversation>({
    url: `/api/conversations/${conversationId}/stream`,
    headers: new Headers({ Accept: 'application/x-ndjson' }),
    options: {
      parserType: 'ndjson',
      onChunk: withChunkHandler<Message>((message, context) => {
        const { store } = context.request;
        const conversationKey = store.cacheKeyManager.getOrCreateRecordIdentifier({
          type: 'conversation',
          id: conversationId,
        });
        const messages = (store.cache.getAttr(conversationKey, 'messages') as Message[] | undefined) ?? [];
        store.cache.patch({
          op: 'update',
          record: conversationKey,
          field: 'messages',
          value: [...messages, message],
        });
      }),
    },
  });
}
```

== Usage

```ts [Ember]
import Component from '@glimmer/component';
import { Request } from '@warp-drive/ember';
import { streamMessages } from '#/data/builders';

export default class Conversation extends Component<{ Args: { conversationId: string } }> {
  <template>
    <Request @query={{streamMessages @conversationId}}>
      <:content as |result|>
        {{#each result.data.messages as |message|}}
          <p>{{message.chunk}}</p>
        {{/each}}
      </:content>
    </Request>
  </template>
}
```

:::

Because `onChunk` patches the cache directly as each frame arrives, components subscribed to the `conversation` resource re-render after every chunk - not just once when the request finally resolves.

## Bypassing the Pipeline

Sometimes you need more control than a `Parser` allows - a non-standard auth flow, a data source that isn't plain HTTP, or driving the initial resolved value yourself instead of waiting on the full response. For these cases, [`@warp-drive/utilities/streaming`](/api/@warp-drive/utilities/streaming/) provides the same decoding primitives `Fetch` uses internally, for use in a custom [Handler](./handlers.md) that drives its own `fetch()` call.

[`streamJsonLines`](/api/@warp-drive/utilities/streaming/functions/streamJsonLines) decodes a response body into an `AsyncGenerator` of parsed values:

```ts
import { streamJsonLines } from '@warp-drive/utilities/streaming';

const response = await fetch('/api/assistant/stream');

for await (const event of streamJsonLines(response.body)) {
  // handle each decoded line as it arrives
}
```

[`streamFrames`](/api/@warp-drive/utilities/streaming/functions/streamFrames) is the lower-level primitive `streamJsonLines` is built on, for any delimiter:

```ts
import { streamFrames } from '@warp-drive/utilities/streaming';

for await (const frame of streamFrames(response.body, '\x1e')) {
  // ...
}
```

[`streamIntoResource`](/api/@warp-drive/utilities/streaming/functions/streamIntoResource) folds an async source of decoded chunks into a resource via a `reduce` function, pushing the result to the store after every chunk - useful when a handler wants to resolve immediately with a placeholder and keep updating it in the background:

```ts [handlers/assistant-handler.ts]
import { streamJsonLines, streamIntoResource } from '@warp-drive/utilities/streaming';

export class AssistantHandler {
  async request({ request }) {
    const response = await fetch(request.url, request);
    const conversationId = request.headers?.get('X-Conversation-Id') ?? request.url;

    const existing = request.store.cache.peekRemoteState({ type: 'conversation', id: conversationId });
    const resource = existing ?? {
      type: 'conversation',
      id: conversationId,
      attributes: { messages: [], isStreaming: false },
    };
    resource.attributes.isStreaming = true;
    request.store.push({ data: resource });

    // don't await: the caller gets the placeholder immediately, updates
    // continue to arrive in the background as the stream is read
    void streamIntoResource({
      store: request.store,
      resource,
      source: streamJsonLines(response.body),
      reduce: (resource, message) => ({
        ...resource,
        attributes: { ...resource.attributes, messages: [...resource.attributes.messages, message] },
      }),
      onSettled: (resource) => ({ ...resource, attributes: { ...resource.attributes, isStreaming: false } }),
    });

    return { data: resource };
  }
}
```

`onSettled` runs once the source is exhausted - including if it throws - so you can clear a loading flag with one final push regardless of how the stream ended.

This entirely bypasses the request pipeline's built-in stream currying (`context.setStream`/`future.getStream`, see [Using The Response](./using-the-response.md)), which is designed for a single raw byte stream rather than many independent, already-decoded application chunks. Prefer configuring `Fetch` with `onChunk` (above) unless you specifically need to drive the `fetch()` call, or the initial resolved value, yourself.
