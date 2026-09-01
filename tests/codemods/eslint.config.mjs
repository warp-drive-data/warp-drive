// @ts-check
import { globalIgnores } from '@warp-drive/internal-config/eslint/ignore.js';
import * as node from '@warp-drive/internal-config/eslint/node.js';
import * as oxlint from '@warp-drive/internal-config/eslint/oxlint.js';
import * as typescript from '@warp-drive/internal-config/eslint/typescript.js';

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  // all ================
  globalIgnores(),

  // node (ts) ================
  // oxlint's `--type-aware` pass now covers tests/ too — verified against real CI's
  // type-aware run.
  typescript.node({
    srcDirs: ['tests'],
    allowedImports: [],
    rules: oxlint.disabledTypeAwareRules(),
  }),

  // node (module) ================
  node.esm(),
];
