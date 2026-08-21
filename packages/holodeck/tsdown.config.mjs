import { createConfig } from '@warp-drive/internal-config/tsdown/config.js';

export const externals = [];
export const entryPoints = ['./src/index.ts', './src/mock.ts'];

export default createConfig(
  {
    entryPoints,
    externals,
  },
  import.meta.resolve
);
