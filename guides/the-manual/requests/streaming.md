# Streaming Requests

"Streaming" a request can mean two different things, and it's worth being precise about which one you need.

- **Progress** - you want to know how much of a response has downloaded so far, e.g. to drive a progress bar. This is handled by [`future.getStream()`](/api/@warp-drive/core/request/interfaces/Future#getstream), covered in [Using The Response](./using-the-response.md), and is a stream of raw bytes. This is a stable, core capability.
- **Content** - the response is a sequence of independent, application-meaningful chunks (chat tokens, log lines, incrementally-arriving search results) that you want to react to *as they arrive* rather than waiting for the entire response to finish.

This guide covers the second case, which today lives entirely in [`@warp-drive/experiments`](https://github.com/warp-drive-data/warp-drive/blob/main/warp-drive-packages/experiments/README.md) - not `@warp-drive/core`'s `Fetch` - while the pattern is proven out. `@warp-drive/experiments` packages are, as the name says, experimental: they may change shape or be removed.

## `@warp-drive/experiments/fetch`

[`Fetch`](https://github.com/warp-drive-data/warp-drive/blob/main/warp-drive-packages/experiments/src/fetch.md) is a standalone, drop-in alternative to core's `Fetch` handler - swap one import for the other and everything works the same:

```ts [services/store.ts]
import { Store, RequestManager } from '@warp-drive/core';
import { Fetch } from '@warp-drive/experiments/fetch'; // [!code focus]

export default class AppStore extends Store {
  requestManager = new RequestManager()
    .use([Fetch]);
}
```

On top of that, it adds two capabilities:

- **Configurable parsing** - per-handler or per-request control over how the response text is parsed (`json`, `html`, `xml`, `text`, `ndjson`, or your own format), instead of always assuming JSON.
- **`options.onChunk`** - for a streaming-capable parser (`ndjson` by default), called once per frame as the response downloads.

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

The request still resolves once with a final value - by default (NDJSON), an array of every parsed line - so anything just `await`ing the request works unchanged; `onChunk` is purely an addition for reacting as chunks arrive.

For a wire format other than NDJSON, or a chunk shape that isn't already {json:api}, or writing your own `Handler` that drives its own `fetch()` call entirely (e.g. to resolve immediately with a placeholder and stream updates into it in the background), see the [full documentation](https://github.com/warp-drive-data/warp-drive/blob/main/warp-drive-packages/experiments/src/fetch.md), which also covers the standalone decoding utilities (`streamFrames`, `streamJsonLines`, `streamIntoResource`) `Fetch` is built on.
