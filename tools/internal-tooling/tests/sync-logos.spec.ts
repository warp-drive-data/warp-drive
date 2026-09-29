import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';

import { createFixture, readCalls, runSync, type Fixture } from './-fixture.ts';

describe('sync-logos', () => {
  let fixture: Fixture;
  beforeEach(() => {
    fixture = createFixture();
  });
  afterEach(() => {
    fixture.cleanup();
  });

  it('copies logos/synced into each public package and adds "logos" to files', () => {
    const result = runSync('sync-logos', fixture);
    assert.equal(result.code, 0, result.stderr);

    for (const pkg of ['alpha', 'beta']) {
      assert.equal(fixture.read('packages', pkg, 'logos/logo.svg'), fixture.read('logos/synced/logo.svg'));
      assert.equal(fixture.read('packages', pkg, 'logos/icons/mark.svg'), fixture.read('logos/synced/icons/mark.svg'));
      assert.equal(fixture.exists('packages', pkg, 'logos/not-synced.txt'), false);
    }

    // an existing copy is replaced rather than merged into
    assert.equal(fixture.exists('packages/alpha/logos/stale.svg'), false);

    assert.deepEqual(fixture.readJson('packages/alpha/package.json').files, ['dist', 'logos']);
    assert.deepEqual(fixture.readJson('packages/beta/package.json').files, ['logos']);
  });

  it('skips private packages and test apps', () => {
    const before = {
      privateThing: fixture.read('packages/private-thing/package.json'),
      examApp: fixture.read('tests/exam-app/package.json'),
      testemApp: fixture.read('tests/testem-app/package.json'),
    };

    const result = runSync('sync-logos', fixture);
    assert.equal(result.code, 0, result.stderr);

    assert.equal(fixture.exists('packages/private-thing/logos'), false);
    assert.equal(fixture.exists('tests/exam-app/logos'), false);
    assert.equal(fixture.exists('tests/testem-app/logos'), false);
    assert.equal(fixture.read('packages/private-thing/package.json'), before.privateThing);
    assert.equal(fixture.read('tests/exam-app/package.json'), before.examApp);
    assert.equal(fixture.read('tests/testem-app/package.json'), before.testemApp);
  });

  it('copies the whole logos directory into the docs site', () => {
    const result = runSync('sync-logos', fixture);
    assert.equal(result.code, 0, result.stderr);

    const docsLogos = 'docs-viewer/docs.warp-drive.io/public/logos';
    assert.equal(fixture.read(docsLogos, 'synced/logo.svg'), fixture.read('logos/synced/logo.svg'));
    assert.equal(fixture.read(docsLogos, 'synced/icons/mark.svg'), fixture.read('logos/synced/icons/mark.svg'));
    assert.equal(fixture.read(docsLogos, 'not-synced.txt'), fixture.read('logos/not-synced.txt'));
  });

  it('is idempotent and does not run prettier', () => {
    assert.equal(runSync('sync-logos', fixture).code, 0);
    const afterFirstRun = fixture.snapshot();

    const result = runSync('sync-logos', fixture);
    assert.equal(result.code, 0, result.stderr);
    assert.deepEqual(fixture.snapshot(), afterFirstRun);
    assert.deepEqual(readCalls(fixture), []);
  });
});
