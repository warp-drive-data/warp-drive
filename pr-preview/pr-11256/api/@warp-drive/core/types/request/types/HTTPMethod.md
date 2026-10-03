---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11256/api/@warp-drive/core/types/request/types/HTTPMethod.md
description: >-
  Union of the HTTP method strings, including `QUERY`, that a WarpDrive
  request's `method` may be set to.
---

# &#x20;HTTPMethod

```ts
type HTTPMethod = 
  | "QUERY"
  | "GET"
  | "OPTIONS"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE"
  | "HEAD"
  | "CONNECT"
  | "TRACE";
```

Defined in: [warp-drive-packages/core/src/types/request.ts:65](https://github.com/warp-drive-data/warp-drive/blob/c095d2e6f55c70ee964e1a33fb501af9507bd094/warp-drive-packages/core/src/types/request.ts#L65)

The HTTP methods WarpDrive's request layer supports.
