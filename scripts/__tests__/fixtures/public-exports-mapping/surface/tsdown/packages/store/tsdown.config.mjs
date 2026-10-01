import { createConfig } from '@warp-drive/internal-config/tsdown/config.js';

export const entryPoints = ['./src/index.ts', './src/-private.ts', './src/mixed.ts'];

export default createConfig({ entryPoints }, import.meta.resolve);
