---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11219/api/@warp-drive/utilities/handlers/functions/assertInvalidUrlLength.md
---

# &#x20;assertInvalidUrlLength()

```ts
function assertInvalidUrlLength(url: string | undefined): void;
```

Defined in: [-private/handlers/utils.ts:77](https://github.com/warp-drive-data/warp-drive/blob/6638c699171a70d967515a5e333c695a52540144/warp-drive-packages/utilities/src/-private/handlers/utils.ts#L77)

This assertion takes a URL and throws an error if the URL is longer than the maximum URL length.

See also [MAX\_URL\_LENGTH](../variables/MAX_URL_LENGTH.md)

## Parameters

### url

`string` | `undefined`

## Returns

`void`
