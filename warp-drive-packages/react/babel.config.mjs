import { babelPlugin } from '@warp-drive/core/build-config';
import { macros } from '@warp-drive/core/build-config/babel-macros';

const IS_UNPKG_BUILD = Boolean(process.env.IS_UNPKG_BUILD);
let Macros = { js: [] };

if (IS_UNPKG_BUILD) {
  Macros = babelPlugin({
    compatWith: process.env.EMBER_DATA_FULL_COMPAT === 'true' ? '99.0' : null,
    forceMode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  });
}

export default {
  presets: [
    [
      '@babel/preset-react',
      { useBuiltIns: true, runtime: 'automatic', development: process.env.NODE_ENV !== 'production' },
    ],
  ],
  plugins: [
    ...macros(),
    [
      '@babel/plugin-transform-typescript',
      { allExtensions: true, isTSX: true, onlyRemoveTypeImports: true, allowDeclareFields: true },
    ],
    ['module:decorator-transforms', { runtime: { import: 'decorator-transforms/runtime' } }],
    ...Macros.js,
  ],
};
