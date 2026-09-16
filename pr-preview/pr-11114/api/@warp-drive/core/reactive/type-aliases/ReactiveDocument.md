---
url: >-
  /pr-preview/pr-11114/api/@warp-drive/core/reactive/type-aliases/ReactiveDocument.md
---

# &#x20;ReactiveDocument\<T, M, E, EM>

```ts
type ReactiveDocument<T, M, E, EM> = 
  | ReactiveDataDocument<T, M, E, EM>
| ReactiveErrorDocument<T, EM, E, M>;
```

Defined in: [warp-drive-packages/core/src/reactive/-private/document.ts:258](https://github.com/warp-drive-data/warp-drive/blob/2a894723a738725713417f2a39f20d1a3c698f73/warp-drive-packages/core/src/reactive/-private/document.ts#L258)

A Document is a class that wraps the response content from a request to the API
returned by `Cache.put` or `Cache.peek`, converting ResourceKeys into
ReactiveResource instances.

It is not directly instantiated by the user, and its properties should not
be directly modified. Whether individual properties are mutable or not is
determined by the record instance itself.

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
