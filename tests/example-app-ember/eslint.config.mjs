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
    srcDirs: ['app'],
    allowedImports: [
      '@ember/application',
      '@ember/debug',
      '@ember/routing/route',
      '@ember/service',
      '@glimmer/component',
      '@glimmer/tracking',
    ],
    // oxlint's `--type-aware` pass now covers this cleanly (tsconfig.json carries the ember/glint
    // ambient types directly) — verified against real CI's type-aware run.
    rules: oxlint.disabledTypeAwareRules(),
  }),

  // browser (js/ts) — tests ================
  // tests/** isn't in oxlint's scoped-dirs.txt (qunit-covered test files stay on ESLint — see
  // that file's header comment), so no oxlint handoff for this portion.
  typescript.browser({
    dirname: import.meta.dirname,
    srcDirs: ['tests'],
    allowedImports: [
      '@ember/application',
      '@ember/debug',
      '@ember/routing/route',
      '@ember/service',
      '@glimmer/component',
      '@glimmer/tracking',
    ],
  }),

  // node (module) ================
  node.esm(),

  // node (script) ================
  node.cjs(),

  // Test Support ================
  qunit.ember(),
];
