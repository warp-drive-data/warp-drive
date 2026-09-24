const warpdrive = require('./index');

/** @type {import('eslint').Linter.Config[]} */
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
