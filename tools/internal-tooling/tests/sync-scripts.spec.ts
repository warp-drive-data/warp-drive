import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';

import { createFixture, isPrettierFixCall, readCalls, runSync, type Fixture } from './-fixture.ts';

const PUBLIC_PACKAGE_SCRIPTS = {
  lint: 'eslint . --quiet --cache --cache-strategy=content',
  'build:pkg': 'vite build;',
  prepack: 'pnpm run build:pkg',
  sync: 'echo "syncing"',
  start: 'vite',
};

const CLASSIC_TEST_APP_SCRIPTS = {
  'build:tests': 'IS_TESTING=true EMBER_CLI_TEST_COMMAND=true ember build --output-path=dist-test --suppress-sizes',
  'build:production': 'bun run build:tests -e production',
  start: 'bun run build:tests --watch',
  'check:types': 'tsc --noEmit',
};

const EXAM_TEST_APP_SCRIPTS = {
  ...CLASSIC_TEST_APP_SCRIPTS,
  examine:
    'export EXAM_PARALLEL_COUNT=$(./bin/calculate-test-jobs); ember exam --test-port=0 --path=dist-test --parallel=$EXAM_PARALLEL_COUNT --load-balance',
  test: 'bun run examine',
  'test:production': 'bun run examine',
  'test:start': 'bun run ember test --test-port=0 --path=dist-test --serve --no-launch',
};

const TESTEM_TEST_APP_SCRIPTS = {
  ...CLASSIC_TEST_APP_SCRIPTS,
  test: 'ember test --test-port=0 --path=dist-test',
  'test:production': 'ember test --test-port=0 --path=dist-test --environment=production',
  'test:start': 'bun run test --serve --no-launch',
};

describe('sync-scripts', () => {
  let fixture: Fixture;
  beforeEach(() => {
    fixture = createFixture();
  });
  afterEach(() => {
    fixture.cleanup();
  });

  it('writes the default scripts for public packages', () => {
    const result = runSync('sync-scripts', fixture);
    assert.equal(result.code, 0, result.stderr);

    assert.deepEqual(fixture.readJson('packages/alpha/package.json').scripts, PUBLIC_PACKAGE_SCRIPTS);
    assert.deepEqual(fixture.readJson('packages/beta/package.json').scripts, PUBLIC_PACKAGE_SCRIPTS);
  });

  it('writes the default scripts for an ember-exam test app', () => {
    const result = runSync('sync-scripts', fixture);
    assert.equal(result.code, 0, result.stderr);

    assert.deepEqual(fixture.readJson('tests/exam-app/package.json').scripts, EXAM_TEST_APP_SCRIPTS);
  });

  it('writes the default scripts for a testem test app', () => {
    const result = runSync('sync-scripts', fixture);
    assert.equal(result.code, 0, result.stderr);

    assert.deepEqual(fixture.readJson('tests/testem-app/package.json').scripts, TESTEM_TEST_APP_SCRIPTS);
  });

  it('marks test apps private', () => {
    const pkg = fixture.readJson('tests/testem-app/package.json');
    delete pkg.private;
    fixture.write('tests/testem-app/package.json', JSON.stringify(pkg, null, 2));

    const result = runSync('sync-scripts', fixture);
    assert.equal(result.code, 0, result.stderr);

    assert.equal(fixture.readJson('tests/testem-app/package.json').private, true);
  });

  it('leaves private non-test packages alone', () => {
    const before = fixture.read('packages/private-thing/package.json');

    const result = runSync('sync-scripts', fixture);
    assert.equal(result.code, 0, result.stderr);

    assert.equal(fixture.read('packages/private-thing/package.json'), before);
  });

  it('runs prettier once after editing, and neither edits nor runs prettier when already in sync', () => {
    assert.equal(runSync('sync-scripts', fixture).code, 0);
    const calls = readCalls(fixture);
    assert.equal(calls.length, 1, JSON.stringify(calls));
    assert.ok(isPrettierFixCall(calls[0]), calls[0].command);

    const afterFirstRun = fixture.snapshot();
    const result = runSync('sync-scripts', fixture);
    assert.equal(result.code, 0, result.stderr);
    assert.deepEqual(fixture.snapshot(), afterFirstRun);
    assert.equal(readCalls(fixture).length, 1);
  });
});
