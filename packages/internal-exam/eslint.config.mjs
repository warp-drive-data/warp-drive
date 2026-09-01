import * as js from '@warp-drive/internal-config/eslint/browser.js';
// @ts-check
import { globalIgnores } from '@warp-drive/internal-config/eslint/ignore.js';
import * as node from '@warp-drive/internal-config/eslint/node.js';

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  // all ================
  globalIgnores(),

  // browser (js) ================ (bundled into the app by vite)
  // this package is deliberately excluded from oxlint's scan (see
  // tools/internal-config/oxlint/scoped-dirs.txt's header comment), so ESLint keeps enforcing
  // the full rule set here rather than deferring to oxlint.
  ...js.browser({
    files: ['src/index.js', 'src/-private/**/*.js'],
    allowedImports: ['@ember/debug', 'ember-qunit', 'qunit'],
    oxlintScoped: false,
  }),

  // node (module) ================ (the CLI/orchestration side)
  node.esm({
    files: ['src/node/**/*.js', 'bin/*.js'],
  }),
];
