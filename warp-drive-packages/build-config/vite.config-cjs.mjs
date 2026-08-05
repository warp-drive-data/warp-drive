import { createConfig } from '@warp-drive/internal-config/vite/config.js';

export const externals = ['babel-import-util', 'semver', 'fs', 'path', 'url', 'node:module', 'node:path'];

export const entryPoints = [
  './cjs-src/transforms/babel-plugin-transform-asserts.js',
  './cjs-src/transforms/babel-plugin-transform-macros.js',
  './cjs-src/warpdrive-webpack-loader.js',
  './cjs-src/transforms/babel-plugin-transform-deprecations.js',
  './cjs-src/transforms/babel-plugin-transform-features.js',
  './cjs-src/transforms/babel-plugin-transform-logging.js',
  './cjs-src/addon-shim.js',
  './src/cjs-set-config.ts',
];

export default createConfig(
  {
    entryPoints,
    flatten: true,
    format: 'cjs',
    externals,
    target: ['esnext', 'firefox121', 'node22'],
    emptyOutDir: false,
    fixModule: false,
    compileTypes: false,
  },
  import.meta.resolve
);
