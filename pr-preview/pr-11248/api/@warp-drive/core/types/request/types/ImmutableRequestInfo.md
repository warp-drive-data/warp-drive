---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11248/api/@warp-drive/core/types/request/types/ImmutableRequestInfo.md
description: >-
  Read-only form of a request as handlers receive it, with frozen headers, data,
  options, and cache options and no `controller`.
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

Defined in: [warp-drive-packages/core/src/types/request.ts:774](https://github.com/warp-drive-data/warp-drive/blob/1045f539093e777fe19711f816806b8d4dc6b96f/warp-drive-packages/core/src/types/request.ts#L774)

Immutable version of [RequestInfo](RequestInfo.md). This is what is passed to handlers.

## Type Parameters

### RT

`RT` = `unknown`

## Type Declaration

### bodyUsed?

```ts
readonly bodyUsed?: boolean;
```

Whether the request body has been read.

### cacheOptions?

```ts
readonly cacheOptions?: Readonly<CacheOptions>;
```

see [CacheOptions](CacheOptions.md)

### data?

```ts
readonly data?: Readonly<Record<string, unknown>>;
```

see [RequestInfo.data](RequestInfo.md#data)

### headers?

```ts
readonly headers?: ImmutableHeaders;
```

see [ImmutableHeaders](ImmutableHeaders.md)

### options?

```ts
readonly options?: Readonly<Record<string, unknown>>;
```

see [RequestInfo.options](RequestInfo.md#options)
