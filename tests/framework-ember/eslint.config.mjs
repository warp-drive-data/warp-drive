import * as diagnostic from '@warp-drive/internal-config/eslint/diagnostic.js';
import * as gts from '@warp-drive/internal-config/eslint/gts.js';
// @ts-check
import { globalIgnores } from '@warp-drive/internal-config/eslint/ignore.js';

const externals = ['@ember/component/template-only', '@glimmer/component', '@ember/modifier', '@ember/helper'];

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  // all ================
  // no block below matches plain `.ts`/`.js` anymore (oxlint fully covers them) — skip them
  // entirely rather than have ESLint attempt a default (non-decorator-aware) parse of them.
  globalIgnores(['**/*.ts', '**/*.js']),

  // gts — oxlint fully covers plain `.ts` now (syntactic + type-aware); `.gts`/`.gjs` stay
  // ESLint-only since oxlint's parser can't scan them.
  gts.browser({
    dirname: import.meta.dirname,
    srcDirs: ['tests'],
    allowedImports: externals,
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
    },
  }),

  // Test Support (`.gts`/`.gjs` only — oxlint's `qunit` jsPlugin covers plain `.ts`/`.js`)
  ...[diagnostic.templateTag({ allowedImports: externals })].filter(Boolean),
];
