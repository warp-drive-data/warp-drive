import { createRequire } from 'node:module';

import { babelCompatSupport, templateCompatSupport } from '@embroider/compat/babel';

const require = createRequire(import.meta.url);

export default {
  plugins: [
    // NOTE: we do NOT also spread `macros()` (from
    // `@warp-drive/build-config/babel-macros`) here. `ember-cli-build.js`
    // already registers those same plugins on the classic `EmberApp` via
    // `babel: { plugins: [...macros()] }`, and `compatBuild`'s addon-widening
    // step captures that registration. `babelCompatSupport()` below already
    // re-surfaces it (via `pluginsFromV1Addons()`) for vite's babel pass, so
    // adding it again here would register the same plugins twice and trip
    // Babel's duplicate-plugin detection.
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
        enableLegacyModules: [
          'ember-cli-htmlbars',
          'ember-cli-htmlbars-inline-precompile',
          'htmlbars-inline-precompile',
        ],
        transforms: [...templateCompatSupport()],
      },
    ],
    [
      'module:decorator-transforms',
      {
        runtime: {
          import: require.resolve('decorator-transforms/runtime-esm'),
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
    ...babelCompatSupport(),
  ],

  generatorOpts: {
    compact: false,
  },
};
