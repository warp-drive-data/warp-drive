// @ts-check
import { globalIgnores } from '@warp-drive/internal-config/eslint/ignore.js';
import * as node from '@warp-drive/internal-config/eslint/node.js';
import * as qunit from '@warp-drive/internal-config/eslint/qunit.js';
import * as typescript from '@warp-drive/internal-config/eslint/typescript.js';

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  // all ================
  globalIgnores(),

  // browser (js/ts) ================
  typescript.browser({
    dirname: import.meta.dirname,
    srcDirs: ['app', 'tests'],
    allowedImports: [
      '@ember/application',
      '@ember/debug',
      '@ember/routing/route',
      '@ember/service',
      '@glimmer/component',
      '@glimmer/tracking',
    ],
    // tsconfig.json's `types` is for TS 7's check:types; ESLint's type-aware
    // rules need the classic-TS-friendly ember/glint types instead.
    project: './tsconfig.eslint.json',
  }),

  // node (module) ================
  node.esm(),

  // node (script) ================
  node.cjs(),

  // Test Support ================
  qunit.ember(),
];
