---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-9539/api/@warp-drive/utilities/handlers/variables/SupportsRequestStreams.md
description: >-
  Whether the current browser can send a `ReadableStream` as a `fetch` request
  body, detected once at module load.
---

# &#x20;SupportsRequestStreams

```ts
const SupportsRequestStreams: boolean;
```

Defined in: [-private/handlers/auto-compress.ts:17](https://github.com/warp-drive-data/warp-drive/blob/6d8462857f57c6682cc698dbfcf9b3ece5d8bfd2/warp-drive-packages/utilities/src/-private/handlers/auto-compress.ts#L17)

Whether the browser supports `ReadableStream` as a request body
in a `POST` request.
