---
title: Advanced Handlers
description: Retry failed requests from a request handler, tell an abort apart from other errors, and abort only part of a request using the AbortControllers WarpDrive entangles for each handler.
---

# Advanced Handlers

This page covers what a request handler can do when a request fails or is aborted. It assumes
you have written a handler before; [Handlers](./handlers.md) walks through a first one.

The handler contract itself is documented in the API docs:

- [Handler](/api/@warp-drive/core/request/types/Handler) covers the `request` method, the `next`
  function, [handler order](/api/@warp-drive/core/request/types/Handler#handler-order),
  [stream currying](/api/@warp-drive/core/request/types/Handler#stream-currying) and
  [automatic currying of stream and response](/api/@warp-drive/core/request/types/Handler#automatic-currying-of-stream-and-response).
- [RequestContext](/api/@warp-drive/core/types/request/types/RequestContext) covers the `request`
  a handler receives and its `setStream` and `setResponse` methods.
- [Future](/api/@warp-drive/core/request/types/Future) and
  [StructuredDocument](/api/@warp-drive/core/types/request/types/StructuredDocument) cover what
  `next` and `manager.request` return. [Using The Response](./using-the-response.md) explains them
  from the application's side.

## Handling Errors

When a handler later in the chain throws, the error rejects the `next` call of each handler
before it, in reverse order. So each handler can catch errors from the handlers after it and
choose to handle the error, re-throw it or throw a new one.

This handler retries a request that timed out. It checks the request's `signal` first, so a
request the application aborted is never retried.

```ts [retry-handler.ts]
import type { Handler, NextFn } from '@warp-drive/core/request';
import type { RequestContext } from '@warp-drive/core/types/request';

const MAX_RETRIES = 5;

// The Fetch handler rejects with a FetchError whose `status` is the
// response's HTTP status. Choose the errors worth retrying for your API.
function isTimeoutError(e: unknown): boolean {
  const error = e as { isRequestError?: boolean; status?: number };
  return error.isRequestError === true && (error.status === 408 || error.status === 504);
}

export const RetryHandler: Handler = {
  async request<T>(context: RequestContext, next: NextFn<T>) {
    let attempts = 0;

    while (true) {
      attempts++;
      try {
        return await next(context.request);
      } catch (e) {
        // never retry a request that was aborted
        if (context.request.signal?.aborted) throw e;

        if (isTimeoutError(e) && attempts < MAX_RETRIES) {
          continue;
        }
        throw e;
      }
    }
  },
};
```

Register it before the handler that makes the request, so that handler's errors reach it:

```ts
import { RequestManager, Fetch } from '@warp-drive/core';
import { RetryHandler } from './retry-handler';

const manager = new RequestManager().use([RetryHandler, Fetch]);
```

The [FetchError](/api/@warp-drive/core/types/request/types/FetchError) API docs list the other
properties on errors from `Fetch`, such as `statusText` and `code`. The example retries at once;
add a delay between attempts if your API needs one, and retry only requests that are safe to
repeat.

## Handling Abort

Aborting a request rejects the current handler in the chain, and every handler before it can
catch that error just like any other. A handler that needs to tell an abort apart from other
errors should check `context.request.signal.aborted`, or `controller.signal.aborted` if it
supplied its own controller (see below).

A handler can use this to recover from an abort and still proceed. As a best practice, use it
only for necessary cleanup, and re-throw the original `AbortError` when the abort came from
the root controller.

### AbortControllers are Always Present and Always Entangled

The **root controller** is the [AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)
for the whole request: the one passed as `controller` to `manager.request` or `store.request`,
or, if none was, one that ***Warp*Drive** creates. Calling `abort()` on the request's `Future`
aborts it. Its [signal](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal) is on
`context.request.signal` for every handler in the chain, unless an earlier handler supplied its
own controller.

A handler can give the rest of the chain its own controller by passing it as the request's
`controller` when calling `next`, along with its `signal`. ***Warp*Drive** entangles the new
controller with the root controller: if the root controller aborts, so does the new one. The
reverse is not true. Aborting the new controller rejects that `next` call, but the root
controller and the rest of the request keep going, so a handler can abort one part of the
work it does without aborting the whole request.

```ts
import type { Handler, NextFn } from '@warp-drive/core/request';
import type { RequestContext } from '@warp-drive/core/types/request';

export const TimeLimitHandler: Handler = {
  async request<T>(context: RequestContext, next: NextFn<T>) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10_000);

    try {
      return await next(
        Object.assign({}, context.request, { controller, signal: controller.signal })
      );
    } catch (e) {
      // our own signal is the root's (or an earlier handler's);
      // if it aborted, the abort did not come from us, so pass it on
      if (context.request.signal?.aborted) throw e;

      // only our controller aborted: fall back instead of failing
      return next(Object.assign({}, context.request, { url: '/api/fallback' }));
    } finally {
      clearTimeout(timer);
    }
  },
};
```

Pass `signal` as well as `controller`: the request a handler receives already has a `signal`,
and without overriding it the next handler keeps the old one.
