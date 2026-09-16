---
url: >-
  /pr-preview/pr-11111/api/@warp-drive/core/reactive/type-aliases/ReactiveErrorDocument.md
---

# &#x20;ReactiveErrorDocument\<T, EM, E, M>

```ts
type ReactiveErrorDocument<T, EM, E, M> = ReactiveDocumentBase<T, M, E, EM> & DocumentMeta<EM> & object;
```

Defined in: [warp-drive-packages/core/src/reactive/-private/document.ts:158](https://github.com/warp-drive-data/warp-drive/blob/35e6f11f90cd6cbcd7085d46039c7832ce1352f4/warp-drive-packages/core/src/reactive/-private/document.ts#L158)

The variant of [ReactiveDocument](ReactiveDocument.md) returned for a request whose
response contained no primary data, e.g. an error response.

## Type Declaration

### data?

```ts
readonly optional data?: undefined;
```

The primary data for this document, if any.

If this document has no primary data (e.g. because it is an error document)
this property will be `undefined`.

For collections this will be an array of record instances,
for single resource requests it will be a single record instance or null.

### errors

```ts
readonly errors: E[];
```

The errors returned by the API for this request, if any

The cache stores whatever the API sent without validating it, so by
default this is `object` — no shape is promised. Requests that know what
their endpoint returns may narrow it by supplying the `E` type param.

## Type Parameters

### T

`T`

### EM

`EM` *extends*
| [`Meta`](../../types/spec/json-api-raw/type-aliases/Meta.md)
| `undefined` =
| [`Meta`](../../types/spec/json-api-raw/type-aliases/Meta.md)
| `undefined`

### E

`E` *extends* `object` = `object`

### M

`M` *extends*
| [`Meta`](../../types/spec/json-api-raw/type-aliases/Meta.md)
| `undefined` = `EM`
