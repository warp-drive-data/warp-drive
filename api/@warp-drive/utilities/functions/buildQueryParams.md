---
url: /api/@warp-drive/utilities/functions/buildQueryParams.md
---

# &#x20;buildQueryParams()

```ts
function buildQueryParams(params, options?): string;
```

Defined in: [index.ts:746](https://github.com/warp-drive-data/warp-drive/blob/3f5536455a585951f2252138f2bb555d8ad844bf/warp-drive-packages/utilities/src/index.ts#L746)

Sorts query params by both key and value, returning a query params string

Treats `included` specially, splicing it into an array if it is a string and sorting the array.

The `params` given are never mutated: neither the object itself nor any array
value it holds is reordered or replaced, so passing state that is also
rendered (a tracked array of filter values, for instance) is safe.

Options:

* arrayFormat: 'bracket' | 'indices' | 'repeat' | 'comma'

'bracket': appends \[] to the key for every value e.g. `ids[]=1&ids[]=2`
'indices': appends \[i] to the key for every value e.g. `ids[0]=1&ids[1]=2`
'repeat': appends the key for every value e.g. `ids=1&ids=2`
'comma' (default): appends the key once with a comma separated list of values e.g. `ids=1,2`

## Parameters

### params

[`QueryParamsSource`](../../core/types/params/type-aliases/QueryParamsSource.md)

### options?

[`QueryParamsSerializationOptions`](../../core/types/params/type-aliases/QueryParamsSerializationOptions.md)

## Returns

`string`

A sorted query params string without the leading `?`
