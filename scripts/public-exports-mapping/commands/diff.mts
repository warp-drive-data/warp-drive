import { existsSync } from 'node:fs';
import { parseArgs } from 'node:util';

import { DATA_ROOT, readJson, report, SCRATCH_ROOT, writeArtifact } from '../artifacts.mts';
import { diffPath, historyPath, loadSurface, surfaceName } from '../data.mts';
import { diffSurfaces } from '../diff.mts';
import { discontinued } from '../history.mts';

export const name = 'diff';
export const describe = 'diff <a> <b> [--check]: diffs/<a>-<b>.json from two surfaces and their history';

/**
 * Writes `diffs/<a>-<b>.json`, a product file, from the two surfaces (scanned, or derived from the
 * diffs before them) and the scratch `history/<a>-<b>.json`. `diffSurfaces` refuses a diff that
 * would not rebuild surface `b`.
 * @param argv  the arguments after the command name
 * @param options  where the data and the scratch live; tests point them at fixtures
 * @returns the exit code
 */
export async function run(
  argv: string[],
  { dataRoot = DATA_ROOT, scratchRoot = SCRATCH_ROOT }: { dataRoot?: string; scratchRoot?: string } = {}
): Promise<number> {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: { check: { type: 'boolean', default: false } },
  });
  if (positionals.length !== 2 || positionals[0] === 'head') {
    throw new Error('usage: diff <a> <b> [--check], where <a> is a release and <b> a later release or head');
  }
  const [a, b] = positionals;
  const roots = { dataRoot, scratchRoot };
  const history = historyPath(a, b, roots);
  const inputs = [
    { file: surfaceName(a, dataRoot), by: `cli.mts surface ${a}`, value: loadSurface(a, roots, { optional: true }) },
    { file: surfaceName(b, dataRoot), by: `cli.mts surface ${b}`, value: loadSurface(b, roots, { optional: true }) },
    {
      file: `history/${a}-${b}.json`,
      by: `cli.mts history ${a} ${b}`,
      value: existsSync(history) ? readJson(history) : null,
    },
  ];
  const missing = inputs.filter(({ value }) => !value);
  if (missing.length) {
    const list = missing.map(({ file, by }) => `${file} (\`${by}\` writes it)`).join(', ');
    throw new Error(`diff ${a} ${b}: missing ${list}`);
  }
  const [surfaceA, surfaceB, historyDoc] = inputs.map(({ value }) => value);
  if (!Object.keys(historyDoc.symbols).length && discontinued(historyDoc.files, surfaceA, surfaceB).length) {
    // eslint-disable-next-line no-console -- a command reports on stdout, as report() does
    console.log(
      `diff: history/${a}-${b}.json has no symbols although some declarations of ${a} are not in ${b}; ` +
        `\`cli.mts history ${a} ${b}\` fills them in now that both surfaces exist`
    );
  }
  const diff = diffSurfaces(surfaceA, surfaceB, historyDoc);
  const result = writeArtifact(diffPath(a, b, roots), diff, { check: values.check });
  return report([result], { check: values.check, command: name });
}
