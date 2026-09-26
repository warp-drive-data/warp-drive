---
url: >-
  https://canary.warp-drive.io/pr-preview/pr-11300/api/@warp-drive/core/build-config/babel-macros/functions/macros.md
description: >-
  Returns the Babel plugin entries that turn WarpDrive deprecation,
  canary-feature, debug-logging, env, and assert imports into build-time
  code-stripping macros.
---

# &#x20;macros()

```ts
function macros(): BabelPlugin[];
```

Defined in: [node\_modules/.pnpm/@warp-d\_25f56f2729dd79700790d78740333f27/node\_modules/@warp-drive/build-config/dist/babel-macros.d.ts:15](https://github.com/warp-drive-data/warp-drive/blob/2060227ee98096ec39bd0c0d9fed4d0fe29fb087/node_modules/.pnpm/@warp-d_25f56f2729dd79700790d78740333f27/node_modules/@warp-drive/build-config/dist/babel-macros.d.ts#L15)

## Returns

`BabelPlugin`\[]

an array of Babel plugins that can be used for code-stripping
based on the configuration supplied to `setConfig` and the current ENV.

* deprecation constants imported from `@warp-drive/build-config/deprecations`
* feature flags imported from `@warp-drive/build-config/canary-features`
* debug logging constants imported from `@warp-drive/build-config/debugging`
* environment constants imported from `@warp-drive/build-config/env`
* expressionts imported from `@warp-drive/build-config/macros`
