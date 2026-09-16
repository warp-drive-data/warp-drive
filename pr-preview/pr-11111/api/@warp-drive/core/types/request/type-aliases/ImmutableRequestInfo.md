---
url: >-
  /pr-preview/pr-11111/api/@warp-drive/core/types/request/type-aliases/ImmutableRequestInfo.md
---

# &#x20;ImmutableRequestInfo\<RT>

```ts
type ImmutableRequestInfo<RT> = Readonly<Omit<RequestInfo<RT>, "controller">> & object;
```

Defined in: [warp-drive-packages/core/src/types/request.ts:701](https://github.com/warp-drive-data/warp-drive/blob/35e6f11f90cd6cbcd7085d46039c7832ce1352f4/warp-drive-packages/core/src/types/request.ts#L701)

Immutable version of [RequestInfo](../interfaces/RequestInfo.md). This is what is passed to handlers.

## Type Declaration

### bodyUsed?

```ts
readonly optional bodyUsed?: boolean;
```

Whether the request body has been read.

### cacheOptions?

```ts
readonly optional cacheOptions?: Readonly<CacheOptions>;
```

see [CacheOptions](../interfaces/CacheOptions.md)

### data?

```ts
readonly optional data?: Readonly<Record<string, unknown>>;
```

see [RequestInfo.data](../interfaces/RequestInfo.md#data)

### headers?

```ts
readonly optional headers?: ImmutableHeaders;
```

see [ImmutableHeaders](../interfaces/ImmutableHeaders.md)

### options?

```ts
readonly optional options?: Readonly<Record<string, unknown>>;
```

see [RequestInfo.options](../interfaces/RequestInfo.md#options)

## Type Parameters

### RT

`RT` = `unknown`
