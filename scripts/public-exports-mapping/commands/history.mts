import { parseArgs } from 'node:util';

import { DATA_ROOT, REPO_ROOT, report, SCRATCH_ROOT, writeArtifact } from '../artifacts.mts';
import { historyPath, loadSurface, surfaceName } from '../data.mts';
import { historyOf } from '../history.mts';

export const name = 'history';
export const describe =
  'history <a> <b> [--check]: file renames and symbol moves between two releases, from git, into the scratch history/<a>-<b>.json';

/**
 * Writes `history/<a>-<b>.json` in scratch, whatever the mode. `symbols` needs both surfaces;
 * while one is not available (head before `surface head`) the file carries `files` only, and
 * running again once it is fills `symbols` in.
 * @param argv  the arguments after the command name
 * @param options  where the data and the scratch live and which repository git reads; tests point
 *   them at fixtures
 * @returns the exit code
 */
export async function run(
  argv: string[],
  {
    dataRoot = DATA_ROOT,
    scratchRoot = SCRATCH_ROOT,
    cwd = REPO_ROOT,
  }: { dataRoot?: string; scratchRoot?: string; cwd?: string } = {}
): Promise<number> {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: { check: { type: 'boolean', default: false } },
  });
  if (positionals.length !== 2 || positionals[0] === 'head') {
    throw new Error('usage: history <a> <b> [--check], where <a> is a release and <b> a later release or head');
  }
  const [a, b] = positionals;
  const roots = { dataRoot, scratchRoot };
  const [surfaceA, surfaceB] = [a, b].map((version) => loadSurface(version, roots, { optional: true }));
  const missing = [a, b].filter((_, i) => ![surfaceA, surfaceB][i]).map((version) => surfaceName(version, dataRoot));
  if (missing.length) {
    // eslint-disable-next-line no-console -- a command reports on stdout, as report() does
    console.log(`history ${a} ${b}: no ${missing.join(' or ')} yet, so symbols stays empty until both surfaces exist`);
  }
  const history = historyOf(a, b, { surfaceA, surfaceB, cwd });
  const result = writeArtifact(historyPath(a, b, roots), history, { scratch: true });
  return report([result], { check: values.check, command: name });
}
