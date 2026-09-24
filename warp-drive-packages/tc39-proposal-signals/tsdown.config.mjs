import { createConfig } from '@warp-drive/internal-config/tsdown/config.js';

export const externals = [];
export const entryPoints = ['./src/install.ts'];

export default createConfig(
  {
    entryPoints,
    externals,
    compileTypes: process.env.IS_UNPKG_BUILD !== 'true',
  },
  import.meta.resolve
);
