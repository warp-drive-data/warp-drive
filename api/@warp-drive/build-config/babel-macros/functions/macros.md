---
url: >-
  https://canary.warp-drive.io/api/@warp-drive/build-config/babel-macros/functions/macros.md
description: >-
  Returns the Babel plugin entries that turn WarpDrive deprecation,
  canary-feature, debug-logging, env, and assert imports into build-time
  code-stripping macros.
---

# &#x20;macros()

```ts
function macros(): BabelPlugin[];
```

Defined in: [babel-macros.ts:58](https://github.com/warp-drive-data/warp-drive/blob/0491c8693bd1f37a23e5f2c61ac79e025249c535/warp-drive-packages/build-config/src/babel-macros.ts#L58)

## Returns

`BabelPlugin`\[]

an array of Babel plugins that can be used for code-stripping
based on the configuration supplied to `setConfig` and the current ENV.

* deprecation constants imported from `@warp-drive/build-config/deprecations`
* feature flags imported from `@warp-drive/build-config/canary-features`
* debug logging constants imported from `@warp-drive/build-config/debugging`
* environment constants imported from `@warp-drive/build-config/env`
* expressionts imported from `@warp-drive/build-config/macros`
