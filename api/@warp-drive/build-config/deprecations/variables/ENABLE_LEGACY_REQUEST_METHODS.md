---
url: >-
  https://canary.warp-drive.io/api/@warp-drive/build-config/deprecations/variables/ENABLE_LEGACY_REQUEST_METHODS.md
description: >-
  Deprecation flag for store request methods like `findRecord`, `query`, and
  `saveRecord` that bypass `store.request()`; `false` strips them.
---

&#x20;

:::warning Legacy package
`@warp-drive/build-config` is a legacy package. New code should use [`@warp-drive/core/build-config`](/api/@warp-drive/core/build-config/) instead.
:::

# &#x20;ENABLE\_LEGACY\_REQUEST\_METHODS&#x20;

```ts
const ENABLE_LEGACY_REQUEST_METHODS: boolean = true;
```

Defined in: [deprecations.ts:553](https://github.com/warp-drive-data/warp-drive/blob/03dcb5d183725315ce1f5cc5933667e6e64ba5c3/warp-drive-packages/build-config/src/deprecations.ts#L553)

Deprecates all the methods that lead to making requests that don't directly
use `store.request()` or `manager.request()`.

A cheatsheat for moving from various methods to using requests is [available here](https://request-service-cheat-sheet.netlify.app/)

## Until

6.0
