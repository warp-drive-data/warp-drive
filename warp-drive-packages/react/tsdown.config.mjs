import { createConfig } from '@warp-drive/internal-config/tsdown/config.js';

import babelConfig from './babel.config.mjs';

export const externals = ['react'];
export const entryPoints = ['./src/index.ts', './src/install.ts'];

export default createConfig(
  {
    entryPoints,
    externals,
    jsx: true,
    babelConfig,
    compileTypes: process.env.IS_UNPKG_BUILD !== 'true',
  },
  import.meta.resolve
);
