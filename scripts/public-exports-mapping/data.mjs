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
 * the diffs do not reach yet come only from a scan (`cli.mjs surface <version>`).
 */
import { existsSync } from 'node:fs';
import path from 'node:path';

import { DATA_ROOT, readJson, SCRATCH_ROOT, writeArtifact } from './artifacts.mjs';
import { applyDiff } from './diff.mjs';

/**
 * @typedef {{ dataRoot?: string, scratchRoot?: string }} Roots  the product and the scratch
 *   directory; cli.mjs passes both, tests point them at temporary directories
 */

/**
 * `releases.json` of `dataRoot`, or null while the directory has none (tests build bare ones).
 * @param {string} [dataRoot]
 * @returns {{ schema: 1, baseline: string, releases: string[] } | null}
 */
export function releasesIn(dataRoot = DATA_ROOT) {
  const file = path.join(dataRoot, 'releases.json');
  return existsSync(file) ? readJson(file) : null;
}

/**
 * @param {string} version
 * @param {string} [dataRoot]
 */
export function isBaseline(version, dataRoot = DATA_ROOT) {
  return releasesIn(dataRoot)?.baseline === version;
}

/**
 * The surface file's name within its root, as messages print it: `surface.<baseline>.json` in the
 * product, `surfaces/<version>.json` in scratch.
 * @param {string} version
 * @param {string} [dataRoot]
 */
export function surfaceName(version, dataRoot = DATA_ROOT) {
  return isBaseline(version, dataRoot) ? `surface.${version}.json` : `surfaces/${version}.json`;
}

/**
 * The surface file: the baseline's in the product, every other version's in scratch.
 * @param {string} version  a release version or `head`
 * @param {Roots} [roots]
 */
export function surfacePath(version, { dataRoot = DATA_ROOT, scratchRoot = SCRATCH_ROOT } = {}) {
  return isBaseline(version, dataRoot)
    ? path.join(dataRoot, surfaceName(version, dataRoot))
    : path.join(scratchRoot, 'surfaces', `${version}.json`);
}

/** @param {string} a @param {string} b @param {Roots} [roots] */
export function diffPath(a, b, { dataRoot = DATA_ROOT } = {}) {
  return path.join(dataRoot, 'diffs', `${a}-${b}.json`);
}

/** @param {string} from @param {Roots} [roots] */
export function decisionsPath(from, { dataRoot = DATA_ROOT } = {}) {
  return path.join(dataRoot, 'decisions', `${from}.json`);
}

/** @param {string} a @param {string} b @param {Roots} [roots] */
export function historyPath(a, b, { scratchRoot = SCRATCH_ROOT } = {}) {
  return path.join(scratchRoot, 'history', `${a}-${b}.json`);
}

/** @param {string} version @param {Roots} [roots] */
export function auditPath(version, { scratchRoot = SCRATCH_ROOT } = {}) {
  return path.join(scratchRoot, 'audits', `${version}.json`);
}

/** @param {string} version @param {Roots} [roots] */
export function shapesPath(version, { scratchRoot = SCRATCH_ROOT } = {}) {
  return path.join(scratchRoot, 'shapes', `${version}.json`);
}

/**
 * The surface of `version`: its file where it exists, else the surface derived from the product,
 * kept in scratch for the next command. Throws, naming the file and the command that writes it,
 * when neither is possible; with `optional`, returns null instead.
 * @param {string} version
 * @param {Roots} [roots]
 * @param {{ optional?: boolean }} [options]
 * @returns {any}
 */
export function loadSurface(version, roots = {}, { optional = false } = {}) {
  const file = surfacePath(version, roots);
  if (existsSync(file)) return readJson(file);
  const derived = deriveSurface(version, roots);
  if (derived) {
    writeArtifact(file, derived, { scratch: true });
    return derived;
  }
  if (optional) return null;
  throw new Error(`missing ${surfaceName(version, roots.dataRoot)} (\`cli.mjs surface ${version}\` writes it)`);
}

/**
 * The surface of a listed release other than the baseline, rebuilt from the baseline surface and
 * the product's diffs up to it; null when the release is not listed or a diff on the way is
 * missing. A missing baseline surface throws, since nothing derives that one.
 * @param {string} version
 * @param {Roots} [roots]
 * @returns {any | null}
 */
export function deriveSurface(version, { dataRoot = DATA_ROOT } = {}) {
  const listed = releasesIn(dataRoot);
  const index = listed ? listed.releases.indexOf(version) : -1;
  if (!listed || index <= 0) return null;
  const baselineFile = path.join(dataRoot, `surface.${listed.baseline}.json`);
  if (!existsSync(baselineFile)) {
    throw new Error(`missing surface.${listed.baseline}.json (\`cli.mjs surface ${listed.baseline}\` writes it)`);
  }
  let surface = readJson(baselineFile);
  for (let i = 1; i <= index; i++) {
    const file = diffPath(listed.releases[i - 1], listed.releases[i], { dataRoot });
    if (!existsSync(file)) return null;
    surface = applyDiff(surface, readJson(file));
  }
  return surface;
}
