import * as gts from '@warp-drive/internal-config/eslint/gts.js';
// @ts-check
import { globalIgnores } from '@warp-drive/internal-config/eslint/ignore.js';
import * as qunit from '@warp-drive/internal-config/eslint/qunit.js';

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
  'qunit',
];

/** @type {import('eslint').Linter.Config[]} */
export default [
  // all ================
  // no block below matches plain `.ts`/`.js` anymore (oxlint fully covers them) — skip them
  // entirely rather than have ESLint attempt a default (non-decorator-aware) parse of them.
  globalIgnores(['**/*.ts', '**/*.js']),

  // gts — oxlint fully covers plain `.ts`/`.js` now (syntactic + type-aware); `.gts`/`.gjs`
  // stay ESLint-only since oxlint's parser can't scan them.
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

  // Test Support (`.gts`/`.gjs` only — oxlint's `qunit` jsPlugin covers plain `.ts`/`.js`)
  ...[
    qunit.ember({
      allowedImports: AllowedImports,
    }).templateTag,
  ].filter(Boolean),
];
