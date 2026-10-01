/**
 * `cli.mjs audit <version>... [--check]` and `cli.mjs audit --all [--check]`: writes
 * `audits/<version>.json` and `shapes/<version>.json` for each version (every release of
 * `releases.json` with `--all`) from the packages npm has at that version, compared with
 * `surfaces/<version>.json` when it exists. With `--check` nothing is written: each file that
 * would change is printed and the exit code is 1.
 */
import path from 'node:path';
import { parseArgs } from 'node:util';

import { DATA_ROOT, releases, report, writeArtifact } from '../artifacts.mjs';
import { auditRelease, loadSurface, surfacePath, summarize } from '../audit.mjs';

export const name = 'audit';
export const describe =
  'audit <version>... | --all [--check]: the published npm packages of a release vs its surface; writes audits/<version>.json and shapes/<version>.json';

const USAGE = 'usage: audit <version>... [--check] | audit --all [--check]';

/**
 * @typedef {{
 *   dataRoot?: string,
 *   releases?: () => { releases: string[] },
 *   packages?: (version: string) => import('../published.mjs').PackageRef[],
 *   cacheDir?: string,
 *   pack?: import('../published.mjs').Pack,
 *   log?: (line: string) => void,
 * }} RunOptions  overrides for tests; the CLI passes none
 */

/**
 * @param {string[]} argv  the arguments after the command name
 * @param {RunOptions} [options]
 * @returns {Promise<number>} the exit code
 */
export async function run(argv, options = {}) {
  // eslint-disable-next-line no-console
  const log = options.log ?? ((line) => console.log(line));
  let parsed;
  try {
    parsed = parseArgs({
      args: argv[0] === name ? argv.slice(1) : argv,
      allowPositionals: true,
      options: { all: { type: 'boolean', default: false }, check: { type: 'boolean', default: false } },
    });
  } catch (error) {
    log(`audit: ${/** @type {Error} */ (error).message}\n${USAGE}`);
    return 2;
  }
  const { values, positionals } = parsed;
  if (values.all ? positionals.length > 0 : positionals.length === 0) {
    log(USAGE);
    return 2;
  }
  const dataRoot = options.dataRoot ?? DATA_ROOT;
  const versions = values.all ? (options.releases ?? releases)().releases : positionals;
  const check = values.check;

  const results = [];
  for (const version of versions) {
    const surface = loadSurface(version, { dataRoot });
    const { audit, shapes, tarballs } = await auditRelease(version, {
      surface,
      surfaceFile: surfacePath(version, dataRoot),
      packages: options.packages?.(version),
      cacheDir: options.cacheDir,
      pack: options.pack,
    });
    const totals = summarize(audit);
    const fetched = tarballs.filter((t) => t.status === 'fetched').length;
    log(
      `audit ${version}: ${totals.packages} packages (${totals.unpublished} unpublished, ${fetched} fetched), ` +
        `${totals.modules} modules, ${totals.tokens} tokens, ${totals.missing} exports targets missing, ` +
        `${Object.keys(shapes.shapes).length} shapes, surface ${surface ? 'compared' : 'not found'}`
    );
    results.push(writeArtifact(path.join(dataRoot, 'audits', `${version}.json`), audit, { check }));
    results.push(writeArtifact(path.join(dataRoot, 'shapes', `${version}.json`), shapes, { check }));
  }
  return report(results, { check, command: 'audit' });
}
