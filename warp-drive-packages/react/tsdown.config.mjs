import { createConfig } from '@warp-drive/internal-config/tsdown/config.js';

export const externals = ['react'];
export const entryPoints = ['./src/index.ts', './src/install.ts'];

export default createConfig(
  {
    entryPoints,
    externals,
    jsx: true,
    compileTypes: process.env.IS_UNPKG_BUILD !== 'true',
  },
  import.meta.resolve
);
