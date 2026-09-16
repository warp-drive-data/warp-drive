---
url: /api/@warp-drive/core/types/request/type-aliases/PostQueryRequestOptions.md
---

# &#x20;PostQueryRequestOptions\<RT>

```ts
type PostQueryRequestOptions<RT> = object;
```

Defined in: [warp-drive-packages/core/src/types/request.ts:187](https://github.com/warp-drive-data/warp-drive/blob/cb1ab85858f637f156a9ff4e6ba8896c245d7a2c/warp-drive-packages/core/src/types/request.ts#L187)

The request shape produced by the `postQuery` request builders, for
use with [Store.request](../../../classes/Store.md#request).

## Type Parameters

### RT

`RT` = `unknown`

## Properties

### body?

```ts
optional body?: 
  | string
  | BodyInit
  | FormData;
```

Defined in: [warp-drive-packages/core/src/types/request.ts:203](https://github.com/warp-drive-data/warp-drive/blob/cb1ab85858f637f156a9ff4e6ba8896c245d7a2c/warp-drive-packages/core/src/types/request.ts#L203)

the body to send with the request

***

### cacheOptions

```ts
cacheOptions: CacheOptions & object;
```

Defined in: [warp-drive-packages/core/src/types/request.ts:208](https://github.com/warp-drive-data/warp-drive/blob/cb1ab85858f637f156a9ff4e6ba8896c245d7a2c/warp-drive-packages/core/src/types/request.ts#L208)

see [CacheOptions](../interfaces/CacheOptions.md). A `key` is required since `POST`/`QUERY`
requests otherwise have no cache-safe way to derive one from the url.

#### Type Declaration

##### key

```ts
key: string;
```

a key that uniquely identifies this request

***

### headers

```ts
headers: Headers;
```

Defined in: [warp-drive-packages/core/src/types/request.ts:199](https://github.com/warp-drive-data/warp-drive/blob/cb1ab85858f637f156a9ff4e6ba8896c245d7a2c/warp-drive-packages/core/src/types/request.ts#L199)

the headers to send with the request

***

### method

```ts
method: "POST" | "QUERY";
```

Defined in: [warp-drive-packages/core/src/types/request.ts:195](https://github.com/warp-drive-data/warp-drive/blob/cb1ab85858f637f156a9ff4e6ba8896c245d7a2c/warp-drive-packages/core/src/types/request.ts#L195)

the HTTP method to use

***

### op

```ts
op: "query";
```

Defined in: [warp-drive-packages/core/src/types/request.ts:217](https://github.com/warp-drive-data/warp-drive/blob/cb1ab85858f637f156a9ff4e6ba8896c245d7a2c/warp-drive-packages/core/src/types/request.ts#L217)

the name of the request operation

***

### url

```ts
url: string;
```

Defined in: [warp-drive-packages/core/src/types/request.ts:191](https://github.com/warp-drive-data/warp-drive/blob/cb1ab85858f637f156a9ff4e6ba8896c245d7a2c/warp-drive-packages/core/src/types/request.ts#L191)

the url to request
