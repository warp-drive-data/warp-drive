/**
 * `update [--check]`: refreshes what the working tree changes. The surface of head, then the
 * history and diff from the newest release to head, then ship; steps whose command does not
 * exist yet are skipped.
 */
import path from 'node:path';
import { parseArgs } from 'node:util';

import { DATA_ROOT, readJson } from '../artifacts.mjs';
import { runSteps } from '../cli.mjs';

export const name = 'update';
export const describe = 'surface head, then history and diff <newest release> head, then ship (the steps that exist)';

/**
 * @param {string[]} argv
 * @param {Partial<import('../cli.mjs').Context>} [context]
 * @returns {Promise<number>}
 */
export async function run(argv, { dataRoot = DATA_ROOT, cwd = process.cwd() } = {}) {
  const { values } = parseArgs({ args: argv, options: { check: { type: 'boolean', default: false } } });
  /** @type {string[]} */
  const listed = readJson(path.join(dataRoot, 'releases.json')).releases;
  const newest = listed.at(-1);
  if (!newest) throw new Error(`update: ${path.join(dataRoot, 'releases.json')} lists no release`);
  return runSteps(
    'update',
    [
      ['surface', ['head']],
      ['history', [newest, 'head']],
      ['diff', [newest, 'head']],
      ['ship', []],
    ],
    { check: values.check, context: { dataRoot, cwd } }
  );
}
