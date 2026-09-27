/**
 * The `sync-*` bins are what `pnpm sync-*` runs from the monorepo root. pnpm
 * installs this package there as an injected copy under `node_modules/.pnpm`,
 * where Node refuses to strip types, so the bins are `.mjs` launchers that load
 * the TypeScript sources from the workspace checkout at `tools/internal-tooling`.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, it } from 'node:test';

import { createFixture, PACKAGE_DIR, runSync, type Fixture, type SyncScript } from './-fixture.ts';

const SCRIPTS: SyncScript[] = [
  'sync-all',
  'sync-license',
  'sync-logos',
  'sync-readme-tables',
  'sync-references',
  'sync-scripts',
];

/**
 * Lays the fixture out like an installed monorepo: the workspace checkout of
 * this package at `tools/internal-tooling`, and an injected copy of it under
 * the root's `node_modules/.pnpm`. Returns the injected copy's directory.
 */
function installInjectedCopy(fixture: Fixture, { withWorkspacePackage = true } = {}) {
  if (withWorkspacePackage) {
    fs.mkdirSync(fixture.path('tools'), { recursive: true });
    fs.symlinkSync(PACKAGE_DIR, fixture.path('tools/internal-tooling'), 'dir');
  }

  const injected = fixture.path(
    'node_modules/.pnpm/@warp-drive+internal-tooling@file+tools+internal-tooling/node_modules/@warp-drive/internal-tooling'
  );
  for (const dir of ['bin', 'src']) {
    fs.cpSync(path.join(PACKAGE_DIR, dir), path.join(injected, dir), { recursive: true });
  }
  fs.copyFileSync(path.join(PACKAGE_DIR, 'package.json'), path.join(injected, 'package.json'));
  return injected;
}

describe('bin', () => {
  let fixture: Fixture;
  beforeEach(() => {
    fixture = createFixture();
  });
  afterEach(() => {
    fixture.cleanup();
  });

  it('declares a node launcher for every sync script', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(PACKAGE_DIR, 'package.json'), 'utf8'));
    for (const script of SCRIPTS) {
      assert.equal(pkg.bin[script], `bin/${script}.mjs`);
      const launcher = fs.readFileSync(path.join(PACKAGE_DIR, pkg.bin[script]), 'utf8');
      assert.ok(launcher.startsWith('#!/usr/bin/env node\n'), `${script} has a node shebang`);
      assert.ok(fs.existsSync(path.join(PACKAGE_DIR, 'src', `${script}.ts`)), `${script} has a src wrapper`);
    }
  });

  it('runs from an injected copy under node_modules using the workspace sources', () => {
    const injected = installInjectedCopy(fixture);

    const result = runSync('sync-scripts', fixture, { entry: path.join(injected, 'bin/sync-scripts.mjs') });
    assert.equal(result.code, 0, result.stderr);
    assert.equal(
      fixture.readJson<{ scripts: Record<string, string> }>('packages/alpha/package.json').scripts.start,
      'vite'
    );
  });

  it('explains where it looked when an injected copy has no workspace package to load', () => {
    const injected = installInjectedCopy(fixture, { withWorkspacePackage: false });

    const result = runSync('sync-scripts', fixture, { entry: path.join(injected, 'bin/sync-scripts.mjs') });
    assert.notEqual(result.code, 0);
    assert.match(result.stderr, /expected its workspace package at tools[\\/]internal-tooling/);
    assert.doesNotMatch(result.stderr, /ERR_MODULE_NOT_FOUND/);
  });

  it('runs from the workspace checkout', () => {
    const result = runSync('sync-logos', fixture, { entry: path.join(PACKAGE_DIR, 'bin/sync-logos.mjs') });
    assert.equal(result.code, 0, result.stderr);
    assert.ok(fixture.exists('packages/alpha/logos/logo.svg'));
  });
});
