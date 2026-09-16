---
url: /api/@warp-drive/core/types/request/type-aliases/QueryRequestOptions.md
---

# &#x20;QueryRequestOptions\<RT>

```ts
type QueryRequestOptions<RT> = object;
```

Defined in: [warp-drive-packages/core/src/types/request.ts:156](https://github.com/warp-drive-data/warp-drive/blob/b6590b8852e5d32b32e3eece336d0f892e8b02a5/warp-drive-packages/core/src/types/request.ts#L156)

The request shape produced by the `query` request builders, for
use with [Store.request](../../../classes/Store.md#request).

## Type Parameters

### RT

`RT` = `unknown`

## Properties

### cacheOptions?

```ts
optional cacheOptions?: CacheOptions;
```

Defined in: [warp-drive-packages/core/src/types/request.ts:172](https://github.com/warp-drive-data/warp-drive/blob/b6590b8852e5d32b32e3eece336d0f892e8b02a5/warp-drive-packages/core/src/types/request.ts#L172)

see [CacheOptions](../interfaces/CacheOptions.md)

***

### headers

```ts
headers: Headers;
```

Defined in: [warp-drive-packages/core/src/types/request.ts:168](https://github.com/warp-drive-data/warp-drive/blob/b6590b8852e5d32b32e3eece336d0f892e8b02a5/warp-drive-packages/core/src/types/request.ts#L168)

the headers to send with the request

***

### method

```ts
method: "GET";
```

Defined in: [warp-drive-packages/core/src/types/request.ts:164](https://github.com/warp-drive-data/warp-drive/blob/b6590b8852e5d32b32e3eece336d0f892e8b02a5/warp-drive-packages/core/src/types/request.ts#L164)

the HTTP method to use

***

### op

```ts
op: "query";
```

Defined in: [warp-drive-packages/core/src/types/request.ts:176](https://github.com/warp-drive-data/warp-drive/blob/b6590b8852e5d32b32e3eece336d0f892e8b02a5/warp-drive-packages/core/src/types/request.ts#L176)

the name of the request operation

***

### url

```ts
url: string;
```

Defined in: [warp-drive-packages/core/src/types/request.ts:160](https://github.com/warp-drive-data/warp-drive/blob/b6590b8852e5d32b32e3eece336d0f892e8b02a5/warp-drive-packages/core/src/types/request.ts#L160)

the url to request
