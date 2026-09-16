---
url: /pr-preview/pr-11087/api/@warp-drive/core/request/interfaces/CacheHandler.md
---

# &#x20;CacheHandler

Defined in: [warp-drive-packages/core/src/request/-private/types.ts:270](https://github.com/warp-drive-data/warp-drive/blob/53f90949527307caf1710da014dad97fc5e3ab13/warp-drive-packages/core/src/request/-private/types.ts#L270)

The CacheHandler is identical to other handlers except that it
is allowed to return a value synchronously. This is useful for
features like reducing microtask queueing when de-duping.

A RequestManager may only have one CacheHandler, registered via
`manager.useCache(CacheHandler)`.

## Methods

### request()

```ts
request<T>(context, next): 
  | T
  | Promise<
  | T
  | StructuredDataDocument<T>>
| Future<T>;
```

Defined in: [warp-drive-packages/core/src/request/-private/types.ts:278](https://github.com/warp-drive-data/warp-drive/blob/53f90949527307caf1710da014dad97fc5e3ab13/warp-drive-packages/core/src/request/-private/types.ts#L278)

Method to implement to handle requests. Receives the request
context and a nextFn to call to pass-along the request to
other handlers.

#### Type Parameters

##### T

`T` = `unknown`

#### Parameters

##### context

[`RequestContext`](../../types/request/interfaces/RequestContext.md)

##### next

[`NextFn`](../type-aliases/NextFn.md)<`T`>

#### Returns

| `T`
| [`Promise`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)<
| `T`
| [`StructuredDataDocument`](../../types/request/interfaces/StructuredDataDocument.md)<`T`>>
| [`Future`](Future.md)<`T`>
