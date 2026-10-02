/**
 * Fixture trees for the public-exports-mapping tests. A tree maps a relative path to the file's
 * contents: a string, or for a JSON file the value, written two-space indented with its keys in the
 * order given (an exports map resolves in key order, so trees never get their keys sorted).
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

/** @typedef {Record<string, unknown>} Tree */

/**
 * Writes `files` under `root`; a value that is not a string is written as JSON.
 * @param {string} root
 * @param {Tree} files
 */
export function writeTree(root, files) {
  for (const [file, contents] of Object.entries(files)) {
    const target = path.join(root, file);
    mkdirSync(path.dirname(target), { recursive: true });
    writeFileSync(target, typeof contents === 'string' ? contents : JSON.stringify(contents, null, 2) + '\n');
  }
}

/**
 * Writes a tree into a fresh temp directory, removed when the process exits, and returns the
 * directory.
 * @param {Tree} files
 * @param {string} [prefix]
 */
export function materialize(files, prefix = 'warp-drive-fixture-') {
  const dir = mkdtempSync(path.join(tmpdir(), prefix));
  writeTree(dir, files);
  process.on('exit', () => rmSync(dir, { recursive: true, force: true }));
  return dir;
}
