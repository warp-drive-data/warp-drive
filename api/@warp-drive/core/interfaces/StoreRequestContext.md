---
url: /api/@warp-drive/core/interfaces/StoreRequestContext.md
---

# &#x20;StoreRequestContext

Defined in: [warp-drive-packages/core/src/store/-private/cache-handler/handler.ts:49](https://github.com/warp-drive-data/warp-drive/blob/b6590b8852e5d32b32e3eece336d0f892e8b02a5/warp-drive-packages/core/src/store/-private/cache-handler/handler.ts#L49)

The object a [Handler](../request/interfaces/Handler.md) uses to fulfill a request: it provides a
readonly view of the [request](../types/request/interfaces/RequestContext.md#request) and methods
for supplying the [Future](../request/interfaces/Future.md)'s stream and final response.

## Extends

* [`RequestContext`](../types/request/interfaces/RequestContext.md)

## Methods

### setResponse()

```ts
setResponse(response): void;
```

Defined in: [warp-drive-packages/core/src/types/request.ts:782](https://github.com/warp-drive-data/warp-drive/blob/b6590b8852e5d32b32e3eece336d0f892e8b02a5/warp-drive-packages/core/src/types/request.ts#L782)

Supplies the response for the request.

#### Parameters

##### response

| [`Response`](https://developer.mozilla.org/docs/Web/API/Response)
| [`ResponseInfo`](../types/request/interfaces/ResponseInfo.md)
| `null`

#### Returns

`void`

#### Inherited from

[`RequestContext`](../types/request/interfaces/RequestContext.md).[`setResponse`](../types/request/interfaces/RequestContext.md#setresponse)

***

### setStream()

```ts
setStream(stream): void;
```

Defined in: [warp-drive-packages/core/src/types/request.ts:778](https://github.com/warp-drive-data/warp-drive/blob/b6590b8852e5d32b32e3eece336d0f892e8b02a5/warp-drive-packages/core/src/types/request.ts#L778)

Supplies the stream of the response's content, if available, enabling
consumers to monitor download progress via [RequestLoadingState](../reactive/interfaces/RequestLoadingState.md).

#### Parameters

##### stream

| [`ReadableStream`](https://developer.mozilla.org/docs/Web/API/ReadableStream)<`any`>
| [`Promise`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)<
| [`ReadableStream`](https://developer.mozilla.org/docs/Web/API/ReadableStream)<`any`>
| `null`>

#### Returns

`void`

#### Inherited from

[`RequestContext`](../types/request/interfaces/RequestContext.md).[`setStream`](../types/request/interfaces/RequestContext.md#setstream)

## Properties

### id

```ts
id: number;
```

Defined in: [warp-drive-packages/core/src/types/request.ts:772](https://github.com/warp-drive-data/warp-drive/blob/b6590b8852e5d32b32e3eece336d0f892e8b02a5/warp-drive-packages/core/src/types/request.ts#L772)

a unique id for this request

#### Inherited from

[`RequestContext`](../types/request/interfaces/RequestContext.md).[`id`](../types/request/interfaces/RequestContext.md#id)

***

### request

```ts
request: Readonly<Omit<RequestInfo<unknown>, "controller">> & object & object;
```

Defined in: [warp-drive-packages/core/src/store/-private/cache-handler/handler.ts:50](https://github.com/warp-drive-data/warp-drive/blob/b6590b8852e5d32b32e3eece336d0f892e8b02a5/warp-drive-packages/core/src/store/-private/cache-handler/handler.ts#L50)

#### Type Declaration

##### bodyUsed?

```ts
readonly optional bodyUsed?: boolean;
```

Whether the request body has been read.

##### cacheOptions?

```ts
readonly optional cacheOptions?: Readonly<CacheOptions>;
```

see [CacheOptions](../types/request/interfaces/CacheOptions.md)

##### data?

```ts
readonly optional data?: Readonly<Record<string, unknown>>;
```

see [RequestInfo.data](../types/request/interfaces/RequestInfo.md#data)

##### headers?

```ts
readonly optional headers?: ImmutableHeaders;
```

see [ImmutableHeaders](../types/request/interfaces/ImmutableHeaders.md)

##### options?

```ts
readonly optional options?: Readonly<Record<string, unknown>>;
```

see [RequestInfo.options](../types/request/interfaces/RequestInfo.md#options)

#### Type Declaration

##### store

```ts
store: Store;
```

the store instance the request was issued through, used to enable store-aware cache handling.

#### See

[ImmutableRequestInfo](../types/request/type-aliases/ImmutableRequestInfo.md)

#### Overrides

[`RequestContext`](../types/request/interfaces/RequestContext.md).[`request`](../types/request/interfaces/RequestContext.md#request)
