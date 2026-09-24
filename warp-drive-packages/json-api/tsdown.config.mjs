import { createConfig } from '@warp-drive/internal-config/tsdown/config.js';

export const externals = ['@ember/debug', '@embroider/macros'];

export const entryPoints = ['./src/index.ts'];

export default createConfig(
  {
    entryPoints,
    externals,
    compileTypes: process.env.IS_UNPKG_BUILD !== 'true',
  },
  import.meta.resolve
);
