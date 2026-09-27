import { spawnSync, type SpawnSyncReturns } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export const RELEASE_DIR = path.resolve(import.meta.dirname, '..');
export const REPO_ROOT = path.resolve(RELEASE_DIR, '../..');
export const CLI = path.join(RELEASE_DIR, 'index.ts');

// eslint-disable-next-line no-control-regex
const ANSI = /\u001b\[[0-9;]*m/g;

export function stripAnsi(text: string): string {
  return text.replace(ANSI, '');
}

export type RunResult = {
  status: number | null;
  stdout: string;
  stderr: string;
  /** stdout with ANSI color codes removed */
  text: string;
};

function toResult(result: SpawnSyncReturns<string>): RunResult {
  if (result.error) {
    throw result.error;
  }
  return {
    status: result.status,
    stdout: result.stdout,
    stderr: result.stderr,
    text: stripAnsi(result.stdout),
  };
}

/**
 * Runs the release CLI the way the root `release` script does: by executing
 * `tools/release/index.ts` directly, so its shebang picks the runtime.
 *
 * Set RELEASE_CLI_RUNTIME (e.g. `bun` or `node`) to force a runtime instead.
 */
export function runCli(
  args: string[],
  options: { cwd?: string; env?: NodeJS.ProcessEnv; timeout?: number } = {}
): RunResult {
  const runtime = process.env.RELEASE_CLI_RUNTIME;
  const [command, commandArgs] = runtime ? [runtime, [CLI, ...args]] : [CLI, args];
  return toResult(
    spawnSync(command, commandArgs, {
      cwd: options.cwd ?? REPO_ROOT,
      env: options.env ?? process.env,
      encoding: 'utf8',
      timeout: options.timeout ?? 60_000,
    })
  );
}

export function run(
  command: string,
  args: string[],
  options: { cwd: string; env?: NodeJS.ProcessEnv; timeout?: number }
): RunResult {
  return toResult(
    spawnSync(command, args, {
      cwd: options.cwd,
      env: options.env ?? process.env,
      encoding: 'utf8',
      timeout: options.timeout ?? 60_000,
    })
  );
}

export function makeTempDir(prefix: string): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), `warp-drive-release-${prefix}-`));
}

export function writeFile(filePath: string, contents: string, mode?: number): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, contents);
  if (mode !== undefined) {
    fs.chmodSync(filePath, mode);
  }
}

export function writeJson(filePath: string, data: unknown): void {
  writeFile(filePath, JSON.stringify(data, null, 2) + '\n');
}

export function readJson<T = Record<string, unknown>>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
}

/**
 * Resolves the absolute path of an executable on the current PATH.
 */
export function which(bin: string): string {
  for (const dir of (process.env.PATH ?? '').split(path.delimiter)) {
    const candidate = path.join(dir, bin);
    try {
      fs.accessSync(candidate, fs.constants.X_OK);
      if (fs.statSync(candidate).isFile()) {
        return candidate;
      }
    } catch {
      // not in this directory
    }
  }
  throw new Error(`Could not find ${bin} on PATH`);
}

export const DIST_TAGS = {
  latest: '5.8.1',
  beta: '5.9.0-beta.3',
  canary: '5.10.0-alpha.12',
  lts: '5.4.2',
};

/**
 * Creates a directory of stub executables to prepend to PATH:
 *
 * - `npm` answers `npm view ember-data@latest --json` with fixed dist-tags,
 *   so `latest-for` never touches the registry.
 * - `pnpm` records `pnpm publish ...` calls into `publish.log` instead of
 *   publishing, and forwards every other invocation to the real pnpm.
 */
export function createStubBin(): {
  dir: string;
  publishLog: string;
  env: (base?: NodeJS.ProcessEnv) => NodeJS.ProcessEnv;
} {
  const dir = makeTempDir('bin');
  const publishLog = path.join(dir, 'publish.log');
  const realPnpm = which('pnpm');

  writeFile(
    path.join(dir, 'npm'),
    `#!/bin/sh
if [ "$1" = "view" ] && [ "$2" = "ember-data@latest" ] && [ "$3" = "--json" ]; then
  echo '${JSON.stringify({ name: 'ember-data', 'dist-tags': DIST_TAGS })}'
  exit 0
fi
echo "unexpected npm invocation: $*" >&2
exit 1
`,
    0o755
  );

  writeFile(
    path.join(dir, 'pnpm'),
    `#!/bin/sh
if [ "$1" = "publish" ]; then
  echo "$*" >> "${publishLog}"
  echo "stub: pnpm $*"
  exit 0
fi
exec "${realPnpm}" "$@"
`,
    0o755
  );

  return {
    dir,
    publishLog,
    env(base: NodeJS.ProcessEnv = process.env) {
      return { ...base, PATH: `${dir}${path.delimiter}${base.PATH ?? ''}` };
    },
  };
}
