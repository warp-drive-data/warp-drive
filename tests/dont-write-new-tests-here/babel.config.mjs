import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { setConfig } from '@warp-drive/core/build-config';
import { buildMacros } from '@embroider/macros/babel';

const require = createRequire(import.meta.url);

function isEnabled(flag) {
  return flag === true || flag === 'true' || flag === '1';
}

// @ember-data/unpublished-test-infra is a v1-shimmed v2 addon that sets its
// own @embroider/macros config (VERSION, ASSERT_ALL_DEPRECATIONS) via the
// classic `addon.options['@embroider/macros'].setOwnConfig` convention (see
// its addon-main.cjs). That convention is only ever read during classic
// ember-cli addon-tree resolution, which this app no longer does now that it
// builds through @embroider/vite's native (non-compat) pipeline. Without
// this, `getOwnConfig()` inside unpublished-test-infra's own source resolves
// to `undefined` and crashes. Replicate what the addon-shim would have done.
//
// The package's own `exports` map has no `"./package.json"` entry (its `"./*"`
// wildcard redirects into `dist/`, which doesn't contain one either), so we
// resolve its main entry and walk up to the package root instead.
const unpublishedTestInfraEntry = fileURLToPath(import.meta.resolve('@ember-data/unpublished-test-infra'));
const unpublishedTestInfraPkg = join(dirname(unpublishedTestInfraEntry), '..', 'package.json');

// vite build's own NODE_ENV=production default (forced internally regardless
// of `--mode`, unless already set) would otherwise make both this app's own
// DEBUG/PRODUCTION/TESTING resolution (via getEnv() below) and
// @embroider/macros's own buildMacros() dev-mode detection (which gates
// isDevelopingApp()/isTesting(), used internally by e.g. ember-source's
// @ember/debug deprecate/assert/warn) permanently resolve to production. Both
// read process.env.NODE_ENV directly, so build:tests/build:production set it
// explicitly before invoking vite (matching tests/framework-ember's pattern)
// rather than fighting vite's default here.
const macrosConfig = buildMacros({
  configure: (config) => {
    setConfig(config, {
      compatWith: isEnabled(process.env.EMBER_DATA_FULL_COMPAT) ? '99.0' : null,
      deprecations: {
        DEPRECATE_STORE_EXTENDS_EMBER_OBJECT: false,
        DEPRECATE_TRACKING_PACKAGE: false,
      },
      debug: {
        // LOG_GRAPH: true,
        // LOG_IDENTIFIERS: true,
        // LOG_NOTIFICATIONS: true,
        // LOG_INSTANCE_CACHE: true,
        // LOG_CACHE: true,
        // LOG_REQUESTS: true,
        // LOG_REQUEST_STATUS: true,
      },
    });
    config.setOwnConfig(unpublishedTestInfraPkg, {
      VERSION: require(unpublishedTestInfraPkg).version,
      ASSERT_ALL_DEPRECATIONS: Boolean(process.env.ASSERT_ALL_DEPRECATIONS),
    });
  },
});

const macros = {
  gts: macrosConfig.templateMacros,
  // note: unlike @warp-drive/core/build-config's babelPlugin() convenience
  // helper (for apps with no @embroider/macros of their own), this app's
  // classic ember-cli-build.js never ran babel-plugin-debug-macros over
  // deprecate()/warn() calls -- it already had @embroider/macros set up via
  // EmberApp, and @ember/debug's own dist already gates deprecate()/warn()
  // correctly via @embroider/macros. Adding babel-plugin-debug-macros here
  // rewrote every deprecate() call (including inside @warp-drive/core's own
  // dist, since this babel pass has no node_modules exclude) into a bare
  // console.warn(), bypassing @ember/debug's registerDeprecationHandler
  // dispatch entirely -- which silently broke every test asserting on
  // `assert.expectDeprecation()`/deprecation counts.
  js: [...macrosConfig.babelMacros],
};

export default {
  plugins: [
    [
      '@babel/plugin-transform-typescript',
      {
        allExtensions: true,
        onlyRemoveTypeImports: true,
        allowDeclareFields: true,
      },
    ],
    [
      'babel-plugin-ember-template-compilation',
      {
        transforms: [...macros.gts],
      },
    ],
    [
      'module:decorator-transforms',
      {
        runtime: {
          import: import.meta.resolve('decorator-transforms/runtime-esm'),
        },
      },
    ],
    [
      '@babel/plugin-transform-runtime',
      {
        absoluteRuntime: import.meta.dirname,
        useESModules: true,
        regenerator: false,
      },
    ],
    ...macros.js,
  ],

  generatorOpts: {
    compact: false,
  },
};
