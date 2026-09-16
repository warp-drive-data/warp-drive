---
url: >-
  /pr-preview/pr-11117/api/@warp-drive/core/types/request/types/ImmutableRequestInfo.md
---

# &#x20;ImmutableRequestInfo\<RT = `unknown`>

```ts
type ImmutableRequestInfo<RT = unknown> = Readonly<Omit<RequestInfo<RT>, "controller">> & {
  bodyUsed?: boolean;
  cacheOptions?: Readonly<CacheOptions>;
  data?: Readonly<Record<string, unknown>>;
  headers?: ImmutableHeaders;
  options?: Readonly<Record<string, unknown>>;
};
```

Defined in: [warp-drive-packages/core/src/types/request.ts:701](https://github.com/warp-drive-data/warp-drive/blob/efe23be24be92441a465081c00eff01e7e2cc0e8/warp-drive-packages/core/src/types/request.ts#L701)

Immutable version of [RequestInfo](RequestInfo.md). This is what is passed to handlers.

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

see [CacheOptions](CacheOptions.md)

### data?

```ts
readonly optional data?: Readonly<Record<string, unknown>>;
```

see [RequestInfo.data](RequestInfo.md#data)

### headers?

```ts
readonly optional headers?: ImmutableHeaders;
```

see [ImmutableHeaders](ImmutableHeaders.md)

### options?

```ts
readonly optional options?: Readonly<Record<string, unknown>>;
```

see [RequestInfo.options](RequestInfo.md#options)

## Type Parameters

### RT

`RT` = `unknown`
