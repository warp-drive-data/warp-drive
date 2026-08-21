import { createConfig } from '@warp-drive/internal-config/tsdown/config.js';

export const externals = [];
export const entryPoints = ['./src/request.ts', './src/index.ts'];

export default createConfig(
  {
    entryPoints,
    externals,
  },
  import.meta.resolve
);
