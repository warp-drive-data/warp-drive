import * as js from '@warp-drive/internal-config/eslint/browser.js';
// @ts-check
import { globalIgnores } from '@warp-drive/internal-config/eslint/ignore.js';
import * as node from '@warp-drive/internal-config/eslint/node.js';
import * as oxlint from '@warp-drive/internal-config/eslint/oxlint.js';
import * as typescript from '@warp-drive/internal-config/eslint/typescript.js';

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  // all ================
  globalIgnores(),

  // browser (js) ================
  js.browser({
    srcDirs: ['src'],
    allowedImports: ['@ember/object', '@ember/application', '@ember/service', '@ember/debug', '@ember/object/mixin'],
  }),

  // browser (ts) ================
  typescript.browser({
    dirname: import.meta.dirname,
    files: ['**/*.ts', '**/*.gts'],
    srcDirs: ['src'],
    allowedImports: ['@ember/object', '@ember/application', '@ember/service', '@ember/debug', '@ember/object/mixin'],
    // oxlint's `--type-aware` pass (see tools/internal-config/oxlint/type-aware-scoped-dirs.txt)
    // covers `src` cleanly here — verified against real CI's type-aware run — so ESLint no
    // longer needs to run the type-aware rules oxlint now owns for these files. This package
    // has no `.gts` sources today (oxlint's parser can't scan those), so this is safe; if that
    // changes, split this block so `.gts` keeps full type-aware ESLint coverage.
    rules: oxlint.disabledTypeAwareRules(),
  }),

  // node (module) ================
  node.esm(),

  // node (script) ================
  node.cjs(),
];
