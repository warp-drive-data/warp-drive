import Vue from 'unplugin-vue/rolldown';

import { createConfig } from '@warp-drive/internal-config/tsdown/config.js';

export const externals = ['vue'];
export const entryPoints = ['./src/index.ts', './src/install.ts'];

export default createConfig(
  {
    entryPoints,
    externals,
    plugins: [Vue({ isProduction: process.env.NODE_ENV === 'production' })],
  },
  import.meta.resolve
);
