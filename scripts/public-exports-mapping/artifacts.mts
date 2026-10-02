import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import url from 'node:url';

export const REPO_ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..', '..');

/**
 * The data directory (CONTRACT.md, "Layout and ownership"): the plugin's `legacy-import-mapping/`,
 * the one copy of what the pipeline produces and the rule reads. `releases.json`,
 * `surface.<baseline>.json`, `diffs/`, `decisions/`, `preferences.json` and `messages.json` live
 * there, under git.
 */
export const DATA_ROOT = path.join(REPO_ROOT, 'packages', 'eslint-plugin-warp-drive', 'src', 'legacy-import-mapping');

/**
 * Where everything else a command computes goes: the surfaces of the other releases and of head,
 * the histories, the audits, the shapes and the judge's bundles. Git ignores `tmp/`; a command
 * that needs one of these files and does not find it computes it again (see data.mts).
 */
export const SCRATCH_ROOT = path.join(REPO_ROOT, 'tmp', 'public-exports-mapping');

export function releases(dataRoot: string = DATA_ROOT): { schema: 1; baseline: string; releases: string[] } {
  return readJson(path.join(dataRoot, 'releases.json'));
}

/**
 * Sorts object keys recursively so that equal data serializes to equal bytes. Arrays keep
 * their order, because order is meaningful there (ranking, release order).
 */
export function sortKeys<T>(value: T): T {
  if (Array.isArray(value)) return value.map(sortKeys) as T;
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value).sort()) out[key] = sortKeys((value as Record<string, unknown>)[key]);
    return out as T;
  }
  return value;
}

/**
 * The one serialization every artifact uses: sorted keys, two-space indent, trailing newline.
 */
export function canonical(value: unknown) {
  return JSON.stringify(sortKeys(value), null, 2) + '\n';
}

export function readJson(file: string): any {
  return JSON.parse(readFileSync(file, 'utf8'));
}

/**
 * Writes `value` to `file` when the bytes differ. A product file (the default) is not written in
 * check mode: the result says whether it would change, so the caller can print it and exit 1. A
 * `scratch` file is written whatever the mode, since later steps read it and nothing tracks it.
 * @param file  absolute path
 */
export function writeArtifact(
  file: string,
  value: unknown,
  { check = false, scratch = false }: { check?: boolean; scratch?: boolean } = {}
): { file: string; changed: boolean; written: boolean; scratch: boolean; before: string | null; after: string } {
  const after = canonical(value);
  const before = existsSync(file) ? readFileSync(file, 'utf8') : null;
  const changed = before !== after;
  const written = changed && (scratch || !check);
  if (written) {
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, after);
  }
  return { file, changed, written, scratch, before, after };
}

/**
 * Prints one line per changed artifact and returns the exit code a `--check` run should use: 1
 * when a product file would change. A scratch file is never drift.
 */
export function report(
  results: ReturnType<typeof writeArtifact>[],
  { check = false, command }: { check?: boolean; command: string }
) {
  const changed = results.filter((r) => r.changed);
  for (const r of changed) {
    const lines = (text: string | null) => (text === null ? 0 : text.split('\n').length - 1);
    const verb = r.written ? 'wrote' : 'would change';
    console.log(
      `${command}: ${verb} ${path.relative(REPO_ROOT, r.file)} (${lines(r.before)} -> ${lines(r.after)} lines)`
    );
  }
  const drifted = changed.filter((r) => !r.scratch);
  console.log(
    check
      ? `${command}: ${results.length} artifacts, ${drifted.length} drifted`
      : `${command}: ${results.length} artifacts, ${changed.length} written`
  );
  return check && drifted.length ? 1 : 0;
}
