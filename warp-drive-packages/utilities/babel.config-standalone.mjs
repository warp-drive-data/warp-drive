import { macros } from '@warp-drive/core/build-config/babel-macros';
import { macrosPlugin } from '@warp-drive/core/build-config';

export default {
  plugins: [
    ...macros(),
    [
      '@babel/plugin-transform-typescript',
      { allExtensions: true, onlyRemoveTypeImports: true, allowDeclareFields: true },
    ],
    ['module:decorator-transforms', { runtime: { import: 'decorator-transforms/runtime' } }],
    macrosPlugin({
      compatWith: '99.99',
      forceMode: 'production',
    }),
  ],
};
