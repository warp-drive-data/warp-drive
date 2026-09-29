/**
 * `runPrettier` (src/tasks/-utils.ts) is what sync-references and sync-scripts
 * call after editing files. It must run the monorepo root's `lint:prettier:fix`
 * script from the monorepo root, whichever directory the sync script started in.
 *
 * The fixture's `pnpm` stub records each call along with the directory it ran in.
 */
import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';

import { createFixture, isPrettierFixCall, readCalls, runSync, type Fixture } from './-fixture.ts';

describe('runPrettier', () => {
  let fixture: Fixture;
  beforeEach(() => {
    fixture = createFixture();
  });
  afterEach(() => {
    fixture.cleanup();
  });

  it('runs the root lint:prettier:fix script from the monorepo root', () => {
    const result = runSync('sync-scripts', fixture);
    assert.equal(result.code, 0, result.stderr);

    const calls = readCalls(fixture);
    assert.equal(calls.length, 1, JSON.stringify(calls));
    assert.ok(isPrettierFixCall(calls[0]), `unexpected invocation: ${calls[0].command}`);
    assert.equal(calls[0].cwd, fixture.root);
  });

  it('runs from the monorepo root when started from inside a package', () => {
    const result = runSync('sync-scripts', fixture, { cwd: fixture.path('packages/alpha') });
    assert.equal(result.code, 0, result.stderr);

    const calls = readCalls(fixture);
    assert.equal(calls.length, 1, JSON.stringify(calls));
    assert.ok(isPrettierFixCall(calls[0]), `unexpected invocation: ${calls[0].command}`);
    assert.equal(calls[0].cwd, fixture.root);
  });
});
