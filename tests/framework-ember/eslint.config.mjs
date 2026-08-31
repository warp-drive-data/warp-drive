import * as diagnostic from '@warp-drive/internal-config/eslint/diagnostic.js';
import * as gts from '@warp-drive/internal-config/eslint/gts.js';
// @ts-check
import { globalIgnores } from '@warp-drive/internal-config/eslint/ignore.js';
import * as node from '@warp-drive/internal-config/eslint/node.js';
import * as oxlint from '@warp-drive/internal-config/eslint/oxlint.js';
import * as typescript from '@warp-drive/internal-config/eslint/typescript.js';

const externals = ['@ember/component/template-only', '@glimmer/component', '@ember/modifier', '@ember/helper'];

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  // all ================
  globalIgnores(),

  // browser (js/ts) ================
  typescript.browser({
    dirname: import.meta.dirname,
    srcDirs: ['tests'],
    allowedImports: externals,
    // tsconfig.json's `types` is for TS 7's check:types; ESLint's type-aware
    // rules need the classic-TS-friendly ember/glint types instead.
    project: './tsconfig.eslint.json',
    // oxlint's `--type-aware` pass now covers this cleanly (tsconfig.json carries the same
    // ember/glint ambient types tsconfig.eslint.json gives ESLint) — verified against real
    // CI's type-aware run. `.gts` files are handled by the separate gts.browser() block below,
    // which keeps full type-aware ESLint coverage since oxlint's parser can't scan those.
    rules: oxlint.disabledTypeAwareRules(),
  }),

  // gts
  gts.browser({
    dirname: import.meta.dirname,
    srcDirs: ['tests'],
    allowedImports: externals,
    project: './tsconfig.eslint.json',
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
  diagnostic.browser({
    allowedImports: externals,
  }),
];
