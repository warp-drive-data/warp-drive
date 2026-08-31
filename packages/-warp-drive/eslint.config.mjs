// @ts-check
import { globalIgnores } from '@warp-drive/internal-config/eslint/ignore.js';
import * as node from '@warp-drive/internal-config/eslint/node.js';
import * as oxlint from '@warp-drive/internal-config/eslint/oxlint.js';
import * as typescript from '@warp-drive/internal-config/eslint/typescript.js';

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  // all ================
  globalIgnores(),

  // browser (ts) ================
  typescript.node({
    files: ['**/*.ts'],
    srcDirs: ['src'],
    allowedImports: [],
    // oxlint's `--type-aware` pass (see tools/internal-config/oxlint/type-aware-scoped-dirs.txt)
    // covers this cleanly — verified against real CI's type-aware run. The remaining genuine
    // findings (JSON.parse into a typed cache, a regex-capture flowing to styleText) are
    // suppressed inline via oxlint-disable as documented debt rather than a mechanical fix.
    rules: oxlint.disabledTypeAwareRules(),
  }),

  // node (module) ================
  node.esm(),

  // node (script) ================
  node.cjs(),
];
