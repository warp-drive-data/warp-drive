---
title: Advanced Handlers
description: Retry failed requests from a request handler, and handle aborts using the AbortControllers that WarpDrive creates and entangles for each handler in the chain.
draft: true
---

# Advanced Handlers

This page covers what a request handler can do when a request fails or is aborted. It assumes
you have written a handler before; [Handlers](./handlers.md) walks through a first one.

The handler contract itself is documented in the API docs:

- [Handler](/api/@warp-drive/core/request/types/Handler) covers the `request` method, the `next`
  function, handler order, [stream currying](/api/@warp-drive/core/request/types/Handler#stream-currying)
  and [automatic currying of stream and response](/api/@warp-drive/core/request/types/Handler#automatic-currying-of-stream-and-response).
- [RequestContext](/api/@warp-drive/core/types/request/types/RequestContext) covers the `request`
  a handler receives and its `setStream` and `setResponse` methods.
- [Future](/api/@warp-drive/core/request/types/Future) and
  [StructuredDocument](/api/@warp-drive/core/types/request/types/StructuredDocument) cover what
  `next` and `manager.request` return. [Using The Response](./using-the-response.md) explains them
  from the application's side.

## Handling Errors

Each handler in the chain can catch errors from upstream and choose to
either handle the error, re-throw the error, or throw a new error.

```ts
import type { Handler, NextFn } from '@warp-drive/core/request';
import type { RequestContext } from '@warp-drive/core/types/request';

const MAX_RETRIES = 5;
const RetryHandler: Handler = {
  async request<T>(context: RequestContext, next: NextFn<T>) {
    let attempts = 0;

    while (attempts < MAX_RETRIES) {
      attempts++;
      try {
        const response = await next(context.request);
        return response;
      } catch (e) {
        // isTimeoutError is your own check for the errors worth retrying
        if (isTimeoutError(e) && attempts < MAX_RETRIES) {
          // retry request
          continue;
        }
        // rethrow if it is not a timeout error
        throw e;
      }
    }
  }
}
```

## Handling Abort

Aborting a request will reject the current handler in the chain. However,
every handler can potentially catch this error. If your handler needs to
separate AbortError from other Error types, it is recommended to check
`context.request.signal.aborted` (or if a custom controller was supplied `controller.signal.aborted`).

In this manner it is possible for a request to recover from an abort and
still proceed; however, as a best practice this should be used for necessary
cleanup only and the original AbortError re-thrown if the abort signal comes
from the root controller.

### AbortControllers are Always Present and Always Entangled

If the initial request does not supply an [AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController), one will be generated.

The [signal](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal) for this controller is automatically added to the request passed into the first handler.

Each handler has the option to supply a new controller as the request's `controller` when calling `next`.
If a new controller is provided it will be automatically entangled with the root controller.
If the root controller aborts, so will any entangled controllers.

If an entangled controller aborts, the root controller will not abort.
This allows for advanced request-flow scenarios to abort subsections of the request tree without aborting the entire request.
