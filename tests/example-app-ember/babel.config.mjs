import { babelPlugin, setConfig } from '@warp-drive/core/build-config';
import { buildMacros } from '@embroider/macros/babel';

const config = {
  compatWith: '5.6',
};

const macros = babelPlugin(config);

// @embroider/macros is still required to evaluate the macros used by
// ember-source itself; WarpDrive's own macros are evaluated by babelPlugin()
const EmberMacros = buildMacros({
  configure: (macrosConfig) => {
    setConfig(macrosConfig, config);
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
        transforms: [...EmberMacros.templateMacros, ...macros.gts],
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
    ...EmberMacros.babelMacros,
  ],

  generatorOpts: {
    compact: false,
  },
};
