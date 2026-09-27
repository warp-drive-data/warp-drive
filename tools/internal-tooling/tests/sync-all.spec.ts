import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';

import { createFixture, isPrettierFixCall, parseJsonc, readCalls, runSync, type Fixture } from './-fixture.ts';

describe('sync-all', () => {
  let fixture: Fixture;
  beforeEach(() => {
    fixture = createFixture();
  });
  afterEach(() => {
    fixture.cleanup();
  });

  it('runs the logos, license, references and scripts tasks in order', () => {
    const result = runSync('sync-all', fixture);
    assert.equal(result.code, 0, result.stderr);
    assert.doesNotMatch(result.stderr, /Error Syncing/);

    const order = ['Sync Logos', 'Sync License', 'Sync References', 'Sync Scripts'].map((task) =>
      result.stderr.indexOf(task)
    );
    assert.ok(
      order.every((index, i) => index !== -1 && (i === 0 || index > order[i - 1])),
      result.stderr
    );
  });

  it('applies the effects of every task', () => {
    const readme = fixture.read('README.md');

    const result = runSync('sync-all', fixture);
    assert.equal(result.code, 0, result.stderr);

    // logos
    assert.equal(fixture.read('packages/alpha/logos/logo.svg'), fixture.read('logos/synced/logo.svg'));
    // license
    assert.equal(fixture.read('packages/beta/LICENSE.md'), fixture.read('LICENSE.md'));
    const alpha = fixture.readJson('packages/alpha/package.json');
    assert.equal(alpha.license, 'MIT');
    assert.deepEqual(alpha.files, ['dist', 'logos', 'LICENSE.md']);
    // references
    assert.deepEqual(parseJsonc<{ references: unknown[] }>(fixture.read('packages/beta/tsconfig.json')).references, [
      { path: '../alpha' },
    ]);
    // scripts
    assert.equal(
      fixture.readJson<{ scripts: Record<string, string> }>('packages/beta/package.json').scripts.start,
      'vite'
    );
    // the README tables are not part of sync-all
    assert.equal(fixture.read('README.md'), readme);

    const calls = readCalls(fixture);
    assert.ok(calls.length > 0);
    for (const call of calls) {
      assert.ok(isPrettierFixCall(call), call.command);
      assert.equal(call.cwd, fixture.root);
    }
  });

  it('is idempotent', () => {
    assert.equal(runSync('sync-all', fixture).code, 0);
    const afterFirstRun = fixture.snapshot();

    const result = runSync('sync-all', fixture);
    assert.equal(result.code, 0, result.stderr);
    assert.deepEqual(fixture.snapshot(), afterFirstRun);
  });
});
