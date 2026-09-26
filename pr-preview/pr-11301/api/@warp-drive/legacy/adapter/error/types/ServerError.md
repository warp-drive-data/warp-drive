---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11301/api/@warp-drive/legacy/adapter/error/types/ServerError.md
description: >-
  Legacy adapter error for an HTTP 500 response, signaling that the API failed
  internally and an immediate retry is unlikely to succeed.
---

&#x20;

# &#x20;ServerError

```ts
type ServerError = AdapterRequestError<"ServerError">;
```

Defined in: [warp-drive-packages/legacy/src/adapter/error.ts:555](https://github.com/warp-drive-data/warp-drive/blob/837481248be90d10a9aca2fc068d7beb4bd3b31a/warp-drive-packages/legacy/src/adapter/error.ts#L555)

The [AdapterRequestError](AdapterRequestError.md) shape thrown by the [ServerError](../variables/ServerError.md) constructor.
