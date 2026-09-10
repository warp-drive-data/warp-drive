const warpdrive = require('./index');

/**
 * React rules operate on the JSX AST rather than the JS/TS AST used by `./recommended`
 * or the Glimmer template AST used by `./recommended-templates`. This config enables
 * JSX parsing for `.jsx`/`.tsx` files and turns on the recommended React rules.
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
    files: ['**/*.{jsx,tsx}'],
    languageOptions: {
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      'warp-drive/require-request-error-block': 'error',
    },
  },
];
