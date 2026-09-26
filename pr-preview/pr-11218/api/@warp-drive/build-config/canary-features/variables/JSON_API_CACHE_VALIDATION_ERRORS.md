---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11218/api/@warp-drive/build-config/canary-features/variables/JSON_API_CACHE_VALIDATION_ERRORS.md
---

# &#x20;JSON\_API\_CACHE\_VALIDATION\_ERRORS&#x20;

```ts
const JSON_API_CACHE_VALIDATION_ERRORS: boolean | null = false;
```

Defined in: [canary-features.ts:138](https://github.com/warp-drive-data/warp-drive/blob/9a1ba598bf4f66d8348de75c9ad9359698e5c8ba/warp-drive-packages/build-config/src/canary-features.ts#L138)

This upcoming feature adds a validation step to payloads received
by the JSONAPICache implementation.

When a request completes and the result is given to the cache via
`cache.put`, the cache will validate the payload against registered
schemas as well as the JSON:API spec.
