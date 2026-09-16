---
url: /api/@warp-drive/core/reactive/type-aliases/RequestState.md
---

# &#x20;RequestState\<RT, E>

```ts
type RequestState<RT, E> = 
  | PendingRequest
  | ResolvedRequest<RT>
  | RejectedRequest<RT, E>
| CancelledRequest<RT, E>;
```

Defined in: [warp-drive-packages/core/src/signals/request-state.ts:638](https://github.com/warp-drive-data/warp-drive/blob/3f5536455a585951f2252138f2bb555d8ad844bf/warp-drive-packages/core/src/signals/request-state.ts#L638)

RequestState extends the concept of [PromiseState](PromiseState.md) to provide a reactive
wrapper for a request [Future](../../request/interfaces/Future.md) which allows you write declarative code
around a Future's control flow.

It is useful in both Template and JavaScript contexts, allowing you
to quickly derive behaviors and data from pending, error and success
states.

The key difference between a [Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise) and a Future is that Futures provide
access to a [stream](https://developer.mozilla.org/docs/Web/API/ReadableStream) of their content, the RequestKey of the request (if any)
as well as the ability to attempt to [abort](../../request/interfaces/Future.md#abort) the request.

```ts
interface Future<T> extends Promise<T>> {
  getStream(): Promise<ReadableStream>;
  abort(): void;
  lid: RequestKey | null;
}
```

These additional APIs allow us to craft even richer state experiences.

To get the state of a request, use [getRequestState](../functions/getRequestState.md).

See also:

* PendingRequest
* ResolvedRequest
* RejectedRequest
* CancelledRequest

## Type Parameters

### RT

`RT` = `unknown`

### E

`E` *extends* [`StructuredErrorDocument`](../../types/request/interfaces/StructuredErrorDocument.md) = [`StructuredErrorDocument`](../../types/request/interfaces/StructuredErrorDocument.md)
