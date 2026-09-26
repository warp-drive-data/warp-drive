import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import url from 'node:url';

import { compareMinors } from './token.mjs';

const DIR = path.dirname(url.fileURLToPath(import.meta.url));
const MINOR = /^(\d+\.\d+)\.json$/;
const PAIR = /^(\d+\.\d+)-(\d+\.\d+)\.json$/;

/**
 * @typedef {object} Layout
 * @property {string} repoRoot
 * @property {string} snapshots
 * @property {string} steps
 * @property {string} overrides
 * @property {string} shipped   the plugin's legacy-import-mapping directory
 */

/** @type {Layout} */
export const layout = {
  repoRoot: path.resolve(DIR, '..', '..'),
  snapshots: path.join(DIR, 'snapshots'),
  steps: path.join(DIR, 'steps'),
  overrides: path.join(DIR, 'overrides'),
  shipped: path.resolve(DIR, '..', '..', 'packages/eslint-plugin-warp-drive/src/legacy-import-mapping'),
};

export const pathOf = {
  /** @param {import('./token.mjs').Minor} v */
  snapshot: (v) => path.join(layout.snapshots, `${v}.json`),
  /** @param {import('./token.mjs').Minor} a @param {import('./token.mjs').Minor} b */
  step: (a, b) => path.join(layout.steps, `${a}-${b}.json`),
  /** @param {import('./token.mjs').Minor} a @param {import('./token.mjs').Minor} b */
  overrides: (a, b) => path.join(layout.overrides, `${a}-${b}.json`),
  /** @param {import('./token.mjs').Minor} from */
  shipped: (from) => path.join(layout.shipped, `${from}.json`),
  versions: () => path.join(layout.shipped, 'versions.json'),
};

/**
 * @returns {import('./token.mjs').Minor[]}
 */
export function releasedVersions() {
  return listDir(layout.snapshots)
    .map((name) => MINOR.exec(name)?.[1])
    .filter(Boolean)
    .map((v) => /** @type {import('./token.mjs').Minor} */ (v))
    .sort(compareMinors);
}

/**
 * @param {import('./token.mjs').Minor} version
 * @returns {import('./surface.mjs').Snapshot}
 */
export function loadSnapshot(version) {
  return loadJson(pathOf.snapshot(version), 'snapshot', { version });
}

/**
 * @param {import('./token.mjs').Minor} from
 * @param {import('./token.mjs').Minor} to
 * @returns {import('./step.mjs').StepMap}
 */
export function loadStep(from, to) {
  return loadJson(pathOf.step(from, to), 'step', { from, to });
}

/**
 * @param {import('./token.mjs').Minor} from
 * @param {import('./token.mjs').Minor} to
 * @returns {import('./step.mjs').Overrides | null}
 */
export function loadOverrides(from, to) {
  const file = pathOf.overrides(from, to);
  return existsSync(file) ? loadJson(file, 'overrides', { from, to }) : null;
}

/**
 * @returns {{ from: import('./token.mjs').Minor, to: import('./token.mjs').Minor }[]}
 */
export function overridePairs() {
  return listDir(layout.overrides)
    .map((name) => PAIR.exec(name))
    .filter(Boolean)
    .map((m) => ({
      from: /** @type {import('./token.mjs').Minor} */ (m[1]),
      to: /** @type {import('./token.mjs').Minor} */ (m[2]),
    }));
}

/**
 * @param {string} file
 * @param {string} kind
 * @param {Record<string, string>} expected  envelope fields the name implies
 */
function loadJson(file, kind, expected) {
  if (!existsSync(file)) throw new Error(`${relative(file)} does not exist`);
  const value = JSON.parse(readFileSync(file, 'utf8'));
  if (value.schema !== 1 || value.kind !== kind) {
    throw new Error(`${relative(file)} is not a schema 1 ${kind} file`);
  }
  for (const [field, want] of Object.entries(expected)) {
    if (value[field] !== want) throw new Error(`${relative(file)} declares ${field} ${value[field]}, expected ${want}`);
  }
  return value;
}

/**
 * @typedef {Map<string, string>} Desired
 */

/**
 * @param {import('./surface.mjs').Snapshot | import('./step.mjs').StepMap | import('./merge.mjs').MergedMap | import('./merge.mjs').MergedDelta | string[]} value
 * @returns {string}
 */
export function canonical(value) {
  return JSON.stringify(value, null, 2) + '\n';
}

/**
 * @typedef {object} CheckResult
 * @property {string} path
 * @property {'clean' | 'stale' | 'missing' | 'extra'} status
 * @property {string} [diff]   unified diff, present for `stale`
 */

/**
 * @param {Desired} desired
 * @param {{ check: boolean, managed: string[] }} opts
 * @returns {CheckResult[]}  one per desired path plus one per extra file, sorted by path
 */
export function sync(desired, opts) {
  /** @type {CheckResult[]} */
  const results = [];
  for (const [file, text] of desired) {
    if (!existsSync(file)) {
      results.push({ path: file, status: 'missing' });
    } else if (readFileSync(file, 'utf8') === text) {
      results.push({ path: file, status: 'clean' });
    } else {
      results.push({ path: file, status: 'stale', diff: unifiedDiff(file, text) });
    }
  }
  for (const dir of opts.managed) {
    for (const name of listDir(dir)) {
      const file = path.join(dir, name);
      if (!desired.has(file)) results.push({ path: file, status: 'extra' });
    }
  }
  results.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));

  if (!opts.check) {
    for (const result of results) {
      if (result.status === 'extra') unlinkSync(result.path);
      if (result.status === 'stale' || result.status === 'missing') {
        mkdirSync(path.dirname(result.path), { recursive: true });
        writeFileSync(result.path, desired.get(result.path), 'utf8');
      }
    }
  }
  return results;
}

/** @param {string} file */
export function relative(file) {
  return path.relative(layout.repoRoot, file);
}

function unifiedDiff(file, text) {
  const label = relative(file);
  const out = spawnSync('diff', ['-u', '--label', `a/${label}`, '--label', `b/${label}`, file, '-'], {
    input: text,
    encoding: 'utf8',
    maxBuffer: 1 << 28,
  });
  return out.stdout;
}

function listDir(dir) {
  return existsSync(dir) ? readdirSync(dir).filter((name) => name.endsWith('.json')) : [];
}
