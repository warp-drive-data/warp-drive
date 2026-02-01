import { macros } from '@warp-drive/core/build-config/babel-macros';
import { babelPlugin } from '@warp-drive/core/build-config';

const IS_UNPKG_BUILD = Boolean(process.env.IS_UNPKG_BUILD);
let Macros = { js: [] };

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
    ['module:decorator-transforms', { runtime: { import: 'decorator-transforms/runtime' } }],
    ...Macros.js,
  ],
};
