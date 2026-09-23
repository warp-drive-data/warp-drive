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
export const entryPoints = ['./src/index.ts', './src/install.ts', './src/experiments.ts'];

/**
 * TypeDoc cannot parse the `.gts` components this package re-exports, so
 * `typedoc.config.mjs` points it at `dist/*.d.ts` instead of `src`. The d.ts
 * bundler drops the file-level `@module` / `@mergeModuleWith <project>` comment
 * from `src/index.ts`, and without it TypeDoc renders `index` as a stray
 * sub-module instead of folding it into the package root. Re-add that comment
 * to the one chunk TypeDoc reads as the package root.
 */
const ROOT_MODULE_DOC = '/**\n * @module\n * @mergeModuleWith <project>\n */';

export default createConfig(
  {
    entryPoints,
    externals,
    compileTypes: process.env.IS_UNPKG_BUILD !== 'true',
    banner: ({ fileName }) => (fileName === 'index.d.ts' ? ROOT_MODULE_DOC : undefined),
  },
  import.meta.resolve
);
