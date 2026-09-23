const warpdrive = require('./index');

/**
 * Internal rules encode conventions for developing a large, performance-sensitive test suite
 * like WarpDrive's own — not for consuming WarpDrive's public API. They are kept out of
 * `./recommended` because they don't apply to typical app code, but are still available here for
 * any consumer whose own test suite could benefit from the same conventions.
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
    rules: {
      'warp-drive/no-test-module-hooks': 'error',
    },
  },
];
