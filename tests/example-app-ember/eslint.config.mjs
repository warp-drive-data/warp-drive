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
  // oxlint's `--type-aware` pass now covers app/ and tests/ cleanly (tsconfig.json carries the
  // ember/glint ambient types directly, and tests/ is now in scoped-dirs.txt too) — verified
  // against real CI's type-aware run.
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
    rules: oxlint.disabledTypeAwareRules(),
  }),

  // node (module) ================
  node.esm(),

  // node (script) ================
  node.cjs(),

  // Test Support ================
  ...qunit.toArray(qunit.ember()),
];
