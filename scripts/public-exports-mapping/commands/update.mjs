/* eslint-disable no-console -- a command reports on stdout, as report() does */
/**
 * `update [--check]`: refreshes what the working tree changes. The surface of head and the
 * history from the newest release to it (both scratch), then the product diff from the newest
 * release to head, then `judge --check`; finally the `*-head.json` diff of an older release, left
 * behind when a release lands, is removed.
 */
import { existsSync, readdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';

import { DATA_ROOT, releases, SCRATCH_ROOT } from '../artifacts.mjs';
import { runSteps } from '../cli.mjs';

export const name = 'update';
export const describe = 'surface head, history and diff <newest release> head, judge --check';

/**
 * @param {string[]} argv
 * @param {Partial<import('../cli.mjs').Context>} [context]
 * @returns {Promise<number>}
 */
export async function run(argv, { dataRoot = DATA_ROOT, scratchRoot = SCRATCH_ROOT, cwd = process.cwd() } = {}) {
  const { values } = parseArgs({ args: argv, options: { check: { type: 'boolean', default: false } } });
  const newest = releases(dataRoot).releases.at(-1);
  if (!newest) throw new Error(`update: ${path.join(dataRoot, 'releases.json')} lists no release`);
  const code = await runSteps('update', steps(newest), {
    check: values.check,
    context: { dataRoot, scratchRoot, cwd },
  });
  if (code && !values.check) return code;
  return Math.max(code, pruneHeadDiffs(newest, { dataRoot, check: values.check }));
}

/**
 * The steps `update` runs, which `release` runs too once a release has landed.
 * @param {string} newest  the newest release
 * @returns {[string, string[]][]}
 */
export function steps(newest) {
  return [
    ['surface', ['head']],
    ['history', [newest, 'head']],
    ['diff', [newest, 'head']],
    // decisions are judged against the newest release; a choice that the surfaces no longer
    // carry is stale and fails here, whether or not --check was given (judge never calls the model in this mode)
    ['judge', ['--check']],
  ];
}

/**
 * Removes `diffs/<v>-head.json` for every `v` but the newest release: head follows the newest
 * release only. In check mode it prints what it would remove and returns 1.
 * @param {string} newest
 * @param {{ dataRoot: string, check: boolean }} options
 */
export function pruneHeadDiffs(newest, { dataRoot, check }) {
  const dir = path.join(dataRoot, 'diffs');
  if (!existsSync(dir)) return 0;
  const stale = readdirSync(dir)
    .filter((file) => file.endsWith('-head.json') && file !== `${newest}-head.json`)
    .sort();
  for (const file of stale) {
    if (!check) rmSync(path.join(dir, file));
    console.log(`update: ${check ? 'would remove' : 'removed'} diffs/${file} (head follows ${newest} now)`);
  }
  return check && stale.length ? 1 : 0;
}
