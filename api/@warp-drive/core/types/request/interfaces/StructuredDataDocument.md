---
url: /api/@warp-drive/core/types/request/interfaces/StructuredDataDocument.md
---

# &#x20;StructuredDataDocument\<T>

Defined in: [warp-drive-packages/core/src/types/request.ts:445](https://github.com/warp-drive-data/warp-drive/blob/366068ebc56a664fb2411fcf7b3b351cc19cd54a/warp-drive-packages/core/src/types/request.ts#L445)

When a [Future](../../../request/interfaces/Future.md) resolves, it returns an object
containing the original [request](RequestInfo.md),
the [response](https://developer.mozilla.org/docs/Web/API/Response) set by the handler chain (if any), and
the processed content.

## Type Parameters

### T

`T`

## Properties

### content

```ts
content: T;
```

Defined in: [warp-drive-packages/core/src/types/request.ts:461](https://github.com/warp-drive-data/warp-drive/blob/366068ebc56a664fb2411fcf7b3b351cc19cd54a/warp-drive-packages/core/src/types/request.ts#L461)

the processed content of the response

***

### request

```ts
request: ImmutableRequestInfo;
```

Defined in: [warp-drive-packages/core/src/types/request.ts:453](https://github.com/warp-drive-data/warp-drive/blob/366068ebc56a664fb2411fcf7b3b351cc19cd54a/warp-drive-packages/core/src/types/request.ts#L453)

#### See

[ImmutableRequestInfo](../type-aliases/ImmutableRequestInfo.md)

***

### response

```ts
response: 
  | Response
  | ResponseInfo
  | null;
```

Defined in: [warp-drive-packages/core/src/types/request.ts:457](https://github.com/warp-drive-data/warp-drive/blob/366068ebc56a664fb2411fcf7b3b351cc19cd54a/warp-drive-packages/core/src/types/request.ts#L457)

the response set by the handler chain, if any
