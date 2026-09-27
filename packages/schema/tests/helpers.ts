import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { TestContext } from 'node:test';
import { stripVTControlCharacters } from 'node:util';

export const PACKAGE_ROOT = path.resolve(import.meta.dirname, '..');

/**
 * The runtime used to execute the CLI entry points. Defaults to `node`;
 * set `SCHEMA_CLI_RUNNER=bun` to run the same specs against bun.
 */
const RUNNER = process.env.SCHEMA_CLI_RUNNER || 'node';

export interface CliResult {
  status: number | null;
  stdout: string;
  stderr: string;
}

/**
 * Creates an empty temp directory to act as the user's project, removed
 * again once the calling test finishes.
 */
export function setupProject(t: TestContext, files: Record<string, string> = {}): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'warp-drive-schema-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));

  for (const [relativePath, contents] of Object.entries(files)) {
    const filePath = path.join(dir, relativePath);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, contents);
  }

  return dir;
}

/**
 * Runs one of the package's CLI entry points (a path relative to the
 * package root) with the given arguments from inside `cwd`.
 */
export function runCli(entry: string, args: string[], cwd: string): CliResult {
  const result = spawnSync(RUNNER, [path.join(PACKAGE_ROOT, entry), ...args], {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, NO_COLOR: '1', FORCE_COLOR: '0' },
  });

  if (result.error) {
    throw result.error;
  }

  return {
    status: result.status,
    stdout: stripVTControlCharacters(result.stdout),
    stderr: stripVTControlCharacters(result.stderr),
  };
}

export function readFile(dir: string, relativePath: string): string {
  return fs.readFileSync(path.join(dir, relativePath), 'utf8');
}

export function fileExists(dir: string, relativePath: string): boolean {
  return fs.existsSync(path.join(dir, relativePath));
}
