import * as gts from '@warp-drive/internal-config/eslint/gts.js';
// @ts-check
import { globalIgnores } from '@warp-drive/internal-config/eslint/ignore.js';

import { externals } from './tsdown.config.mjs';

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  // all ================
  // no block below matches plain `.ts`/`.js` anymore (oxlint fully covers them) — skip them
  // entirely rather than have ESLint attempt a default (non-decorator-aware) parse of them.
  globalIgnores(['**/*.ts', '**/*.js']),

  // gts — oxlint fully covers plain `.ts` now (syntactic + type-aware); `.gts` stays
  // ESLint-only since oxlint's parser can't scan it.
  gts.browser({
    dirname: import.meta.dirname,
    srcDirs: ['src'],
    allowedImports: externals,
  }),
];
