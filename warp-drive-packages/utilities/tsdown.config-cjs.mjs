import { fixViteHijack } from '@warp-drive/internal-config/rollup/external.js';
import { createConfig } from '@warp-drive/internal-config/tsdown/config.js';

export const externals = [];
export const entryPoints = ['./src/string.ts'];

export default createConfig(
  {
    entryPoints,
    flatten: true,
    format: 'cjs',
    externals,
    explicitExternalsOnly: true,
    ember: {
      babel: {
        configFile: fixViteHijack(import.meta.resolve('./babel.config-standalone.mjs')).slice(7),
      },
    },
    target: ['esnext', 'firefox121', 'node18'],
    emptyOutDir: false,
    compileTypes: false,
    outDir: 'cjs-dist',
  },
  import.meta.resolve
);
