import { createConfig } from '@warp-drive/internal-config/tsdown/config.js';

export const entryPoints = [
  // './src/old.ts',
  './src/index.ts',
  './src/store.ts',
  './src/store/-private.ts',
  './src/types/**/*.ts',
];

export default createConfig({ entryPoints }, import.meta.resolve);
