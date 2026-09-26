---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11308/api/@warp-drive/core/types/params/types/QueryParamsSource.md
description: >-
  Query params to serialize into a request URL: a dictionary of serializable
  values with optional `include`, or a `URLSearchParams`.
---

# &#x20;QueryParamsSource

```ts
type QueryParamsSource = 
  | {
  include?: string | string[];
} & Record<Exclude<string, "include">, Serializable>
  | URLSearchParams;
```

Defined in: [warp-drive-packages/core/src/types/params.ts:54](https://github.com/warp-drive-data/warp-drive/blob/8280ed61816b930e2f4b7b363858bbd832e09e17/warp-drive-packages/core/src/types/params.ts#L54)

The query parameters to serialize for a request: either a
dictionary of [Serializable](Serializable.md) values (with an optional
`include` member for specifying relationships to sideload),
or a native `URLSearchParams` instance.
