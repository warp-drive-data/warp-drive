import { createConfig } from '@warp-drive/internal-config/vite/config.js';

export const externals = [];
export const entryPoints = ['./src/index.ts'];

export default createConfig(
  {
    entryPoints,
    externals,
    compileTypes: process.env.IS_UNPKG_BUILD !== 'true',
  },
  import.meta.resolve
);
