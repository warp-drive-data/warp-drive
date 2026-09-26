# @warp-drive/build-config

This package is the implementation home of the `setConfig` build plugin that configures
deprecations, optional features, development/testing support and debug logging. Apps import it
as {@link @warp-drive/core!build-config @warp-drive/core/build-config}, which re-exports every
entry point below; the documentation for each lives on the `@warp-drive/core` page it maps to.

Apps still importing from this package configure it with `setConfig` in `ember-cli-build`:

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

- {@link @warp-drive/core!build-config/debugging | debugging}
- {@link @warp-drive/core!build-config/deprecations | deprecations}
- {@link @warp-drive/core!build-config/canary-features | features}
- {@link @warp-drive/core!build-config.WarpDriveConfig.polyfillUUID | polyfillUUID}
- {@link @warp-drive/core!build-config.WarpDriveConfig.includeDataAdapterInProduction | includeDataAdapterInProduction}
- {@link @warp-drive/core!build-config.WarpDriveConfig.compatWith | compatWith}

Every entry point maps to its `@warp-drive/core` equivalent:

| `@warp-drive/build-config` entry | re-exported as                                                                                      |
| -------------------------------- | --------------------------------------------------------------------------------------------------- |
| `.` (root)                       | {@link @warp-drive/core!build-config @warp-drive/core/build-config}                                 |
| `/babel-macros`                  | {@link @warp-drive/core!build-config/babel-macros @warp-drive/core/build-config/babel-macros}       |
| `/canary-features`               | {@link @warp-drive/core!build-config/canary-features @warp-drive/core/build-config/canary-features} |
| `/debugging`                     | {@link @warp-drive/core!build-config/debugging @warp-drive/core/build-config/debugging}             |
| `/deprecations`                  | {@link @warp-drive/core!build-config/deprecations @warp-drive/core/build-config/deprecations}       |
| `/env`                           | `@warp-drive/core/build-config/env` (internal, no API page)                                         |
| `/macros`                        | `@warp-drive/core/build-config/macros` (internal, no API page)                                      |
