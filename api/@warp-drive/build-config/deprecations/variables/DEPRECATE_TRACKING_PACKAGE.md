---
url: >-
  https://canary.warp-drive.io/api/@warp-drive/build-config/deprecations/variables/DEPRECATE_TRACKING_PACKAGE.md
description: >-
  Deprecation flag for the `@ember-data/tracking` package, which is replaced by
  the Ember reactivity setup in `@warp-drive/ember/install`.
---

&#x20;

:::warning Legacy package
`@warp-drive/build-config` is a legacy package. New code should use [`@warp-drive/core/build-config`](/api/@warp-drive/core/build-config/) instead.
:::

# &#x20;DEPRECATE\_TRACKING\_PACKAGE&#x20;

```ts
const DEPRECATE_TRACKING_PACKAGE: boolean = true;
```

Defined in: [deprecations.ts:537](https://github.com/warp-drive-data/warp-drive/blob/03dcb5d183725315ce1f5cc5933667e6e64ba5c3/warp-drive-packages/build-config/src/deprecations.ts#L537)

Deprecates the use of the @ember-data/tracking package which
historically provided bindings into Ember's reactivity system.

This package is no longer needed as the configuration is now
provided by the @warp-drive/ember package.

This deprecation can be resolved by removing the
@ember-data/tracking package from your project and ensuring
that your app.js file has the following import:

```js
import '@warp-drive/ember/install';
```

Once this import is present, you can remove the deprecation
by setting the deprecation to `false` in your build config:

```js
// inside of ember-cli-build.js

const { setConfig } = await import('@warp-drive/build-config');

setConfig(app, __dirname, {
  deprecations: {
    DEPRECATE_TRACKING_PACKAGE: false
  }
});
```

## Until

6.0
