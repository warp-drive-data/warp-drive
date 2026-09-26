---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11308/api/@warp-drive/utilities/handlers/variables/SupportsRequestStreams.md
description: >-
  Whether the current browser can send a `ReadableStream` as a `fetch` request
  body, detected once at module load.
---

# &#x20;SupportsRequestStreams

```ts
const SupportsRequestStreams: boolean;
```

Defined in: [-private/handlers/auto-compress.ts:17](https://github.com/warp-drive-data/warp-drive/blob/8280ed61816b930e2f4b7b363858bbd832e09e17/warp-drive-packages/utilities/src/-private/handlers/auto-compress.ts#L17)

Whether the browser supports `ReadableStream` as a request body
in a `POST` request.
