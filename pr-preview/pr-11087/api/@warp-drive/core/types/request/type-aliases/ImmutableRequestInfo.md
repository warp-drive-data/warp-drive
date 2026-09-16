---
url: >-
  /pr-preview/pr-11087/api/@warp-drive/core/types/request/type-aliases/ImmutableRequestInfo.md
---

# &#x20;ImmutableRequestInfo\<RT>

```ts
type ImmutableRequestInfo<RT> = Readonly<Omit<RequestInfo<RT>, "controller">> & object;
```

Defined in: [warp-drive-packages/core/src/types/request.ts:701](https://github.com/warp-drive-data/warp-drive/blob/53f90949527307caf1710da014dad97fc5e3ab13/warp-drive-packages/core/src/types/request.ts#L701)

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
