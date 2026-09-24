import { createConfig } from '@warp-drive/internal-config/tsdown/config.js';
import { keepAssets } from '@warp-drive/internal-config/tsdown/keep-assets.js';

import babelConfig from './babel.config.mjs';

export const externals = ['@ember/runloop', '@ember/test-helpers', '@ember/template-compilation', '@glimmer/manager'];
export const entryPoints = [
  './client/src/index.ts',
  './client/src/reporters/dom.ts',
  './client/src/runners/dom.ts',
  './client/src/helpers/install.ts',
  './client/src/ember.ts',
  './client/src/react.tsx',
  './client/src/spec.ts',
  './client/src/react/test-helpers.ts',
  './client/src/-types.ts',
];

export default createConfig(
  {
    srcDir: './client/src',
    entryPoints,
    externals,
    jsx: true,
    babelConfig,
    plugins: [keepAssets({ from: './client/src', include: ['./styles/**/*.css'], dist: 'dist' })],
  },
  import.meta.resolve
);
