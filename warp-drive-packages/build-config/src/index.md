# @warp-drive/build-config

:::warning ⚠️ Internal Package
This package has been merged into {@link @warp-drive/core! | @warp-drive/core} and is not recommended for new applications
:::

This package provides a build-plugin that enables configuration of deprecations,
optional features, development/testing support and debug logging.

This configuration is done using `setConfig` in `ember-cli-build`.

```ts [ember-cli-build.js]
'use strict';

const EmberApp = require('ember-cli/lib/broccoli/ember-app');

module.exports = async function (defaults) {
  const { setConfig } = await import('@warp-drive/build-config'); // [!code focus]

  const app = new EmberApp(defaults, {});

  setConfig(app, __dirname, { // [!code focus:3]
    // settings here
  });

  const { buildOnce } = await import('@embroider/vite');
  const { compatBuild } = await import('@embroider/compat');

  return compatBuild(app, buildOnce);
};

```

Available settings include:

- {@link debugging | debugging}
- {@link deprecations | deprecations}
- {@link canary-features | features}
- {@link WarpDriveConfig.polyfillUUID | polyfillUUID}
- {@link WarpDriveConfig.includeDataAdapterInProduction | includeDataAdapterInProduction}
- {@link WarpDriveConfig.compatWith | compatWith}
