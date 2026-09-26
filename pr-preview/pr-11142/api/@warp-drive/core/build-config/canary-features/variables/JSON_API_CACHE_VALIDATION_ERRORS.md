---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11142/api/@warp-drive/core/build-config/canary-features/variables/JSON_API_CACHE_VALIDATION_ERRORS.md
---

# &#x20;JSON\_API\_CACHE\_VALIDATION\_ERRORS&#x20;

```ts
const JSON_API_CACHE_VALIDATION_ERRORS: boolean | null;
```

Defined in: [node\_modules/.pnpm/@warp-d\_25f56f2729dd79700790d78740333f27/node\_modules/@warp-drive/build-config/dist/canary-features-uADmGk0K.d.ts:139](https://github.com/warp-drive-data/warp-drive/blob/fe5df5abab153c45663c00dfcbcd8d5192080e20/node_modules/.pnpm/@warp-d_25f56f2729dd79700790d78740333f27/node_modules/@warp-drive/build-config/dist/canary-features-uADmGk0K.d.ts#L139)

This upcoming feature adds a validation step to payloads received
by the JSONAPICache implementation.

When a request completes and the result is given to the cache via
`cache.put`, the cache will validate the payload against registered
schemas as well as the JSON:API spec.
