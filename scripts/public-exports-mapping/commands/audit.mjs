/**
 * `cli.mjs audit <version>... [--check]` and `cli.mjs audit --all [--check]`: writes the scratch
 * `audits/<version>.json` and `shapes/<version>.json` for each version (every release of
 * `releases.json` with `--all`) from the packages npm has at that version, compared with the
 * version's surface (scanned or derived from the diffs) when there is one. Both files are
 * scratch, so `--check` writes them like any run; it reports drift only through `update` and
 * `release`, whose product steps it reaches.
 */
import { parseArgs } from 'node:util';

import { DATA_ROOT, releases, report, SCRATCH_ROOT, writeArtifact } from '../artifacts.mjs';
import { auditRelease, summarize } from '../audit.mjs';
import { auditPath, loadSurface, shapesPath, surfacePath } from '../data.mjs';

export const name = 'audit';
export const describe =
  'audit <version>... | --all: the published npm packages of a release vs its surface; writes scratch audits/<version>.json and shapes/<version>.json';

const USAGE = 'usage: audit <version>... [--check] | audit --all [--check]';

/**
 * @typedef {{
 *   dataRoot?: string,
 *   scratchRoot?: string,
 *   releases?: () => { releases: string[] },
 *   packages?: (version: string) => import('../published.mjs').PackageRef[],
 *   cacheDir?: string,
 *   pack?: import('../published.mjs').Pack,
 *   log?: (line: string) => void,
 * }} RunOptions  overrides for tests; the CLI passes the roots only
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
  const roots = { dataRoot: options.dataRoot ?? DATA_ROOT, scratchRoot: options.scratchRoot ?? SCRATCH_ROOT };
  const versions = values.all ? (options.releases ?? (() => releases(roots.dataRoot)))().releases : positionals;
  const check = values.check;

  const results = [];
  for (const version of versions) {
    const surface = loadSurface(version, roots, { optional: true });
    const { audit, shapes, tarballs } = await auditRelease(version, {
      surface,
      surfaceFile: surfacePath(version, roots),
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
    results.push(writeArtifact(auditPath(version, roots), audit, { scratch: true }));
    results.push(writeArtifact(shapesPath(version, roots), shapes, { scratch: true }));
  }
  return report(results, { check, command: 'audit' });
}
