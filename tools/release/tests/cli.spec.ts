import assert from 'node:assert/strict';
import fs from 'node:fs';
import { after, describe, it } from 'node:test';

import { createStubBin, DIST_TAGS, REPO_ROOT, run, runCli } from './helpers.ts';

function assertBanner(text: string) {
  assert.match(text, /WarpDrive \| Automated Release/);
  assert.match(text, /engine: \S+@\S+/);
}

describe('release help', () => {
  it('prints the usage manual for every command', () => {
    const result = runCli(['help']);
    assert.equal(result.status, 0, result.stderr);
    assertBanner(result.text);
    assert.match(result.text, /Usage/);
    assert.match(result.text, /Commands/);
    for (const cmd of [
      'help',
      'exec',
      'about',
      'release-notes',
      'backfill-release-notes',
      'latest-for',
      'promote',
      'bootstrap-packages',
      'publish',
    ]) {
      assert.match(result.text, new RegExp(`^\\s+${cmd}$`, 'm'), `missing command ${cmd}`);
    }
    // publish options are documented
    for (const flag of ['<channel>', '--dry_run', '--increment', '--pack', '--publish']) {
      assert.ok(result.text.includes(flag), `missing flag ${flag}`);
    }
  });

  it('prints help when no command is given', () => {
    const result = runCli([]);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.text, /Usage/);
  });

  it('normalizes command aliases and misspellings', () => {
    for (const alias of ['--help', 'man', 'halp']) {
      const result = runCli([alias]);
      assert.equal(result.status, 0, result.stderr);
      assert.match(result.text, /Usage/, `alias ${alias} did not print help`);
    }
  });
});

describe('release about', () => {
  it('prints the about section', () => {
    const result = runCli(['about']);
    assert.equal(result.status, 0, result.stderr);
    assertBanner(result.text);
    assert.match(result.text, /^\s*# About$/m);
    assert.match(result.text, /^\s*## Who Can Release\?$/m);
    assert.match(result.text, /^\s*## Process Overview$/m);
  });
});

describe('release latest-for', () => {
  const stub = createStubBin();
  after(() => fs.rmSync(stub.dir, { recursive: true, force: true }));

  for (const [channel, version] of Object.entries(DIST_TAGS)) {
    it(`prints only the ${channel} version`, () => {
      const result = runCli(['latest-for', channel], { env: stub.env() });
      assert.equal(result.status, 0, result.stderr);
      assert.equal(result.stdout, `${version}\n`);
    });
  }

  it('accepts the `latest` alias used by release.yml', () => {
    const result = runCli(['latest', 'beta'], { env: stub.env() });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout, `${DIST_TAGS.beta}\n`);
  });

  it('prints only the version through `pnpm --silent release latest beta`', () => {
    const result = run('pnpm', ['--silent', 'release', 'latest', 'beta'], { cwd: REPO_ROOT, env: stub.env() });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout, `${DIST_TAGS.beta}\n`);
  });

  it('runs through `exec` and drops empty `--flag=` args as the workflows pass them', () => {
    const result = runCli(['exec', 'latest-for', 'canary', '--train='], { env: stub.env() });
    assert.equal(result.status, 0, result.stderr);
    assertBanner(result.text);
    assert.equal(result.text.trimEnd().split('\n').at(-1), DIST_TAGS.canary);
  });
});
