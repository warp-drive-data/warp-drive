import { createConfig } from '@warp-drive/internal-config/tsdown/config.js';

export const entryPoints = ['./src/index.ts', './src/mock.ts', './src/-private/index.ts', './src/app/thing.ts'];

export default createConfig({ entryPoints }, import.meta.resolve);
