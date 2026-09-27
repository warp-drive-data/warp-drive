/**
 * Shared helpers for the black-box specs of the sync-* scripts.
 *
 * Each spec builds a throwaway monorepo in a temp directory and runs one of
 * the `src/sync-*.ts` wrappers against it with node, with `cwd` set to that
 * monorepo, exactly as `pnpm sync-*` does from the real repo root.
 *
 * A `pnpm` stub on `PATH` records every call instead of running anything, so
 * no spec ever runs the real prettier against the fixture.
 */
import { parse as parseJsonc } from 'comment-json';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export const PACKAGE_DIR = path.resolve(import.meta.dirname, '..');

export type SyncScript =
  | 'sync-all'
  | 'sync-license'
  | 'sync-logos'
  | 'sync-readme-tables'
  | 'sync-references'
  | 'sync-scripts';

export interface Fixture {
  root: string;
  binDir: string;
  callsLog: string;
  path: (...segments: string[]) => string;
  read: (...segments: string[]) => string;
  readJson: <T = Record<string, unknown>>(...segments: string[]) => T;
  /** Reads a JSON-with-comments file (tsconfig.json) as plain data, dropping comments. */
  readJsonc: <T = Record<string, unknown>>(...segments: string[]) => T;
  exists: (...segments: string[]) => boolean;
  write: (file: string, content: string) => void;
  snapshot: () => Map<string, string>;
  cleanup: () => void;
}

export interface RunResult {
  code: number | null;
  stdout: string;
  stderr: string;
}

export const README_INTRO = '# Fixture Monorepo\n\nIntro text that must survive.\n';
export const README_MIDDLE = '\nText between the two tables that must survive.\n';
export const README_OUTRO = '\nOutro text that must survive.\n';

export const COMPATIBILITY_START = '<!-- START-COMPATIBILITY-TABLE-PLACEHOLDER -->';
export const COMPATIBILITY_END = '<!-- END-COMPATIBILITY-TABLE-PLACEHOLDER -->';
export const VERSIONS_START = '<!-- START-VERSIONS-TABLE-PLACEHOLDER -->';
export const VERSIONS_END = '<!-- END-VERSIONS-TABLE-PLACEHOLDER -->';

const README = [
  README_INTRO,
  COMPATIBILITY_START,
  '| stale | compatibility | table |',
  COMPATIBILITY_END,
  README_MIDDLE,
  VERSIONS_START,
  '| stale | versions | table |',
  VERSIONS_END,
  README_OUTRO,
].join('\n');

function json(value: unknown) {
  return JSON.stringify(value, null, 2) + '\n';
}

/**
 * The files of the fixture monorepo, relative to its root.
 *
 * - `@fixture/alpha` and `@fixture/beta` are public packages, beta depends on alpha.
 * - `@fixture/private-thing` is a private package without a tsconfig.
 * - `fixture-exam-app` (testem + ember-exam) and `fixture-testem-app` (testem only)
 *   are test apps under `tests/`.
 */
export const FIXTURE_FILES: Record<string, string> = {
  'pnpm-workspace.yaml': `packages:\n  - 'packages/*'\n  - 'tests/*'\n`,
  'pnpm-lock.yaml': `lockfileVersion: '9.0'\n`,
  'package.json': json({
    name: 'root',
    version: '0.0.0',
    private: true,
    // like the real root; the pnpm engine must not stop the scripts from running
    engines: {
      pnpm: '12.6.0',
    },
    scripts: {
      'lint:prettier:fix': 'prettier --write .',
    },
  }),
  'LICENSE.md': 'The Fixture License\n\nCopyright fixture authors.\n',
  'README.md': README,
  'logos/synced/logo.svg': '<svg id="logo"></svg>\n',
  'logos/synced/icons/mark.svg': '<svg id="mark"></svg>\n',
  'logos/not-synced.txt': 'only the docs site gets the full logos directory\n',

  'packages/alpha/package.json': json({
    name: '@fixture/alpha',
    version: '1.0.0',
    files: ['dist'],
    scripts: {
      lint: 'echo old-lint',
    },
  }),
  'packages/alpha/tsconfig.json': [
    '{',
    '  // alpha keeps this comment',
    '  "compilerOptions": {',
    '    "declarationDir": "unstable-preview-types", // where types are emitted',
    '    "lib": ["ESNext", "DOM"],',
    '    "composite": false',
    '  },',
    '  "include": ["src/**/*"]',
    '}',
    '',
  ].join('\n'),
  'packages/alpha/logos/stale.svg': '<svg id="stale"></svg>\n',

  'packages/beta/package.json': json({
    name: '@fixture/beta',
    version: '1.0.0',
    license: 'ISC',
    dependencies: {
      '@fixture/alpha': 'workspace:*',
    },
    peerDependencies: {
      '@fixture/alpha': 'workspace:*',
      'external-lib': '^1.0.0',
    },
    devDependencies: {
      '@fixture/alpha': 'workspace:*',
    },
  }),
  'packages/beta/tsconfig.json': [
    '{',
    '  /* beta keeps this block comment */',
    '  "compilerOptions": {',
    '    "strict": false',
    '  }',
    '}',
    '',
  ].join('\n'),

  'packages/private-thing/package.json': json({
    name: '@fixture/private-thing',
    version: '1.0.0',
    private: true,
  }),

  'tests/exam-app/package.json': json({
    name: 'fixture-exam-app',
    version: '0.0.0',
    private: true,
    scripts: {
      start: 'stale start',
    },
    devDependencies: {
      '@fixture/beta': 'workspace:*',
      'ember-exam': '^9.0.0',
      testem: '^3.0.0',
    },
  }),
  'tests/exam-app/tsconfig.json': [
    '{',
    '  // the exam app keeps this comment',
    '  "compilerOptions": {',
    '    "rootDir": "."',
    '  }',
    '}',
    '',
  ].join('\n'),

  'tests/testem-app/package.json': json({
    name: 'fixture-testem-app',
    version: '0.0.0',
    private: true,
    devDependencies: {
      testem: '^3.0.0',
    },
  }),
};

export function createFixture(): Fixture {
  // realpath so the paths we compare against match what the scripts resolve
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'wd-internal-tooling-')));
  const binDir = path.join(root, '.fixture-bin');
  const callsLog = path.join(root, '.fixture-calls.log');

  const write = (file: string, content: string) => {
    const target = path.join(root, file);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, content);
  };

  for (const [file, content] of Object.entries(FIXTURE_FILES)) {
    write(file, content);
  }

  // A `pnpm` stub that records how it was called instead of running anything,
  // so no spec ever runs the real prettier against the fixture.
  fs.mkdirSync(binDir, { recursive: true });
  const stub = path.join(binDir, 'pnpm');
  fs.writeFileSync(stub, `#!/bin/sh\nprintf 'pnpm %s\\t%s\\n' "$*" "$PWD" >> "$FIXTURE_CALLS_LOG"\n`);
  fs.chmodSync(stub, 0o755);
  fs.writeFileSync(callsLog, '');

  const IGNORED = new Set([binDir, callsLog]);

  return {
    root,
    binDir,
    callsLog,
    write,
    path: (...segments) => path.join(root, ...segments),
    read: (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8'),
    readJson: (...segments) => JSON.parse(fs.readFileSync(path.join(root, ...segments), 'utf8')),
    // round-trip through JSON so the result holds plain objects and arrays, without
    // comment-json's comment symbols and CommentArray prototype
    readJsonc: (...segments) =>
      JSON.parse(JSON.stringify(parseJsonc(fs.readFileSync(path.join(root, ...segments), 'utf8'), null, true))),
    exists: (...segments) => fs.existsSync(path.join(root, ...segments)),
    snapshot() {
      const files = new Map<string, string>();
      const walk = (dir: string) => {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1))) {
          const full = path.join(dir, entry.name);
          if (IGNORED.has(full) || entry.isSymbolicLink() || entry.name === 'node_modules') continue;
          if (entry.isDirectory()) {
            files.set(path.relative(root, full) + '/', '');
            walk(full);
          } else {
            files.set(path.relative(root, full), fs.readFileSync(full, 'utf8'));
          }
        }
      };
      walk(root);
      return files;
    },
    cleanup() {
      fs.rmSync(root, { recursive: true, force: true });
    },
  };
}

const ANSI = /\u001b\[[0-9;]*m/g;

export function runSync(
  script: SyncScript,
  fixture: Fixture,
  options: { cwd?: string; entry?: string } = {}
): RunResult {
  const entry = options.entry ?? path.join(PACKAGE_DIR, 'src', `${script}.ts`);

  const env: NodeJS.ProcessEnv = {
    ...process.env,
    PATH: [fixture.binDir, process.env.PATH].join(path.delimiter),
    FIXTURE_CALLS_LOG: fixture.callsLog,
    DEBUG: 'wd:*',
    DEBUG_COLORS: '0',
    NO_COLOR: '1',
  };
  // when the spec itself runs under `pnpm run`, don't let pnpm's workspace
  // location leak into the script and point it at the real monorepo
  delete env.NPM_CONFIG_WORKSPACE_DIR;
  delete env.npm_config_workspace_dir;
  delete env.FORCE_COLOR;
  // `pnpm run` exports these, `pnpm <bin>` from the root does not
  delete env.npm_package_name;
  delete env.npm_package_version;

  const result = spawnSync(process.execPath, [entry], {
    cwd: options.cwd ?? fixture.root,
    env,
    encoding: 'utf8',
    timeout: 60_000,
  });
  if (result.error) throw result.error;

  return {
    code: result.status,
    stdout: result.stdout.replace(ANSI, ''),
    stderr: result.stderr.replace(ANSI, ''),
  };
}

export interface RecordedCall {
  command: string;
  cwd: string;
}

/** The calls to the `pnpm` stub so far. */
export function readCalls(fixture: Fixture): RecordedCall[] {
  return fs
    .readFileSync(fixture.callsLog, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const [command, cwd] = line.split('\t');
      return { command, cwd };
    });
}

/**
 * Whether a recorded call asked pnpm to run the root `lint:prettier:fix` script
 * (`pnpm lint:prettier:fix` or `pnpm run lint:prettier:fix`).
 */
export function isPrettierFixCall(call: RecordedCall): boolean {
  return /^pnpm( run)? lint:prettier:fix$/.test(call.command);
}
