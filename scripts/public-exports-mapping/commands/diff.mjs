import { existsSync } from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';

import { DATA_ROOT, readJson, report, writeArtifact } from '../artifacts.mjs';
import { diffSurfaces } from '../diff.mjs';
import { discontinued } from '../history.mjs';

export const name = 'diff';
export const describe = 'diff <a> <b> [--check]: diffs/<a>-<b>.json from two surfaces and their history';

/**
 * Writes `diffs/<a>-<b>.json` from `surfaces/<a>.json`, `surfaces/<b>.json` and
 * `history/<a>-<b>.json`. `diffSurfaces` refuses a diff that would not rebuild surface `b`.
 * @param {string[]} argv  the arguments after the command name
 * @param {{ dataRoot?: string }} [options]  where the artifacts live; tests point it at fixtures
 * @returns {Promise<number>} the exit code
 */
export async function run(argv, { dataRoot = DATA_ROOT } = {}) {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: { check: { type: 'boolean', default: false } },
  });
  if (positionals.length !== 2 || positionals[0] === 'head') {
    throw new Error('usage: diff <a> <b> [--check], where <a> is a release and <b> a later release or head');
  }
  const [a, b] = positionals;
  const inputs = [
    { file: `surfaces/${a}.json`, by: `cli.mjs surface ${a}` },
    { file: `surfaces/${b}.json`, by: `cli.mjs surface ${b}` },
    { file: `history/${a}-${b}.json`, by: `cli.mjs history ${a} ${b}` },
  ];
  const missing = inputs.filter(({ file }) => !existsSync(path.join(dataRoot, file)));
  if (missing.length) {
    const list = missing.map(({ file, by }) => `${file} (\`${by}\` writes it)`).join(', ');
    throw new Error(`diff ${a} ${b}: missing ${list}`);
  }
  const [surfaceA, surfaceB, history] = inputs.map(({ file }) => readJson(path.join(dataRoot, file)));
  if (!Object.keys(history.symbols).length && discontinued(history.files, surfaceA, surfaceB).length) {
    // eslint-disable-next-line no-console -- a command reports on stdout, as report() does
    console.log(
      `diff: history/${a}-${b}.json has no symbols although some declarations of ${a} are not in ${b}; ` +
        `\`cli.mjs history ${a} ${b}\` fills them in now that both surfaces exist`
    );
  }
  const diff = diffSurfaces(surfaceA, surfaceB, history);
  const result = writeArtifact(path.join(dataRoot, 'diffs', `${a}-${b}.json`), diff, { check: values.check });
  return report([result], { check: values.check, command: name });
}
