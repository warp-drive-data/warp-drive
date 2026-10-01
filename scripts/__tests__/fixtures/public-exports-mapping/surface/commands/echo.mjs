// A stand-in command for the cli.mjs loader tests: records each call, fails on request.
export const name = 'echo';
export const describe = 'records its arguments';

/** @type {{ argv: string[], context: unknown }[]} */
export const calls = [];

/**
 * @param {string[]} argv
 * @param {unknown} context
 * @returns {Promise<number>}
 */
export async function run(argv, context) {
  calls.push({ argv, context });
  if (argv.includes('--usage')) throw new Error('usage: echo [--fail] [--usage]');
  return argv.includes('--fail') ? 3 : 0;
}
