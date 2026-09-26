---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11296/api/@warp-drive/core/build-config/debugging/variables/LOG_CACHE.md
description: >-
  Debug logging flag that logs cache updates to both local and remote state; it
  replaces `LOG_PAYLOADS`, `LOG_OPERATIONS`, and `LOG_MUTATIONS`.
---

# &#x20;LOG\_CACHE&#x20;

```ts
const LOG_CACHE: boolean;
```

Defined in: [node\_modules/.pnpm/@warp-d\_25f56f2729dd79700790d78740333f27/node\_modules/@warp-drive/build-config/dist/debugging.d.ts:28](https://github.com/warp-drive-data/warp-drive/blob/185e8bf5c5a4c2c19efa2ba51317e95dc2f53384/node_modules/.pnpm/@warp-d_25f56f2729dd79700790d78740333f27/node_modules/@warp-drive/build-config/dist/debugging.d.ts#L28)

log cache updates for both local
and remote state. Note in some older versions
this was called `LOG_PAYLOADS` and was one
of three flags that controlled logging of
cache updates. This is now the only flag.

The others were `LOG_OPERATIONS` and `LOG_MUTATIONS`.
