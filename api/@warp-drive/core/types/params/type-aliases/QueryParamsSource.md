---
url: /api/@warp-drive/core/types/params/type-aliases/QueryParamsSource.md
---

# &#x20;QueryParamsSource

```ts
type QueryParamsSource = 
  | object & Record<Exclude<string, "include">, Serializable>
  | URLSearchParams;
```

Defined in: [warp-drive-packages/core/src/types/params.ts:38](https://github.com/warp-drive-data/warp-drive/blob/cb1ab85858f637f156a9ff4e6ba8896c245d7a2c/warp-drive-packages/core/src/types/params.ts#L38)

The query parameters to serialize for a request: either a
dictionary of [Serializable](Serializable.md) values (with an optional
`include` member for specifying relationships to sideload),
or a native `URLSearchParams` instance.
