import * as diagnostic from '@warp-drive/internal-config/eslint/diagnostic.js';
// @ts-check
import { globalIgnores } from '@warp-drive/internal-config/eslint/ignore.js';
import * as node from '@warp-drive/internal-config/eslint/node.js';
import * as oxlint from '@warp-drive/internal-config/eslint/oxlint.js';
import * as typescript from '@warp-drive/internal-config/eslint/typescript.js';

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  // all ================
  globalIgnores(),

  // browser (js/ts) ================
  // oxlint's `--type-aware` pass now covers tests/ too — verified against real CI's
  // type-aware run.
  typescript.browser({
    dirname: import.meta.dirname,
    srcDirs: ['tests'],
    allowedImports: ['@ember/application'],
    rules: oxlint.disabledTypeAwareRules(),
  }),

  // node (module) ================
  node.esm(),

  // node (script) ================
  node.cjs(),

  // Test Support ================
  ...diagnostic.browser({
    allowedImports: ['@ember/object'],
  }),
];
