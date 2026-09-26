---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11301/api/@warp-drive/build-config/canary-features/variables/JSON_API_CACHE_VALIDATION_ERRORS.md
description: >-
  Canary feature flag that makes the JSON:API cache validate payloads given to
  `cache.put` against registered schemas and the JSON:API spec.
---

&#x20;

:::warning Legacy package
`@warp-drive/build-config` is a legacy package. New code should use [`@warp-drive/core/build-config`](/api/@warp-drive/core/build-config/) instead.
:::

# &#x20;JSON\_API\_CACHE\_VALIDATION\_ERRORS&#x20;

```ts
const JSON_API_CACHE_VALIDATION_ERRORS: boolean | null = false;
```

Defined in: [canary-features.ts:142](https://github.com/warp-drive-data/warp-drive/blob/837481248be90d10a9aca2fc068d7beb4bd3b31a/warp-drive-packages/build-config/src/canary-features.ts#L142)

This upcoming feature adds a validation step to payloads received
by the JSONAPICache implementation.

When a request completes and the result is given to the cache via
`cache.put`, the cache will validate the payload against registered
schemas as well as the JSON:API spec.
