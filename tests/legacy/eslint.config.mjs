import WarpDrive from 'eslint-plugin-warp-drive/recommended';

import * as diagnostic from '@warp-drive/internal-config/eslint/diagnostic.js';
import * as gts from '@warp-drive/internal-config/eslint/gts.js';
// @ts-check
import { globalIgnores } from '@warp-drive/internal-config/eslint/ignore.js';
import * as oxlint from '@warp-drive/internal-config/eslint/oxlint.js';
import * as typescript from '@warp-drive/internal-config/eslint/typescript.js';

const AllowedImports = [
  '@ember/application',
  '@ember/array',
  '@ember/array/proxy',
  '@ember/component',
  '@ember/component/helper',
  '@ember/controller',
  '@ember/object',
  '@ember/object/computed',
  '@ember/object/mixin',
  '@ember/owner',
  '@ember/routing/route',
  '@ember/runloop',
  '@ember/service',
  '@ember/test-helpers',
  '@ember/test-waiters',
  '@glimmer/component',
  '@glimmer/tracking',
  '@glimmer/validator',
];

/** @type {import('eslint').Linter.Config[]} */
export default [
  // all ================
  // `.ts` stays matched below (typescript.browser()) so eslint-plugin-warp-drive keeps
  // running there; `.js` has no oxlint-independent rule left to run, so ESLint skips it
  // entirely rather than attempt a default (non-decorator-aware) parse of it.
  globalIgnores(['**/*.js']),

  // browser (js/ts) ================
  // oxlint fully covers plain `.ts`/`.js` now (syntactic + type-aware) — this block only
  // survives to give `.ts` files the parser eslint-plugin-warp-drive's rules below need; every
  // oxlint-owned rule is explicitly off.
  typescript.browser({
    dirname: import.meta.dirname,
    srcDirs: ['app', 'tests'],
    allowedImports: AllowedImports,
    rules: oxlint.disabledAllRules(),
  }),

  // gts — oxlint's parser can't scan `.gts`/`.gjs`, so this stays the sole enforcer there.
  gts.browser({
    dirname: import.meta.dirname,
    srcDirs: ['app', 'tests'],
    allowedImports: AllowedImports,
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
    },
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
      allowedImports: AllowedImports,
    }),
  ].filter(Boolean),
];
