- A standalone, drop-in alternative to `@warp-drive/core`'s `Fetch` handler
- Configurable per-handler and per-request response parsing (`json`, `html`, `xml`, `text`, `ndjson`, or your own format)
- For streaming-capable parsers, calls `options.onChunk` once per frame as the response downloads
- Utilities for decoding a streamed response body and folding it into the store

## Install

```sh
pnpm add @warp-drive/experiments
```

## About

`Fetch` behaves identically to `@warp-drive/core`'s `Fetch` for the common
case - use it exactly the same way:

```ts
import { Store, RequestManager } from '@warp-drive/core';
import { Fetch } from '@warp-drive/experiments/fetch';

class AppStore extends Store {
  requestManager = new RequestManager()
    .use([Fetch]);
}
```

### Configurable Parsing

By default, `Fetch` inspects the response's `Content-Type` (falling back to
the request's `Accept` header) to pick a parser: `json`, `html`, `xml`,
`text`, or `ndjson`. Construct `Fetch` with a config to override this, or
set `options.parserType`/`options.parser` on an individual request:

```ts
import { RequestManager } from '@warp-drive/core';
import { Fetch } from '@warp-drive/experiments/fetch';

const manager = new RequestManager()
  .use([
    new Fetch({
      parserType: (request, response) =>
        request.headers?.get('Accept')?.includes('ndjson') ? 'ndjson' : 'json',
    }),
  ]);
```

### Streaming Responses

The response is a sequence of independent, application-meaningful chunks
(chat tokens, log lines, incrementally-arriving search results) that you
want to react to *as they arrive* rather than waiting for the entire
response to finish. Set `options.onChunk` alongside a streaming-capable
parser (`stream: true`, `ndjson` by default):

```ts
import { withChunkHandler } from '@warp-drive/experiments/fetch';
import type { Message } from '#/data/types';

store.request({
  url: '/api/assistant/stream',
  options: {
    parserType: 'ndjson',
    onChunk: withChunkHandler<Message>((message, context) => {
      const { store } = context.request;
      // apply `message` to the cache however makes sense for your data,
      // e.g. via `store.cache.patch(...)`
    }),
  },
});
```

`withChunkHandler` types the `chunk` parameter for you; at runtime it's the
identity function. Without it, `chunk` is `unknown`, since `options` is an
untyped bag shared with other handler-specific configuration.

For a wire format other than NDJSON, provide a `Parser` with its own
`frameDelimiter`:

```ts
import type { Parser } from '@warp-drive/experiments/fetch';

const CCDJ_PARSER: Parser = {
  stream: true,
  frameDelimiter: '\x1e\n',
  parse(chunk, isFull) {
    if (isFull) return ccdjDeserializer('stream', chunk);
    return ccdjStreamingDeserializer.next(chunk);
  },
};

store.request({
  url: '/api/reports/123/rows',
  options: {
    parser: CCDJ_PARSER,
    onChunk: withChunkHandler((resource, context) => {
      // ...
    }),
  },
});
```

Misconfiguring `onChunk` on a request whose parser doesn't declare
`stream: true` throws in development, since `onChunk` would otherwise
silently never fire.

### Decoding Utilities

If you'd rather write your own `Handler` that drives its own `fetch()` call
(e.g. to resolve immediately with a placeholder and stream updates into it
in the background) than configure `Fetch`, the decoding pieces it uses
internally are also exported standalone:

- `streamFrames(body, delimiter?)` - splits a byte stream into text frames
- `streamJsonLines(body, options?)` - decodes NDJSON into parsed values
- `streamIntoResource({ store, resource, source, reduce, onSettled? })` -
  folds an async source of decoded chunks into a resource, pushing it to
  the store after every chunk

```ts
import { streamJsonLines, streamIntoResource } from '@warp-drive/experiments/fetch';

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

`onSettled` runs once the source is exhausted - including if it throws - so
you can clear a loading flag with one final push regardless of how the
stream ended. This approach entirely bypasses the request pipeline's
built-in stream currying (`context.setStream`/`future.getStream`), which is
designed for a single raw byte stream rather than many independent,
already-decoded application chunks - prefer configuring `Fetch` with
`onChunk` unless you specifically need to drive the `fetch()` call, or the
initial resolved value, yourself.

## Known Limitations

This is an early experiment; the following gaps exist today:

- `onChunk` is a single synchronous callback, not a subscribable stream -
  only one consumer per request.
- The `ndjson` default parser assumes each line is a complete JSON value;
  malformed lines throw rather than being skipped (unlike
  `streamJsonLines`, which skips them).
