// @ts-check
import { globalIgnores } from '@warp-drive/internal-config/eslint/ignore.js';
import * as gts from '@warp-drive/internal-config/eslint/gts.js';
import * as node from '@warp-drive/internal-config/eslint/node.js';
import * as diagnostic from '@warp-drive/internal-config/eslint/diagnostic.js';
import WarpDrive from 'eslint-plugin-warp-drive/recommended';

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
