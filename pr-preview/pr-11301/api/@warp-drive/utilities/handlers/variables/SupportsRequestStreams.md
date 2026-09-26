---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11301/api/@warp-drive/utilities/handlers/variables/SupportsRequestStreams.md
description: >-
  Whether the current browser can send a `ReadableStream` as a `fetch` request
  body, detected once at module load.
---

# &#x20;SupportsRequestStreams

```ts
const SupportsRequestStreams: boolean;
```

Defined in: [-private/handlers/auto-compress.ts:17](https://github.com/warp-drive-data/warp-drive/blob/837481248be90d10a9aca2fc068d7beb4bd3b31a/warp-drive-packages/utilities/src/-private/handlers/auto-compress.ts#L17)

Whether the browser supports `ReadableStream` as a request body
in a `POST` request.
