// @ts-check
import { globalIgnores } from '@warp-drive/internal-config/eslint/ignore.js';
import * as node from '@warp-drive/internal-config/eslint/node.js';
import * as oxlint from '@warp-drive/internal-config/eslint/oxlint.js';
import * as typescript from '@warp-drive/internal-config/eslint/typescript.js';

import { externals } from './tsdown.config.mjs';

/** @type {import('eslint').Linter.Config[]} */
export default [
  // all ================
  globalIgnores(),

  // browser (js/ts) ================
  typescript.browser({
    dirname: import.meta.dirname,
    srcDirs: ['src'],
    allowedImports: externals,
    rules: {
      '@typescript-eslint/no-inferrable-types': 'off',
      // oxlint's `--type-aware` pass (see tools/internal-config/oxlint/type-aware-scoped-dirs.txt)
      // covers `src` cleanly here — its only real findings were in the untyped plain
      // promise-proxy-base.js, which oxlint no longer type-checks (see .oxlintrc.json's
      // "**/*.js" override) — verified against real CI's type-aware run.
      ...oxlint.disabledTypeAwareRules(),
    },
  }),

  // node (module) ================
  node.esm(),

  // node (script) ================
  node.cjs(),
];
