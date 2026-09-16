---
url: >-
  /pr-preview/pr-11087/api/@warp-drive/core/types/params/type-aliases/QueryParamsSource.md
---

# &#x20;QueryParamsSource

```ts
type QueryParamsSource = 
  | object & Record<Exclude<string, "include">, Serializable>
  | URLSearchParams;
```

Defined in: [warp-drive-packages/core/src/types/params.ts:38](https://github.com/warp-drive-data/warp-drive/blob/53f90949527307caf1710da014dad97fc5e3ab13/warp-drive-packages/core/src/types/params.ts#L38)

The query parameters to serialize for a request: either a
dictionary of [Serializable](Serializable.md) values (with an optional
`include` member for specifying relationships to sideload),
or a native `URLSearchParams` instance.
