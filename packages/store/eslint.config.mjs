import * as js from '@warp-drive/internal-config/eslint/browser.js';
// @ts-check
import { globalIgnores } from '@warp-drive/internal-config/eslint/ignore.js';
import * as node from '@warp-drive/internal-config/eslint/node.js';
import * as oxlint from '@warp-drive/internal-config/eslint/oxlint.js';
import * as typescript from '@warp-drive/internal-config/eslint/typescript.js';

import { externals } from './tsdown.config.mjs';

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  // all ================
  globalIgnores(),

  js.browser({
    srcDirs: ['src'],
    allowedImports: externals,
  }),

  // browser (js/ts) ================
  typescript.browser({
    dirname: import.meta.dirname,
    srcDirs: ['src'],
    allowedImports: externals,
    // oxlint's `--type-aware` pass (see tools/internal-config/oxlint/type-aware-scoped-dirs.txt)
    // covers `src` cleanly here — verified against real CI's type-aware run — so ESLint no
    // longer needs to run the type-aware rules oxlint now owns for these files.
    rules: oxlint.disabledTypeAwareRules(),
  }),

  // node (module) ================
  node.esm(),

  // node (script) ================
  node.cjs(),
];
