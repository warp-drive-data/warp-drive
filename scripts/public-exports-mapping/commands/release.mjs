/**
 * `release <version> [--check] [--keep]`: brings in a newly tagged release that releases.json
 * already lists. Its surface (and its predecessor's, when that file is missing), the history
 * and diff from the predecessor, its audit, then ship; steps whose command does not exist yet
 * are skipped.
 */
import { existsSync } from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';

import { DATA_ROOT, readJson } from '../artifacts.mjs';
import { runSteps } from '../cli.mjs';
import { surfacePath } from '../surface.mjs';

export const name = 'release';
export const describe =
  'for a version releases.json lists: surface, history and diff from its predecessor, audit, then ship';

/**
 * @param {string[]} argv
 * @param {Partial<import('../cli.mjs').Context>} [context]
 * @returns {Promise<number>}
 */
export async function run(argv, { dataRoot = DATA_ROOT, cwd = process.cwd() } = {}) {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: { check: { type: 'boolean', default: false }, keep: { type: 'boolean', default: false } },
  });
  if (positionals.length !== 1) throw new Error('usage: release <version> [--check] [--keep]');
  const [version] = positionals;
  /** @type {string[]} */
  const listed = readJson(path.join(dataRoot, 'releases.json')).releases;
  const index = listed.indexOf(version);
  if (index === -1) {
    throw new Error(
      `release: ${version} is not in releases.json (${listed.join(', ')}); add it there first, in release order`
    );
  }
  const previous = index > 0 ? listed[index - 1] : null;
  const keep = values.keep ? ['--keep'] : [];

  /** @type {[string, string[]][]} */
  const steps = [];
  if (previous && !existsSync(surfacePath(previous, dataRoot))) steps.push(['surface', [previous, ...keep]]);
  steps.push(['surface', [version, ...keep]]);
  if (previous) {
    steps.push(['history', [previous, version]]);
    steps.push(['diff', [previous, version]]);
  }
  steps.push(['audit', [version]]);
  // a decision whose choice the new release no longer carries is stale; judge --check reports it
  // without calling the model, and the residue is judged again by hand with `judge --from`
  steps.push(['judge', ['--check']]);
  steps.push(['ship', []]);
  return runSteps('release', steps, { check: values.check, context: { dataRoot, cwd } });
}
