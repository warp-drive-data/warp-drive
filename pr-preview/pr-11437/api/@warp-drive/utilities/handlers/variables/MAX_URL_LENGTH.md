---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11437/api/@warp-drive/utilities/handlers/variables/MAX_URL_LENGTH.md
description: >-
  The 8192-byte URL length limit, taken from AWS CloudFront, that
  `assertInvalidUrlLength` checks against.
---

# &#x20;MAX\_URL\_LENGTH

```ts
const MAX_URL_LENGTH: 8192 = 8192;
```

Defined in: [-private/handlers/utils.ts:74](https://github.com/warp-drive-data/warp-drive/blob/9afacf68ad08530bac1f31a9fdde9cf093e1508c/warp-drive-packages/utilities/src/-private/handlers/utils.ts#L74)

Source: https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/cloudfront-limits.html
As of 2024-12-05 the maximum URL length is 8192 bytes.
