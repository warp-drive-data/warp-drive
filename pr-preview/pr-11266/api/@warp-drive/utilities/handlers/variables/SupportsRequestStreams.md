---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11266/api/@warp-drive/utilities/handlers/variables/SupportsRequestStreams.md
description: >-
  Whether the current browser can send a `ReadableStream` as a `fetch` request
  body, detected once at module load.
---

# &#x20;SupportsRequestStreams

```ts
const SupportsRequestStreams: boolean;
```

Defined in: [-private/handlers/auto-compress.ts:17](https://github.com/warp-drive-data/warp-drive/blob/49b7d5502612c6681613bd683d94c70417318756/warp-drive-packages/utilities/src/-private/handlers/auto-compress.ts#L17)

Whether the browser supports `ReadableStream` as a request body
in a `POST` request.
