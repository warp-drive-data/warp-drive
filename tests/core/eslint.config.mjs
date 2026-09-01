import WarpDrive from 'eslint-plugin-warp-drive/recommended';

import * as diagnostic from '@warp-drive/internal-config/eslint/diagnostic.js';
import * as gts from '@warp-drive/internal-config/eslint/gts.js';
// @ts-check
import { globalIgnores } from '@warp-drive/internal-config/eslint/ignore.js';
import * as oxlint from '@warp-drive/internal-config/eslint/oxlint.js';
import * as typescript from '@warp-drive/internal-config/eslint/typescript.js';

/** @type {import('eslint').Linter.Config[]} */
export default [
  // all ================
  // `.ts` stays matched below (typescript.browser()) so eslint-plugin-warp-drive keeps
  // running there; `.js` has no oxlint-independent rule left to run, so ESLint skips it
  // entirely rather than attempt a default (non-decorator-aware) parse of it.
  globalIgnores(['**/*.js']),

  // browser (ts) ================
  // oxlint fully covers plain `.ts` now (syntactic + type-aware) — this block only survives to
  // give `.ts` files the parser eslint-plugin-warp-drive's rules below need; every oxlint-owned
  // rule is explicitly off.
  typescript.browser({
    dirname: import.meta.dirname,
    srcDirs: ['app', 'tests'],
    allowedImports: ['@ember/application', '@ember/object', '@ember/owner'],
    rules: oxlint.disabledAllRules(),
  }),

  // gts — oxlint's parser can't scan `.gts`/`.gjs`, so this stays the sole enforcer there.
  gts.browser({
    dirname: import.meta.dirname,
    srcDirs: ['app', 'tests'],
    files: ['**/*.{gts,gjs}'],
    allowedImports: ['@ember/application', '@ember/object', '@ember/owner'],
  }),

  // eslint-plugin-warp-drive has no oxlint equivalent — keeps running on every file above.
  ...WarpDrive,
  {
    rules: {
      'warp-drive/no-legacy-request-patterns': ['error', { allowPeekRecord: true }],
    },
  },

  // Test Support (`.gts`/`.gjs` only — oxlint's `qunit` jsPlugin covers plain `.ts`/`.js`)
  ...[
    diagnostic.templateTag({
      allowedImports: ['@ember/application', '@ember/object', '@ember/owner', '@glimmer/component'],
    }),
  ].filter(Boolean),
];
