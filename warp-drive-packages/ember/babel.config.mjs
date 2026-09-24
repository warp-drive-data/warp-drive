import { babelPlugin } from '@warp-drive/core/build-config';
import { macros } from '@warp-drive/core/build-config/babel-macros';

const IS_UNPKG_BUILD = Boolean(process.env.IS_UNPKG_BUILD);
let Macros = { js: [], gts: [] };

if (IS_UNPKG_BUILD) {
  Macros = babelPlugin({
    compatWith: process.env.EMBER_DATA_FULL_COMPAT === 'true' ? '99.0' : null,
    forceMode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  });
}

export default {
  plugins: [
    ...macros(),
    [
      '@babel/plugin-transform-typescript',
      { allExtensions: true, onlyRemoveTypeImports: true, allowDeclareFields: true },
    ],
    '@embroider/addon-dev/template-colocation-plugin',
    [
      'babel-plugin-ember-template-compilation',
      {
        targetFormat: 'hbs',
        transforms: Macros.gts,
      },
    ],
    ['module:decorator-transforms', { runtime: { import: 'decorator-transforms/runtime' } }],
    ...Macros.js,
  ],
};
