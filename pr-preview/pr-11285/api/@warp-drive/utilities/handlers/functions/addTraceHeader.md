---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11285/api/@warp-drive/utilities/handlers/functions/addTraceHeader.md
---

# &#x20;addTraceHeader()

```ts
function addTraceHeader(headers: Headers): Headers;
```

Defined in: [-private/handlers/utils.ts:55](https://github.com/warp-drive-data/warp-drive/blob/a684b0bff04424079998b2ab945da7505a92652d/warp-drive-packages/utilities/src/-private/handlers/utils.ts#L55)

Adds the `X-Amzn-Trace-Id` header to support observability
tooling around request routing.

This makes use of the [TAB\_ID](../variables/TAB_ID.md) and [TAB\_ASSIGNED](../variables/TAB_ASSIGNED.md)
to enable tracking the browser tab of origin across multiple requests.

Follows the template: `Root=1-${now}-${uuidv4};TabId=1-${epochSeconds}-${tab-uuid}`

## Parameters

### headers

[`Headers`](https://developer.mozilla.org/docs/Web/API/Headers)

## Returns

[`Headers`](https://developer.mozilla.org/docs/Web/API/Headers)
