---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11219/api/@warp-drive/core/build-config/canary-features/variables/JSON_API_CACHE_VALIDATION_ERRORS.md
description: >-
  Canary feature flag that makes the JSON:API cache validate payloads given to
  `cache.put` against registered schemas and the JSON:API spec.
---

# &#x20;JSON_API_CACHE_VALIDATION_ERRORS&#x20;

```ts
const JSON_API_CACHE_VALIDATION_ERRORS: boolean | null;
```

Defined in: [warp-drive-packages/build-config/src/canary-features.ts:142](https://github.com/warp-drive-data/warp-drive/blob/1a0bda2da6f096b75fcf2e9d9f327a94858a5304/warp-drive-packages/build-config/src/canary-features.ts#L142)

This upcoming feature adds a validation step to payloads received
by the JSONAPICache implementation.

When a request completes and the result is given to the cache via
`cache.put`, the cache will validate the payload against registered
schemas as well as the JSON:API spec.
