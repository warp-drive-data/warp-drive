import { buildMacros } from '@embroider/macros/babel';

import { setConfig } from '@warp-drive/core/build-config';
import { macros } from '@warp-drive/core/build-config/babel-macros';

const Macros = buildMacros({
  configure: (config) => {
    setConfig(config, {
      compatWith: '99.99',
      forceMode: 'production',
    });
  },
});

export default {
  plugins: [
    ...macros(),
    [
      '@babel/plugin-transform-typescript',
      { allExtensions: true, onlyRemoveTypeImports: true, allowDeclareFields: true },
    ],
    ['module:decorator-transforms', { runtime: { import: 'decorator-transforms/runtime' } }],
    ...Macros.babelMacros,
  ],
};
