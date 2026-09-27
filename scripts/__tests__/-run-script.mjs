import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

export const SCRIPTS_DIR = path.resolve(import.meta.dirname, '..');

/**
 * The runtime used to execute a script under test.
 *
 * `SCRIPTS_RUNTIME` wins when set (e.g. `SCRIPTS_RUNTIME=bun`), otherwise the
 * script's own `#!/usr/bin/env <runtime>` shebang, otherwise `node`.
 */
export function runtimeFor(scriptPath) {
  if (process.env.SCRIPTS_RUNTIME) return process.env.SCRIPTS_RUNTIME;
  const firstLine = readFileSync(scriptPath, 'utf8').split('\n', 1)[0];
  const match = /^#!\s*(?:\S*\/env\s+)?(?:\S*\/)?(\S+)/.exec(firstLine);
  return match ? match[1] : 'node';
}

/**
 * Spawn `scripts/<name>` as a child process and return its exit code and output.
 */
export function runScript(name, args = [], { cwd, env } = {}) {
  const scriptPath = path.join(SCRIPTS_DIR, name);
  const result = spawnSync(runtimeFor(scriptPath), [scriptPath, ...args], {
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
