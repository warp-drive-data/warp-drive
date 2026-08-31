// @ts-check
import { globalIgnores } from '@warp-drive/internal-config/eslint/ignore.js';
import * as node from '@warp-drive/internal-config/eslint/node.js';
import * as oxlint from '@warp-drive/internal-config/eslint/oxlint.js';
import * as qunit from '@warp-drive/internal-config/eslint/qunit.js';
import * as typescript from '@warp-drive/internal-config/eslint/typescript.js';

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  // all ================
  globalIgnores(),

  // browser (js/ts) ================
  typescript.browser({
    dirname: import.meta.dirname,
    srcDirs: ['app', 'tests'],
    allowedImports: [
      '@ember/application',
      '@ember/debug',
      '@ember/routing/route',
      '@ember/service',
      '@glimmer/component',
      '@glimmer/tracking',
    ],
    // tsconfig.json's `types` is for TS 7's check:types; ESLint's type-aware
    // rules need the classic-TS-friendly ember/glint types instead.
    project: './tsconfig.eslint.json',
    // oxlint's `--type-aware` pass now covers this cleanly (tsconfig.json carries the same
    // ember/glint ambient types tsconfig.eslint.json gives ESLint) — verified against real
    // CI's type-aware run.
    rules: oxlint.disabledTypeAwareRules(),
  }),

  // node (module) ================
  node.esm(),

  // node (script) ================
  node.cjs(),

  // Test Support ================
  qunit.ember(),
];
