import { createConfig } from '@warp-drive/internal-config/vite/config.js';

export const entryPoints = ['./src/index.ts', './src/types.ts', 'src/configure.ts'];

export default createConfig({ entryPoints }, import.meta.resolve);
