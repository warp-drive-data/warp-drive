import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { setConfig } from '@warp-drive/core/build-config';
import { buildMacros } from '@embroider/macros/babel';

const require = createRequire(import.meta.url);

function isEnabled(flag) {
  return flag === true || flag === 'true' || flag === '1';
}

function resolve(module) {
  const filePath = import.meta.resolve(module);
  const file = filePath.replace('/node_modules/.vite-temp/', '/');
  if (file.startsWith('file://')) {
    return file.slice(7);
  }
  return file;
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
  js: [
    // babel-plugin-debug-macros is temporarily needed
    // to convert deprecation/warn calls into console.warn
    [
      resolve('babel-plugin-debug-macros'),
      {
        flags: [],
        debugTools: {
          isDebug: true,
          source: '@ember/debug',
          assertPredicateIndex: 1,
        },
      },
      'ember-data-specific-macros-stripping-test',
    ],
    ...macrosConfig.babelMacros,
  ],
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
