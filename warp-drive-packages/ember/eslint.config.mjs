import * as gts from '@warp-drive/internal-config/eslint/gts.js';
// @ts-check
import { globalIgnores } from '@warp-drive/internal-config/eslint/ignore.js';
import * as node from '@warp-drive/internal-config/eslint/node.js';
import * as typescript from '@warp-drive/internal-config/eslint/typescript.js';

import { externals } from './tsdown.config.mjs';

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  // all ================
  globalIgnores(),

  // browser (js/ts) ================
  typescript.browser({
    dirname: import.meta.dirname,
    srcDirs: ['src'],
    allowedImports: externals,
    // tsconfig.json's `types: []` is for TS 7's check:types; ESLint's
    // type-aware rules need the classic-TS-friendly ember/glint types instead.
    project: './tsconfig.eslint.json',
  }),

  // gts
  gts.browser({
    dirname: import.meta.dirname,
    srcDirs: ['src'],
    allowedImports: externals,
    project: './tsconfig.eslint.json',
  }),

  // node (module) ================
  node.esm(),

  // node (script) ================
  node.cjs(),
];
