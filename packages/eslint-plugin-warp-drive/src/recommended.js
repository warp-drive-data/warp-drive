/**
 * @module
 * @summary Flat ESLint config that registers the `warp-drive` plugin and turns on its recommended rules as errors.
 */

const warpdrive = require('./index');

/**
 * @summary Flat ESLint config array that registers the `warp-drive` plugin and turns on its recommended set of rules as
 * errors.
 * @type {import('eslint').Linter.Config[]}
 */
module.exports = [
  {
    plugins: {
      'warp-drive': warpdrive,
    },
  },
  {
    rules: {
      'warp-drive/no-create-record-rerender': 'error',
      'warp-drive/no-external-request-patterns': 'error',
      'warp-drive/no-invalid-relationships': 'error',
      'warp-drive/no-invalid-resource-ids': ['error', {}],
      'warp-drive/no-invalid-resource-types': ['error', {}],
      'warp-drive/no-legacy-request-patterns': 'error',
      'warp-drive/no-legacy-imports': 'error',
    },
  },
];
