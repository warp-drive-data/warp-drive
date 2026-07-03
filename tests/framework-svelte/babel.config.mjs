import { macrosPlugin } from '@warp-drive/core/build-config';
import { macros } from '@warp-drive/core/build-config/babel-macros';

export default {
  plugins: [
    ...macros(),
    ['module:decorator-transforms', { runtime: { import: 'decorator-transforms/runtime' } }],
    // babel-plugin-debug-macros is temporarily needed
    // to convert deprecation/warn calls into console.warn
    [
      'babel-plugin-debug-macros',
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
    macrosPlugin({
      compatWith: '5.7',
    }),
    [
      '@babel/plugin-transform-typescript',
      { allExtensions: true, isTSX: true, onlyRemoveTypeImports: true, allowDeclareFields: true },
    ],
  ],
};
