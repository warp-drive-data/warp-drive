import WarpDrive from 'eslint-plugin-warp-drive/recommended';

import * as diagnostic from '@warp-drive/internal-config/eslint/diagnostic.js';
import * as gts from '@warp-drive/internal-config/eslint/gts.js';
// @ts-check
import { globalIgnores } from '@warp-drive/internal-config/eslint/ignore.js';
import * as node from '@warp-drive/internal-config/eslint/node.js';

/** @type {import('eslint').Linter.Config[]} */
export default [
  // all ================
  globalIgnores(),

  // // browser (js/ts) ================
  gts.browser({
    dirname: import.meta.dirname,
    srcDirs: ['app', 'tests'],
    files: ['**/*.{gts,gjs,ts}'],
    allowedImports: ['@ember/application', '@ember/object', '@ember/owner'],
    // tsconfig.json's `types` is for TS 7's check:types; ESLint's type-aware
    // rules need the classic-TS-friendly ember/glint types instead.
    project: './tsconfig.eslint.json',
  }),

  ...WarpDrive,
  {
    rules: {
      'warp-drive/no-legacy-request-patterns': ['error', { allowPeekRecord: true }],
    },
  },

  // node (module) ================
  node.esm(),

  // node (script) ================
  node.cjs(),

  // Test Support ================
  diagnostic.browser({
    // enableGlint: true,
    allowedImports: ['@ember/application', '@ember/object', '@ember/owner', '@glimmer/component'],
  }),
];
