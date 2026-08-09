const warpdrive = require('./index');
const emberEslintParser = require('ember-eslint-parser');

/**
 * Template rules operate on the Glimmer template AST (`Glimmer`-prefixed node types,
 * e.g. `GlimmerElementNode`) that `ember-eslint-parser` exposes to ESLint for `.gjs`/`.gts`
 * files. This config wires up that parser for `.gjs`/`.gts` files and enables the
 * recommended template rules; it is intentionally separate from `./recommended`, which
 * only covers plain JS/TS rules and does not require or configure any particular parser.
 *
 * For `.hbs` files, apply `ember-eslint-parser/hbs` as the parser for `**\/*.hbs` instead.
 *
 * @type {import('eslint').Linter.Config[]}
 */
module.exports = [
  {
    plugins: {
      'warp-drive': warpdrive,
    },
  },
  {
    files: ['**/*.{gjs,gts}'],
    languageOptions: {
      parser: emberEslintParser,
    },
    rules: {
      'warp-drive/template-always-use-request-content': 'error',
    },
  },
];
