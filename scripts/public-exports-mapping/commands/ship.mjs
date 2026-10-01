import { parseArgs } from 'node:util';

import { DATA_ROOT, SHIPPED_ROOT } from '../artifacts.mjs';
import { ship } from '../ship.mjs';

export const name = 'ship';
export const describe =
  'ship [--check]: copy releases, the baseline surface, diffs, decisions and preferences into eslint-plugin-warp-drive and write messages.json';

/**
 * Writes the data files of `packages/eslint-plugin-warp-drive/src/legacy-import-mapping/` from
 * the pipeline's data; with `--check`, prints what would change, writes nothing and resolves to 1
 * on a difference or a stale decision. Throws on a usage error or a missing input.
 * @param {string[]} argv  the arguments after the command name
 * @param {{ dataRoot?: string, cwd?: string, shippedRoot?: string }} [context]  `dataRoot` is where
 *   the data lives; `cwd` is not used, since ship reads no source tree; `shippedRoot`, beyond the
 *   contract's context, is where the data goes, for tests
 * @returns {Promise<number>} the exit code
 */
export async function run(argv, { dataRoot = DATA_ROOT, shippedRoot = SHIPPED_ROOT } = {}) {
  const { values } = parseArgs({ args: argv, options: { check: { type: 'boolean', default: false } } });
  return ship({ check: values.check, dataRoot, shippedRoot }).code;
}
