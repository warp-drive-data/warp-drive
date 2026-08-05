import { warpdrive, setConfig } from '@warp-drive/core/build-config';
import { buildMacros } from '@embroider/macros/babel';
import { macros } from '@warp-drive/core/build-config/babel-macros';
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8'));

const config = {
  compatWith: process.env.EMBER_DATA_FULL_COMPAT === 'true' ? '99.0' : null,
  deprecations: {
    DEPRECATE_TRACKING_PACKAGE: false,
  },
  tests: {
    VERSION: pkg.version,
    ASSERT_ALL_DEPRECATIONS: process.env.ASSERT_ALL_DEPRECATIONS === 'true',
  },
};

// @embroider/macros is still required to evaluate the macros used by
// ember-source itself; WarpDrive's own macros are evaluated by warpdrive()
const Macros = buildMacros({
  configure: (macrosConfig) => {
    setConfig(macrosConfig, config);
  },
});

export default {
  plugins: [
    ['module:decorator-transforms', { runtime: { import: 'decorator-transforms/runtime' } }],
    [
      '@babel/plugin-transform-typescript',
      {
        allExtensions: true,
        allowDeclareFields: true,
        onlyRemoveTypeImports: true,
      },
    ],
    [
      'babel-plugin-ember-template-compilation',
      {
        transforms: [...Macros.templateMacros],
      },
    ],
    ...macros(),
    warpdrive(config),
    ...Macros.babelMacros,
  ],

  generatorOpts: {
    compact: false,
  },
};
