- Calls `options.onChunk` once per frame as a streamed response downloads
- Built-in support for newline-delimited JSON (NDJSON); pluggable for other delimited formats
- Passes non-streaming requests through unchanged to the next handler

## Install

```sh
pnpm add @warp-drive/experiments
```

## About

`StreamingFetch` is an opt-in companion to `Fetch` for responses that arrive
as a sequence of independent, application-meaningful chunks (chat tokens,
log lines, incrementally-arriving search results) rather than a single JSON
payload. Register it before `Fetch` in your handler chain:

```ts
import { Store, RequestManager, Fetch } from '@warp-drive/core';
import { StreamingFetch } from '@warp-drive/experiments/streaming-fetch';

class AppStore extends Store {
  requestManager = new RequestManager()
    .use([new StreamingFetch(), Fetch]);
}
```

Requests that don't set `options.onChunk` pass through to `Fetch` unchanged.
Requests that do set it are issued by `StreamingFetch` itself, which reads
the response incrementally, splitting on a delimiter (`'\n'` by default) and
calling `onChunk` with each decoded frame as it arrives:

```ts
import { withChunkHandler } from '@warp-drive/experiments/streaming-fetch';

store.request({
  url: '/api/assistant/stream',
  options: {
    onChunk: withChunkHandler<Message>((message, context) => {
      const { store } = context.request;
      // apply `message` to the cache however makes sense for your data,
      // e.g. via `store.cache.patch(...)`
    }),
  },
});
```

The request still resolves once with a final value, produced from the
complete accumulated response text - by default (NDJSON), an array of every
parsed line.

For a wire format other than NDJSON, provide a `Parser`:

```ts
import type { Parser } from '@warp-drive/experiments/streaming-fetch';

const CCDJ_PARSER: Parser = {
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

## Known Limitations

This is an early experiment; the following gaps exist relative to `Fetch`:

- No Mirage (or other Pretender-based mock) detection - streaming reads are
  always attempted.
- No FastBoot/SSR fallback - relies on a global `fetch`.
- Error responses are surfaced as a plain `Error` with `status`/`statusText`/
  `content` properties, not `Fetch`'s full `AggregateError`/errors-array
  handling.
- `onChunk` is a single synchronous callback, not a subscribable stream -
  only one consumer per request.
