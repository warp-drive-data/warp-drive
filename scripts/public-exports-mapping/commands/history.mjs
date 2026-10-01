import { existsSync } from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';

import { DATA_ROOT, readJson, REPO_ROOT, report, writeArtifact } from '../artifacts.mjs';
import { historyOf } from '../history.mjs';

export const name = 'history';
export const describe =
  'history <a> <b> [--check]: file renames and symbol moves between two releases, from git, into history/<a>-<b>.json';

/**
 * Writes `history/<a>-<b>.json`. `symbols` needs `surfaces/<a>.json` and `surfaces/<b>.json`;
 * while either is missing the file carries `files` only, and running again once both exist
 * fills `symbols` in.
 * @param {string[]} argv  the arguments after the command name
 * @param {{ dataRoot?: string, cwd?: string }} [options]  where the artifacts live and which
 *   repository git reads; tests point them at fixtures
 * @returns {Promise<number>} the exit code
 */
export async function run(argv, { dataRoot = DATA_ROOT, cwd = REPO_ROOT } = {}) {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: { check: { type: 'boolean', default: false } },
  });
  if (positionals.length !== 2 || positionals[0] === 'head') {
    throw new Error('usage: history <a> <b> [--check], where <a> is a release and <b> a later release or head');
  }
  const [a, b] = positionals;
  const surfaces = [a, b].map((version) => {
    const file = path.join(dataRoot, 'surfaces', `${version}.json`);
    return existsSync(file) ? readJson(file) : null;
  });
  const [surfaceA, surfaceB] = surfaces;
  const missing = [a, b].filter((_, i) => !surfaces[i]).map((version) => `surfaces/${version}.json`);
  if (missing.length) {
    // eslint-disable-next-line no-console -- a command reports on stdout, as report() does
    console.log(`history ${a} ${b}: no ${missing.join(' or ')} yet, so symbols stays empty until both surfaces exist`);
  }
  const history = historyOf(a, b, { surfaceA, surfaceB, cwd });
  const result = writeArtifact(path.join(dataRoot, 'history', `${a}-${b}.json`), history, { check: values.check });
  return report([result], { check: values.check, command: name });
}
