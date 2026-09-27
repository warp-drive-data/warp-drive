import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

export const SCRIPTS_DIR = path.resolve(import.meta.dirname, '..');

/**
 * Spawn `scripts/<name>` with the node binary running the tests and return
 * its exit code and output.
 */
export function runScript(name, args = [], { cwd, env } = {}) {
  const scriptPath = path.join(SCRIPTS_DIR, name);
  const result = spawnSync(process.execPath, [scriptPath, ...args], {
    cwd,
    env: { ...process.env, NO_COLOR: '1', FORCE_COLOR: '0', ...env },
    encoding: 'utf8',
  });
  if (result.error) throw result.error;
  return { status: result.status, stdout: plain(result.stdout), stderr: plain(result.stderr) };
}

/**
 * A fresh temp directory, removed again when the test finishes.
 */
export function tempDir(t, prefix = 'warp-drive-scripts-') {
  const dir = mkdtempSync(path.join(tmpdir(), prefix));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
}

/**
 * Remove ANSI color codes so assertions do not depend on terminal detection.
 */
export function plain(text) {
  // eslint-disable-next-line no-control-regex
  return text.replace(/\x1b\[[0-9;]*m/g, '');
}
