import * as diagnostic from '@warp-drive/internal-config/eslint/diagnostic.js';
import * as gts from '@warp-drive/internal-config/eslint/gts.js';
// @ts-check
import { globalIgnores } from '@warp-drive/internal-config/eslint/ignore.js';
import * as node from '@warp-drive/internal-config/eslint/node.js';
import * as oxlint from '@warp-drive/internal-config/eslint/oxlint.js';
import * as typescript from '@warp-drive/internal-config/eslint/typescript.js';

const externals = [
  '@glimmer/tracking',
  '@glimmer/component',
  '@ember/object',
  '@ember/owner',
  '@ember/component/template-only',
  '@glimmer/component',
  '@ember/modifier',
  '@ember/helper',
];

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
    allowedImports: externals,
    rules: oxlint.disabledTypeAwareRules(),
  }),

  // gts
  gts.browser({
    dirname: import.meta.dirname,
    srcDirs: ['tests'],
    allowedImports: externals,
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
    },
  }),

  // node (module) ================
  node.esm(),

  // node (script) ================
  node.cjs(),

  // Test Support ================
  ...diagnostic.browser({
    allowedImports: externals,
  }),
];
