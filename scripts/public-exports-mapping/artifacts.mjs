import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import url from 'node:url';

export const REPO_ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..', '..');
export const DATA_ROOT = path.join(REPO_ROOT, 'scripts', 'public-exports-mapping');
export const SHIPPED_ROOT = path.join(
  REPO_ROOT,
  'packages',
  'eslint-plugin-warp-drive',
  'src',
  'legacy-import-mapping'
);

/** @returns {{ schema: 1, baseline: string, releases: string[] }} */
export function releases() {
  return readJson(path.join(DATA_ROOT, 'releases.json'));
}

/**
 * Sorts object keys recursively so that equal data serializes to equal bytes. Arrays keep
 * their order, because order is meaningful there (ranking, release order).
 * @template T
 * @param {T} value
 * @returns {T}
 */
export function sortKeys(value) {
  if (Array.isArray(value)) return /** @type {T} */ (value.map(sortKeys));
  if (value && typeof value === 'object') {
    const out = /** @type {Record<string, unknown>} */ ({});
    for (const key of Object.keys(value).sort())
      out[key] = sortKeys(/** @type {Record<string, unknown>} */ (value)[key]);
    return /** @type {T} */ (out);
  }
  return value;
}

/**
 * The one serialization every artifact uses: sorted keys, two-space indent, trailing newline.
 * @param {unknown} value
 */
export function canonical(value) {
  return JSON.stringify(sortKeys(value), null, 2) + '\n';
}

/**
 * @param {string} file
 * @returns {any}
 */
export function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf8'));
}

/**
 * Writes `value` to `file` when the bytes differ. In check mode nothing is written; the
 * result says whether the file would change so the caller can print it and exit 1.
 * @param {string} file  absolute path
 * @param {unknown} value
 * @param {{ check?: boolean }} [options]
 * @returns {{ file: string, changed: boolean, written: boolean, before: string | null, after: string }}
 */
export function writeArtifact(file, value, { check = false } = {}) {
  const after = canonical(value);
  const before = existsSync(file) ? readFileSync(file, 'utf8') : null;
  const changed = before !== after;
  if (changed && !check) {
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, after);
  }
  return { file, changed, written: changed && !check, before, after };
}

/**
 * Prints one line per changed artifact and returns the exit code a `--check` run should use.
 * @param {ReturnType<typeof writeArtifact>[]} results
 * @param {{ check?: boolean, command: string }} options
 */
export function report(results, { check = false, command }) {
  const changed = results.filter((r) => r.changed);
  for (const r of changed) {
    const lines = (text) => (text === null ? 0 : text.split('\n').length - 1);
    const verb = check ? 'would change' : 'wrote';
    console.log(
      `${command}: ${verb} ${path.relative(REPO_ROOT, r.file)} (${lines(r.before)} -> ${lines(r.after)} lines)`
    );
  }
  console.log(`${command}: ${results.length} artifacts, ${changed.length} ${check ? 'drifted' : 'written'}`);
  return check && changed.length ? 1 : 0;
}
