// @ts-check
import { globalIgnores } from '@warp-drive/internal-config/eslint/ignore.js';
import * as js from '@warp-drive/internal-config/eslint/browser.js';
import * as node from '@warp-drive/internal-config/eslint/node.js';

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  // all ================
  globalIgnores(),

  // browser (js) ================ (bundled into the app by vite)
  js.browser({
    files: ['src/index.js', 'src/-private/**/*.js'],
    allowedImports: ['@ember/debug', 'ember-qunit', 'qunit'],
  }),

  // node (module) ================ (the CLI/orchestration side)
  node.esm({
    files: ['src/node/**/*.js', 'bin/*.js'],
  }),
];
