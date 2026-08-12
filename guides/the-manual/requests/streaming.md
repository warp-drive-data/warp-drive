# Streaming Requests

"Streaming" a request can mean two different things, and it's worth being precise about which one you need.

- **Progress** - you want to know how much of a response has downloaded so far, e.g. to drive a progress bar. This is handled by [`future.getStream()`](/api/@warp-drive/core/request/interfaces/Future#getstream), covered in [Using The Response](./using-the-response.md), and is a stream of raw bytes.
- **Content** - the response is a sequence of independent, application-meaningful chunks (chat tokens, log lines, incrementally-arriving search results) that you want to react to *as they arrive* rather than waiting for the entire response to finish.

This guide covers the second case: decoding a chunked response and reflecting each chunk into the store's cache as it arrives, so that anything subscribed to that resource re-renders progressively instead of waiting on the full response.

## Decoding a Streamed Response

Most streaming APIs (chat completions, log tails, progress feeds) send their chunks as newline-delimited JSON (["NDJSON"](https://github.com/ndjson/ndjson-spec)) - one JSON value per line. [`streamJsonLines`](/api/@warp-drive/utilities/streaming/functions/streamJsonLines) decodes a response body into an `AsyncGenerator` of parsed values, yielding each as soon as its line arrives.

```ts [decode-example.ts]
import { streamJsonLines } from '@warp-drive/utilities/streaming';

const response = await fetch('/api/assistant/stream');

for await (const event of streamJsonLines(response.body)) {
  // handle each decoded line as it arrives
}
```

Blank lines are skipped automatically, and a line that fails to parse is skipped rather than aborting the whole stream. Pass `onParseError` if you want to observe unparsable lines instead of silently dropping them.

```ts
streamJsonLines(response.body, {
  onParseError: (frame, error) => console.warn('could not parse frame', frame, error),
});
```

If your wire format isn't NDJSON, [`streamFrames`](/api/@warp-drive/utilities/streaming/functions/streamFrames) is the lower-level primitive `streamJsonLines` is built on: it splits a byte stream into text frames on any delimiter you provide, decoding incrementally so a delimiter split across two network chunks (or a multi-byte character split across two chunks) is still handled correctly.

```ts
import { streamFrames } from '@warp-drive/utilities/streaming';

// split on the ASCII Record Separator instead of a newline
for await (const frame of streamFrames(response.body, '\x1e')) {
  // ...
}
```

## Reactively Updating the Store

Decoding the response is half the problem - the other half is turning each decoded chunk into a cache update, so that anything reading that resource sees it grow in place. [`streamIntoResource`](/api/@warp-drive/utilities/streaming/functions/streamIntoResource) does this: it iterates an async source of decoded chunks, folds each into a resource via a `reduce` function you provide, and pushes the result into the store after every chunk.

```ts [stream-into-resource-example.ts]
import { streamJsonLines, streamIntoResource } from '@warp-drive/utilities/streaming';

await streamIntoResource({
  store,
  resource: {
    type: 'conversation',
    id: conversationId,
    attributes: { messages: [], isStreaming: true },
  },
  source: streamJsonLines(response.body),
  reduce: (resource, message) => ({
    ...resource,
    attributes: {
      ...resource.attributes,
      messages: [...resource.attributes.messages, message],
    },
  }),
  onSettled: (resource) => ({
    ...resource,
    attributes: { ...resource.attributes, isStreaming: false },
  }),
});
```

`onSettled` runs once the source is exhausted - including if it throws - so you can clear a loading flag with one final push regardless of how the stream ended.

## A Complete Example

Putting this together, here's a [Handler](./handlers.md) for a chat-style endpoint that streams its response as NDJSON. It resolves immediately with a placeholder resource so the UI can render right away, then streams updates into that same resource in the background as chunks arrive.

:::tabs

== Handler

```ts [handlers/assistant-handler.ts]
import { streamJsonLines, streamIntoResource } from '@warp-drive/utilities/streaming';

export class AssistantHandler {
  async request({ request }) { // [!code focus:24]
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

== Usage

```ts [Ember]
import Component from '@glimmer/component';
import { Request } from '@warp-drive/ember';
import { sendMessage } from '#/data/builders';

export default class Conversation extends Component<{ Args: { conversationId: string } }> {
  <template>
    <Request @query={{sendMessage @conversationId}}>
      <:content as |result|>
        {{#each result.data.messages as |message|}}
          <p>{{message.chunk}}</p>
        {{/each}}
        {{#if result.data.isStreaming}}
          <p class="typing-indicator">...</p>
        {{/if}}
      </:content>
    </Request>
  </template>
}
```

:::

Because the handler pushes to the store directly instead of relying on `RequestManager`'s normal one-shot resolution, every `store.push` above is a separate, immediate notification - components subscribed to the `conversation` resource re-render after each chunk, not just once at the end.

:::tip 💡 TIP
This bypasses the request pipeline's built-in stream currying (`context.setStream`/`future.getStream`, see [Using The Response](./using-the-response.md)), which is designed for a single raw byte stream rather than many independent, already-decoded application chunks. Driving the fetch and the store updates yourself, as above, is the current recommended pattern for reactive content streaming.
:::
