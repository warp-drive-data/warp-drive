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
  typescript.node({
    srcDirs: ['src', 'bin', 'utils'],
    allowedImports: [],
    rules: {
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      // oxlint's `--type-aware` pass (see tools/internal-config/oxlint/type-aware-scoped-dirs.txt)
      // covers this cleanly — verified against real CI's type-aware run — so ESLint no longer
      // needs to run the type-aware rules oxlint now owns for these files.
      ...oxlint.disabledTypeAwareRules(),
    },
  }),

  // node (module) ================
  node.esm(),
];
