---
url: /api/@warp-drive/core/reactive/type-aliases/ReactiveDataDocument.md
---

# &#x20;ReactiveDataDocument\<T, M, E, EM>

```ts
type ReactiveDataDocument<T, M, E, EM> = ReactiveDocumentBase<T, M, E, EM> & DocumentMeta<M> & object;
```

Defined in: [warp-drive-packages/core/src/reactive/-private/document.ts:196](https://github.com/warp-drive-data/warp-drive/blob/b6590b8852e5d32b32e3eece336d0f892e8b02a5/warp-drive-packages/core/src/reactive/-private/document.ts#L196)

The variant of [ReactiveDocument](ReactiveDocument.md) returned for a request whose
response contained primary data.

## Type Declaration

### data

```ts
readonly data: T;
```

The primary data for this document, if any.

If this document has no primary data (e.g. because it is an error document)
this property will be `undefined`.

For collections this will be an array of record instances,
for single resource requests it will be a single record instance or null.

### errors?

```ts
readonly optional errors?: undefined;
```

The errors returned by the API for this request, if any

## Type Parameters

### T

`T`

### M

`M` *extends*
| [`Meta`](../../types/spec/json-api-raw/type-aliases/Meta.md)
| `undefined` =
| [`Meta`](../../types/spec/json-api-raw/type-aliases/Meta.md)
| `undefined`

### E

`E` *extends* `object` = `object`

### EM

`EM` *extends*
| [`Meta`](../../types/spec/json-api-raw/type-aliases/Meta.md)
| `undefined` = `M`
