---
url: >-
  https://canary.warp-drive.io/api/@warp-drive/core/build-config/canary-features/variables/JSON_API_CACHE_VALIDATION_ERRORS.md
description: >-
  Canary feature flag that makes the JSON:API cache validate payloads given to
  `cache.put` against registered schemas and the JSON:API spec.
---

# &#x20;JSON_API_CACHE_VALIDATION_ERRORS&#x20;

```ts
const JSON_API_CACHE_VALIDATION_ERRORS: boolean | null;
```

Defined in: [warp-drive-packages/build-config/src/canary-features.ts:142](https://github.com/warp-drive-data/warp-drive/blob/82d0c44ddc9be2d10e5e45f1f264e9d72673e78b/warp-drive-packages/build-config/src/canary-features.ts#L142)

This upcoming feature adds a validation step to payloads received
by the JSONAPICache implementation.

When a request completes and the result is given to the cache via
`cache.put`, the cache will validate the payload against registered
schemas as well as the JSON:API spec.
