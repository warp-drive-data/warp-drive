/**
 * `release <version> [--check] [--keep]`: brings in a newly tagged release that releases.json
 * already lists. Its surface from the tag, the history and diff from its predecessor (whose
 * surface the diffs before it derive), its audit, then, when it is the newest release, the
 * `update` steps so that head follows it.
 */
import { parseArgs } from 'node:util';

import { DATA_ROOT, releases, SCRATCH_ROOT } from '../artifacts.mjs';
import { runSteps } from '../cli.mjs';
import { pruneHeadDiffs, steps as updateSteps } from './update.mjs';

export const name = 'release';
export const describe =
  'for a version releases.json lists: surface, history and diff from its predecessor, audit, then the update steps';

/**
 * @param {string[]} argv
 * @param {Partial<import('../cli.mjs').Context>} [context]
 * @returns {Promise<number>}
 */
export async function run(argv, { dataRoot = DATA_ROOT, scratchRoot = SCRATCH_ROOT, cwd = process.cwd() } = {}) {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: { check: { type: 'boolean', default: false }, keep: { type: 'boolean', default: false } },
  });
  if (positionals.length !== 1) throw new Error('usage: release <version> [--check] [--keep]');
  const [version] = positionals;
  const listed = releases(dataRoot).releases;
  const index = listed.indexOf(version);
  if (index === -1) {
    throw new Error(
      `release: ${version} is not in releases.json (${listed.join(', ')}); add it there first, in release order`
    );
  }
  const previous = index > 0 ? listed[index - 1] : null;
  const newest = listed.at(-1);
  const keep = values.keep ? ['--keep'] : [];

  /** @type {[string, string[]][]} */
  const steps = [['surface', [version, ...keep]]];
  if (previous) {
    steps.push(['history', [previous, version]]);
    steps.push(['diff', [previous, version]]);
  }
  steps.push(['audit', [version]]);
  if (version === newest) steps.push(...updateSteps(version));
  const code = await runSteps('release', steps, { check: values.check, context: { dataRoot, scratchRoot, cwd } });
  if (code && !values.check) return code;
  return Math.max(code, version === newest ? pruneHeadDiffs(version, { dataRoot, check: values.check }) : 0);
}
