---
url: >-
  https://canary.warp-drive.io/api/@warp-drive/utilities/handlers/variables/TAB_ID.md
description: >-
  Random UUID identifying the current browser tab, kept in `sessionStorage`
  across reloads, for request tracing.
---

# &#x20;TAB\_ID

```ts
const TAB_ID: string;
```

Defined in: [-private/handlers/utils.ts:38](https://github.com/warp-drive-data/warp-drive/blob/7d14928562bb412c61b403e577095b9a3f9cb0b7/warp-drive-packages/utilities/src/-private/handlers/utils.ts#L38)

A unique identifier for the current browser tab
useful for observability/tracing and deduping
across multiple tabs.
