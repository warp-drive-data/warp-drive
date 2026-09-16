---
url: >-
  /pr-preview/pr-11117/api/@warp-drive/utilities/handlers/functions/assertInvalidUrlLength.md
---

# &#x20;assertInvalidUrlLength()

```ts
function assertInvalidUrlLength(url: string | undefined): void;
```

Defined in: [-private/handlers/utils.ts:77](https://github.com/warp-drive-data/warp-drive/blob/3e01a7f0373e29c82765d26c241a949bcf7d5b2d/warp-drive-packages/utilities/src/-private/handlers/utils.ts#L77)

This assertion takes a URL and throws an error if the URL is longer than the maximum URL length.

See also [MAX\_URL\_LENGTH](../variables/MAX_URL_LENGTH.md)

## Parameters

### url

`string` | `undefined`

## Returns

`void`
