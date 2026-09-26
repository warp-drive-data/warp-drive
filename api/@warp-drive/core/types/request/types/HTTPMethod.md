---
url: >-
  https://canary.warp-drive.io/api/@warp-drive/core/types/request/types/HTTPMethod.md
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

Defined in: [warp-drive-packages/core/src/types/request.ts:65](https://github.com/warp-drive-data/warp-drive/blob/03dcb5d183725315ce1f5cc5933667e6e64ba5c3/warp-drive-packages/core/src/types/request.ts#L65)

The HTTP methods WarpDrive's request layer supports.
