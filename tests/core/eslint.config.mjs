import WarpDrive from 'eslint-plugin-warp-drive/recommended';

import * as diagnostic from '@warp-drive/internal-config/eslint/diagnostic.js';
import * as gts from '@warp-drive/internal-config/eslint/gts.js';
// @ts-check
import { globalIgnores } from '@warp-drive/internal-config/eslint/ignore.js';
import * as node from '@warp-drive/internal-config/eslint/node.js';
import * as oxlint from '@warp-drive/internal-config/eslint/oxlint.js';
import * as typescript from '@warp-drive/internal-config/eslint/typescript.js';

/** @type {import('eslint').Linter.Config[]} */
export default [
  // all ================
  globalIgnores(),

  // browser (ts) ================
  // oxlint's `--type-aware` pass covers app/ and tests/ cleanly (tsconfig.json carries the
  // ember/glint ambient types directly) — verified against real CI's type-aware run.
  typescript.browser({
    dirname: import.meta.dirname,
    srcDirs: ['app', 'tests'],
    allowedImports: ['@ember/application', '@ember/object', '@ember/owner'],
    rules: oxlint.disabledTypeAwareRules(),
  }),

  // gts
  gts.browser({
    dirname: import.meta.dirname,
    srcDirs: ['app', 'tests'],
    files: ['**/*.{gts,gjs}'],
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
  ...diagnostic.browser({
    // enableGlint: true,
    allowedImports: ['@ember/application', '@ember/object', '@ember/owner', '@glimmer/component'],
  }),
];
