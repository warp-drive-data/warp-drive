---
url: >-
  /warp-drive/pr-preview/pr-11111/api/@warp-drive/core/types/request/type-aliases/CreateRequestOptions.md
---

# &#x20;CreateRequestOptions\<RT, T>

```ts
type CreateRequestOptions<RT, T> = object;
```

Defined in: [warp-drive-packages/core/src/types/request.ts:321](https://github.com/warp-drive-data/warp-drive/blob/998da8d5cb68764b43a8503a38424bc85af654e3/warp-drive-packages/core/src/types/request.ts#L321)

The request shape produced by the `createRecord` request builders, for
use with [Store.request](../../../classes/Store.md#request).

## Type Parameters

### RT

`RT` = `unknown`

### T

`T` = `unknown`

## Properties

### body?

```ts
optional body?: 
  | string
  | BodyInit
  | FormData;
```

Defined in: [warp-drive-packages/core/src/types/request.ts:341](https://github.com/warp-drive-data/warp-drive/blob/998da8d5cb68764b43a8503a38424bc85af654e3/warp-drive-packages/core/src/types/request.ts#L341)

the body to send with the request

***

### data

```ts
data: object;
```

Defined in: [warp-drive-packages/core/src/types/request.ts:345](https://github.com/warp-drive-data/warp-drive/blob/998da8d5cb68764b43a8503a38424bc85af654e3/warp-drive-packages/core/src/types/request.ts#L345)

data for handlers to convert into the request body

#### record

```ts
record: ResourceKey<TypeFromInstanceOrString<T>>;
```

the resource being created

***

### headers

```ts
headers: Headers;
```

Defined in: [warp-drive-packages/core/src/types/request.ts:333](https://github.com/warp-drive-data/warp-drive/blob/998da8d5cb68764b43a8503a38424bc85af654e3/warp-drive-packages/core/src/types/request.ts#L333)

the headers to send with the request

***

### method

```ts
method: "POST";
```

Defined in: [warp-drive-packages/core/src/types/request.ts:329](https://github.com/warp-drive-data/warp-drive/blob/998da8d5cb68764b43a8503a38424bc85af654e3/warp-drive-packages/core/src/types/request.ts#L329)

the HTTP method to use

***

### op

```ts
op: "createRecord";
```

Defined in: [warp-drive-packages/core/src/types/request.ts:337](https://github.com/warp-drive-data/warp-drive/blob/998da8d5cb68764b43a8503a38424bc85af654e3/warp-drive-packages/core/src/types/request.ts#L337)

the name of the request operation

***

### records

```ts
records: [ResourceIdentifierObject<TypeFromInstanceOrString<T>>];
```

Defined in: [warp-drive-packages/core/src/types/request.ts:354](https://github.com/warp-drive-data/warp-drive/blob/998da8d5cb68764b43a8503a38424bc85af654e3/warp-drive-packages/core/src/types/request.ts#L354)

the resource being created

***

### url

```ts
url: string;
```

Defined in: [warp-drive-packages/core/src/types/request.ts:325](https://github.com/warp-drive-data/warp-drive/blob/998da8d5cb68764b43a8503a38424bc85af654e3/warp-drive-packages/core/src/types/request.ts#L325)

the url to request
