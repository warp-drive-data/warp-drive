/**
 * Where the data lives (CONTRACT.md, "Layout and ownership"), and the surfaces derived from it.
 *
 * The product is `dataRoot`, the plugin's `legacy-import-mapping/`: `releases.json`,
 * `surface.<baseline>.json`, `diffs/<a>-<b>.json`, `decisions/<from>.json`, `preferences.json`
 * and `messages.json`, tracked by git and shipped with the plugin. Everything else a command
 * computes is scratch under `scratchRoot`: `surfaces/<version>.json` for the other releases and
 * for head, `history/`, `audits/`, `shapes/` and the judge's output. Git ignores it.
 *
 * A release surface that scratch does not have is derived here from the product, by applying the
 * diffs to the baseline surface, which is how the rule rebuilds it too; `diff` refuses a diff that
 * would not rebuild its surface, so a derived surface equals the scanned one. `head` and a release
 * the diffs do not reach yet come only from a scan (`cli.mts surface <version>`).
 */
import { existsSync } from 'node:fs';
import path from 'node:path';

import { DATA_ROOT, readJson, SCRATCH_ROOT, writeArtifact } from './artifacts.mts';
import { applyDiff, type Surface } from './diff.mts';

/**
 * The product and the scratch directory; cli.mts passes both, tests point them at temporary
 * directories.
 */
export type Roots = { dataRoot?: string; scratchRoot?: string };

/**
 * `releases.json` of `dataRoot`, or null while the directory has none (tests build bare ones).
 */
export function releasesIn(dataRoot: string = DATA_ROOT): { schema: 1; baseline: string; releases: string[] } | null {
  const file = path.join(dataRoot, 'releases.json');
  return existsSync(file) ? readJson(file) : null;
}

export function isBaseline(version: string, dataRoot: string = DATA_ROOT) {
  return releasesIn(dataRoot)?.baseline === version;
}

/**
 * The surface file's name within its root, as messages print it: `surface.<baseline>.json` in the
 * product, `surfaces/<version>.json` in scratch.
 */
export function surfaceName(version: string, dataRoot: string = DATA_ROOT) {
  return isBaseline(version, dataRoot) ? `surface.${version}.json` : `surfaces/${version}.json`;
}

/**
 * The surface file: the baseline's in the product, every other version's in scratch.
 * @param version  a release version or `head`
 */
export function surfacePath(version: string, { dataRoot = DATA_ROOT, scratchRoot = SCRATCH_ROOT }: Roots = {}) {
  return isBaseline(version, dataRoot)
    ? path.join(dataRoot, surfaceName(version, dataRoot))
    : path.join(scratchRoot, 'surfaces', `${version}.json`);
}

export function diffPath(a: string, b: string, { dataRoot = DATA_ROOT }: Roots = {}) {
  return path.join(dataRoot, 'diffs', `${a}-${b}.json`);
}

export function decisionsPath(from: string, { dataRoot = DATA_ROOT }: Roots = {}) {
  return path.join(dataRoot, 'decisions', `${from}.json`);
}

export function historyPath(a: string, b: string, { scratchRoot = SCRATCH_ROOT }: Roots = {}) {
  return path.join(scratchRoot, 'history', `${a}-${b}.json`);
}

export function auditPath(version: string, { scratchRoot = SCRATCH_ROOT }: Roots = {}) {
  return path.join(scratchRoot, 'audits', `${version}.json`);
}

export function shapesPath(version: string, { scratchRoot = SCRATCH_ROOT }: Roots = {}) {
  return path.join(scratchRoot, 'shapes', `${version}.json`);
}

/**
 * The surface of `version`: its file where it exists, else the surface derived from the product,
 * kept in scratch for the next command. Throws, naming the file and the command that writes it,
 * when neither is possible; with `optional`, returns null instead.
 */
export function loadSurface(
  version: string,
  roots: Roots = {},
  { optional = false }: { optional?: boolean } = {}
): any {
  const file = surfacePath(version, roots);
  if (existsSync(file)) return readJson(file);
  const derived = deriveSurface(version, roots);
  if (derived) {
    writeArtifact(file, derived, { scratch: true });
    return derived;
  }
  if (optional) return null;
  throw new Error(`missing ${surfaceName(version, roots.dataRoot)} (\`cli.mts surface ${version}\` writes it)`);
}

/**
 * The surface of a listed release other than the baseline, rebuilt from the baseline surface and
 * the product's diffs up to it; null when the release is not listed or a diff on the way is
 * missing. A missing baseline surface throws, since nothing derives that one.
 */
export function deriveSurface(version: string, { dataRoot = DATA_ROOT }: Roots = {}): Surface | null {
  const listed = releasesIn(dataRoot);
  const index = listed ? listed.releases.indexOf(version) : -1;
  if (!listed || index <= 0) return null;
  const baselineFile = path.join(dataRoot, `surface.${listed.baseline}.json`);
  if (!existsSync(baselineFile)) {
    throw new Error(`missing surface.${listed.baseline}.json (\`cli.mts surface ${listed.baseline}\` writes it)`);
  }
  let surface: Surface = readJson(baselineFile);
  for (let i = 1; i <= index; i++) {
    const file = diffPath(listed.releases[i - 1], listed.releases[i], { dataRoot });
    if (!existsSync(file)) return null;
    surface = applyDiff(surface, readJson(file));
  }
  return surface;
}
