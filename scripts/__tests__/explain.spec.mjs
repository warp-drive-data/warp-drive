import assert from 'node:assert/strict';
import { chmodSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';

import { runScript, tempDir } from './-run-script.mjs';

const PNPM_WHY_OUTPUT = `Legend: production dependency, optional only, dev only

my-app@1.0.0 /projects/my-app (PRIVATE)

dependencies:
@warp-drive/core 5.8.0
├─┬ @warp-drive/json-api 5.8.0
│ └── @warp-drive/core 5.8.0 peer
├─┬ @warp-drive/legacy 5.7.0
│ └── @warp-drive/core 5.7.0 peer
└── @warp-drive/ember 5.8.0
devDependencies:
@warp-drive/utilities 5.8.0
└── @warp-drive/core 5.8.0 peer
`;

/**
 * Parse Node's `console.log` output of `Record<string, Set<string>>`, e.g.
 * `{ '@warp-drive/core': Set(2) { '5.8.0', '5.7.0' } }`, into plain arrays.
 */
function parseVersionsMap(stdout) {
  const map = {};
  for (const match of stdout.matchAll(/'([^']+)': Set\(\d+\) \{([^}]*)\}/g)) {
    map[match[1]] = [...match[2].matchAll(/'([^']*)'/g)].map((m) => m[1]);
  }
  return map;
}

/**
 * Put a fake `pnpm` first on PATH. By default it records its arguments and
 * prints `PNPM_WHY_OUTPUT`; with `fail` it prints that message to stderr and
 * exits 1 instead.
 */
function installFakePnpm(t, { fail } = {}) {
  const dir = tempDir(t);
  const bin = path.join(dir, 'bin');
  mkdirSync(bin);
  writeFileSync(path.join(dir, 'why.txt'), PNPM_WHY_OUTPUT);
  const fake = path.join(bin, 'pnpm');
  const body = fail ? `printf '%s\\n' '${fail}' >&2\nexit 1\n` : `cat "${path.join(dir, 'why.txt')}"\n`;
  writeFileSync(fake, `#!/bin/sh\nprintf '%s\\n' "$*" > "${path.join(dir, 'args.txt')}"\n${body}`);
  chmodSync(fake, 0o755);
  return { dir, bin };
}

test('it runs `pnpm why <pkg>` and prints the versions found per package', (t) => {
  const { dir, bin } = installFakePnpm(t);
  const cwd = tempDir(t);

  const { status, stdout } = runScript('explain.mjs', ['@warp-drive/core'], {
    cwd,
    env: { PATH: `${bin}${path.delimiter}${process.env.PATH}` },
  });

  assert.equal(status, 0);
  assert.equal(readFileSync(path.join(dir, 'args.txt'), 'utf8').trim(), 'why @warp-drive/core');
  assert.match(stdout, /Explaining @warp-drive\/core in /);
  assert.deepEqual(parseVersionsMap(stdout), {
    '@warp-drive/core': ['5.8.0', '5.7.0'],
    '@warp-drive/ember': ['5.8.0'],
    '@warp-drive/json-api': ['5.8.0'],
    '@warp-drive/legacy': ['5.7.0'],
    '@warp-drive/utilities': ['5.8.0'],
  });
});

test('it exits non-zero and surfaces stderr when `pnpm why` fails', (t) => {
  const message = 'ERR_PNPM_NO_PKG  No package.json found in the current directory';
  const { bin } = installFakePnpm(t, { fail: message });
  const cwd = tempDir(t);

  const { status, stdout, stderr } = runScript('explain.mjs', ['@warp-drive/core'], {
    cwd,
    env: { PATH: `${bin}${path.delimiter}${process.env.PATH}` },
  });

  assert.equal(status, 1);
  assert.ok(stderr.includes(message), stderr);
  assert.match(stderr, /`pnpm why @warp-drive\/core` exited with code 1/);
  assert.doesNotMatch(stdout, /\{\s*\}/, 'no empty versions map is printed');
});
