---
url: >-
  /pr-preview/pr-11114/api/@warp-drive/core/types/request/interfaces/RequestContext.md
---

# &#x20;RequestContext

Defined in: [warp-drive-packages/core/src/types/request.ts:764](https://github.com/warp-drive-data/warp-drive/blob/2a894723a738725713417f2a39f20d1a3c698f73/warp-drive-packages/core/src/types/request.ts#L764)

The object a [Handler](../../../request/interfaces/Handler.md) uses to fulfill a request: it provides a
readonly view of the [request](#request) and methods
for supplying the [Future](../../../request/interfaces/Future.md)'s stream and final response.

## Extended by

* [`StoreRequestContext`](../../../interfaces/StoreRequestContext.md)

## Methods

### setResponse()

```ts
setResponse(response): void;
```

Defined in: [warp-drive-packages/core/src/types/request.ts:782](https://github.com/warp-drive-data/warp-drive/blob/2a894723a738725713417f2a39f20d1a3c698f73/warp-drive-packages/core/src/types/request.ts#L782)

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
setStream(stream): void;
```

Defined in: [warp-drive-packages/core/src/types/request.ts:778](https://github.com/warp-drive-data/warp-drive/blob/2a894723a738725713417f2a39f20d1a3c698f73/warp-drive-packages/core/src/types/request.ts#L778)

Supplies the stream of the response's content, if available, enabling
consumers to monitor download progress via [RequestLoadingState](../../../reactive/interfaces/RequestLoadingState.md).

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

Defined in: [warp-drive-packages/core/src/types/request.ts:772](https://github.com/warp-drive-data/warp-drive/blob/2a894723a738725713417f2a39f20d1a3c698f73/warp-drive-packages/core/src/types/request.ts#L772)

a unique id for this request

***

### request

```ts
request: ImmutableRequestInfo;
```

Defined in: [warp-drive-packages/core/src/types/request.ts:768](https://github.com/warp-drive-data/warp-drive/blob/2a894723a738725713417f2a39f20d1a3c698f73/warp-drive-packages/core/src/types/request.ts#L768)

#### See

[ImmutableRequestInfo](../type-aliases/ImmutableRequestInfo.md)
