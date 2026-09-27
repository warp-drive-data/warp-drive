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
 * Parse `console.log` output of `Record<string, Set<string>>` into plain
 * arrays. Node and Bun format a Set differently, so match both shapes.
 */
function parseVersionsMap(stdout) {
  const map = {};
  const entry = /(?:'([^']+)'|"([^"]+)"|([\w$-]+)): Set\(\d+\) \{([^}]*)\}/g;
  for (const match of stdout.matchAll(entry)) {
    const name = match[1] ?? match[2] ?? match[3];
    map[name] = [...match[4].matchAll(/'([^']*)'|"([^"]*)"/g)].map((m) => m[1] ?? m[2]);
  }
  return map;
}

function installFakePnpm(t) {
  const dir = tempDir(t);
  const bin = path.join(dir, 'bin');
  mkdirSync(bin);
  writeFileSync(path.join(dir, 'why.txt'), PNPM_WHY_OUTPUT);
  const fake = path.join(bin, 'pnpm');
  writeFileSync(
    fake,
    `#!/bin/sh\nprintf '%s\\n' "$*" > "${path.join(dir, 'args.txt')}"\ncat "${path.join(dir, 'why.txt')}"\n`
  );
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
