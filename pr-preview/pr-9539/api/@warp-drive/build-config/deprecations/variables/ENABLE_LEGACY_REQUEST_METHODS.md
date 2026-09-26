---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-9539/api/@warp-drive/build-config/deprecations/variables/ENABLE_LEGACY_REQUEST_METHODS.md
---

# &#x20;ENABLE\_LEGACY\_REQUEST\_METHODS&#x20;

```ts
const ENABLE_LEGACY_REQUEST_METHODS: boolean = true;
```

Defined in: [deprecations.ts:527](https://github.com/warp-drive-data/warp-drive/blob/323cb08c6f42aefbe421e128ab4c4e6fbb31a57d/warp-drive-packages/build-config/src/deprecations.ts#L527)

Deprecates all the methods that lead to making requests that don't directly
use `store.request()` or `manager.request()`.

A cheatsheat for moving from various methods to using requests is [available here](https://request-service-cheat-sheet.netlify.app/)

## Until

6.0
