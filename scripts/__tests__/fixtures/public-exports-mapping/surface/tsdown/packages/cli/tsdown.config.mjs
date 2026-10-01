import { createConfig } from '@warp-drive/internal-config/tsdown/config.js';

export const entryPoints = ['./src/cli.ts', './src/commands/*.ts'];

export default createConfig({ entryPoints }, import.meta.resolve);
