import { createConfig } from '@warp-drive/internal-config/tsdown/config.js';

export const externals = [
  '@ember/template-compilation',
  '@ember/component/template-only',
  '@glint/template',
  '@ember/component', // unsure where this comes from
  '@ember/service',
  '@ember/owner',
  '@glimmer/component',
  '@ember/test-waiters',
  '@glimmer/tracking',
  '@glimmer/validator',
  '@ember/object/compat',
  '@ember/-internals/metal',
  '@ember/runloop',
];
export const entryPoints = ['./src/index.ts', './src/install.ts'];

export default createConfig(
  {
    entryPoints,
    externals,
    compileTypes: process.env.IS_UNPKG_BUILD !== 'true',
  },
  import.meta.resolve
);
