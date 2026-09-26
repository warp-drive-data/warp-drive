---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11304/api/@warp-drive/core/types/request/types/RequestContext.md
description: >-
  Object passed to each request handler with the immutable request, a request
  id, and methods for setting the response stream and the response.
---

# &#x20;RequestContext

```ts
interface RequestContext {
  id: number;
  request: ImmutableRequestInfo;
  setResponse(response: 
  | Response
  | ResponseInfo
  | null): void;
  setStream(stream: 
  | ReadableStream<any>
  | Promise<
  | ReadableStream<any>
  | null>): void;
}
```

Defined in: [warp-drive-packages/core/src/types/request.ts:837](https://github.com/warp-drive-data/warp-drive/blob/a8e76e05e678824546f3f515148f84c7c7a01366/warp-drive-packages/core/src/types/request.ts#L837)

The object a [Handler](../../../request/types/Handler.md) uses to fulfill a request: it provides a
readonly view of the [request](#request) and methods
for supplying the [Future](../../../request/types/Future.md)'s stream and final response.

## Extended by

* [`StoreRequestContext`](../../StoreRequestContext.md)

## Methods

### setResponse()

```ts
setResponse(response: 
  | Response
  | ResponseInfo
  | null): void;
```

Defined in: [warp-drive-packages/core/src/types/request.ts:855](https://github.com/warp-drive-data/warp-drive/blob/a8e76e05e678824546f3f515148f84c7c7a01366/warp-drive-packages/core/src/types/request.ts#L855)

Supplies the response for the request.

#### Parameters

##### response

| [`Response`](https://developer.mozilla.org/docs/Web/API/Response)
| [`ResponseInfo`](ResponseInfo.md)
| `null`

#### Returns

`void`

***

### setStream()

```ts
setStream(stream: 
  | ReadableStream<any>
  | Promise<
  | ReadableStream<any>
  | null>): void;
```

Defined in: [warp-drive-packages/core/src/types/request.ts:851](https://github.com/warp-drive-data/warp-drive/blob/a8e76e05e678824546f3f515148f84c7c7a01366/warp-drive-packages/core/src/types/request.ts#L851)

Supplies the stream of the response's content, if available, enabling
consumers to monitor download progress via [RequestLoadingState](../../../reactive/types/RequestLoadingState.md).

#### Parameters

##### stream

| [`ReadableStream`](https://developer.mozilla.org/docs/Web/API/ReadableStream)<`any`>
| [`Promise`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)<
| [`ReadableStream`](https://developer.mozilla.org/docs/Web/API/ReadableStream)<`any`>
| `null`>

#### Returns

`void`

## Properties

### id

```ts
id: number;
```

Defined in: [warp-drive-packages/core/src/types/request.ts:845](https://github.com/warp-drive-data/warp-drive/blob/a8e76e05e678824546f3f515148f84c7c7a01366/warp-drive-packages/core/src/types/request.ts#L845)

a unique id for this request

***

### request

```ts
request: ImmutableRequestInfo;
```

Defined in: [warp-drive-packages/core/src/types/request.ts:841](https://github.com/warp-drive-data/warp-drive/blob/a8e76e05e678824546f3f515148f84c7c7a01366/warp-drive-packages/core/src/types/request.ts#L841)

#### See

[ImmutableRequestInfo](ImmutableRequestInfo.md)
