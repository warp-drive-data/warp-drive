import { createConfig } from '@warp-drive/internal-config/tsdown/config.js';
import { keepAssets } from '@warp-drive/internal-config/tsdown/keep-assets.js';

import babelConfig from './babel.config.mjs';

export const externals = ['@ember/runloop', '@ember/test-helpers', '@ember/template-compilation', '@glimmer/manager'];
export const entryPoints = [
  './src/index.ts',
  './src/reporters/dom.ts',
  './src/runners/dom.ts',
  './src/helpers/install.ts',
  './src/ember.ts',
  './src/react.tsx',
  './src/spec.ts',
  './src/react/test-helpers.ts',
  './src/-types.ts',
];

export default createConfig(
  {
    entryPoints,
    externals,
    jsx: true,
    babelConfig,
    plugins: [keepAssets({ from: 'src', include: ['./styles/**/*.css'], dist: 'dist' })],
  },
  import.meta.resolve
);
