---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11238/api/@warp-drive/core/build-config/debugging/variables/LOG_CACHE.md
---

# &#x20;LOG\_CACHE&#x20;

```ts
const LOG_CACHE: boolean;
```

Defined in: [node\_modules/.pnpm/@warp-d\_25f56f2729dd79700790d78740333f27/node\_modules/@warp-drive/build-config/dist/debugging.d.ts:24](https://github.com/warp-drive-data/warp-drive/blob/6380bdd49555e2e65e41f86fc2f4535226e95f84/node_modules/.pnpm/@warp-d_25f56f2729dd79700790d78740333f27/node_modules/@warp-drive/build-config/dist/debugging.d.ts#L24)

log cache updates for both local
and remote state. Note in some older versions
this was called `LOG_PAYLOADS` and was one
of three flags that controlled logging of
cache updates. This is now the only flag.

The others were `LOG_OPERATIONS` and `LOG_MUTATIONS`.
