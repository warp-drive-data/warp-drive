import { setConfig } from '@warp-drive/core/build-config';
import { buildMacros } from '@embroider/macros/babel';

const Macros = buildMacros({
  configure: (config) => {
    setConfig(config, {
      compatWith: '99',
      debug: {
        // LOG_NOTIFICATIONS: true,
        // LOG_INSTANCE_CACHE: true,
        // LOG_METRIC_COUNTS: true,
        // __INTERNAL_LOG_NATIVE_MAP_SET_COUNTS: true,
        // DEBUG_RELATIONSHIP_NOTIFICATIONS: true,
      },
    });
  },
});

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
        transforms: [...Macros.templateMacros],
      },
    ],
    [
      'module:decorator-transforms',
      {
        runtime: {
          import: 'decorator-transforms/runtime-esm',
        },
      },
    ],
    [
      '@babel/plugin-transform-runtime',
      {
        useESModules: true,
        regenerator: false,
      },
    ],
    ...Macros.babelMacros,
  ],

  generatorOpts: {
    compact: false,
  },
};
