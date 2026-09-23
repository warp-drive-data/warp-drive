import { createConfig } from '@warp-drive/internal-config/tsdown/config.js';
import { keepAssets } from '@warp-drive/internal-config/tsdown/keep-assets.js';

export const externals = [
  'node:child_process',
  'node:fs',
  'node:fs/promises',
  'node:http',
  'node:http2',
  'node:https',
  'node:net',
  'node:os',
  'node:path',
  'node:url',
  'node:util',
];
export const entryPoints = ['./server/src/index.ts'];

export default createConfig(
  {
    srcDir: './server/src',
    entryPoints,
    externals,
    outDir: 'dist-server',
    compileTypes: false,
    plugins: [keepAssets({ from: 'server', include: ['*.ico', '*.svg', '*.html'], dist: 'dist-server' })],
  },
  import.meta.resolve
);
