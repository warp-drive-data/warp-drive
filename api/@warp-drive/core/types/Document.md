---
url: /api/@warp-drive/core/types/Document.md
---

# &#x20;~~Document\<T, M *extends* [`Meta`](spec/json-api-raw/types/Meta.md) | `undefined` = [`Meta`](spec/json-api-raw/types/Meta.md) | `undefined`, E *extends* `object` = `object`, EM *extends* [`Meta`](spec/json-api-raw/types/Meta.md) | `undefined` = `M`>~~&#x20;

```ts
type Document<T, M extends Meta | undefined = Meta | undefined, E extends object = object, EM extends Meta | undefined = M> = ReactiveDocument<T, M, E, EM>;
```

Defined in: [warp-drive-packages/core/src/index.ts:50](https://github.com/warp-drive-data/warp-drive/blob/315931ffedd7d94eeba0879ee531991fe4ca5179/warp-drive-packages/core/src/index.ts#L50)

## Type Parameters

### T

`T`

### M

`M` *extends* [`Meta`](spec/json-api-raw/types/Meta.md) | `undefined` = [`Meta`](spec/json-api-raw/types/Meta.md) | `undefined`

### E

`E` *extends* `object` = `object`

### EM

`EM` *extends* [`Meta`](spec/json-api-raw/types/Meta.md) | `undefined` = `M`

## Deprecated

use [ReactiveDocument](../reactive/types/ReactiveDocument.md) instead
