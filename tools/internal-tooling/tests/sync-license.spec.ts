import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';

import { createFixture, readCalls, runSync, type Fixture } from './-fixture.ts';

describe('sync-license', () => {
  let fixture: Fixture;
  beforeEach(() => {
    fixture = createFixture();
  });
  afterEach(() => {
    fixture.cleanup();
  });

  it('copies LICENSE.md into each public package, sets MIT and lists it in files', () => {
    fixture.write('packages/beta/LICENSE.md', 'an outdated license\n');

    const result = runSync('sync-license', fixture);
    assert.equal(result.code, 0, result.stderr);

    const license = fixture.read('LICENSE.md');
    assert.equal(fixture.read('packages/alpha/LICENSE.md'), license);
    assert.equal(fixture.read('packages/beta/LICENSE.md'), license);

    const alpha = fixture.readJson('packages/alpha/package.json');
    assert.equal(alpha.license, 'MIT');
    assert.deepEqual(alpha.files, ['dist', 'LICENSE.md']);

    const beta = fixture.readJson('packages/beta/package.json');
    assert.equal(beta.license, 'MIT');
    assert.deepEqual(beta.files, ['LICENSE.md']);
  });

  it('skips private packages and test apps', () => {
    const before = fixture.snapshot();

    const result = runSync('sync-license', fixture);
    assert.equal(result.code, 0, result.stderr);

    const after = fixture.snapshot();
    for (const dir of ['packages/private-thing', 'tests/exam-app', 'tests/testem-app']) {
      assert.equal(fixture.exists(dir, 'LICENSE.md'), false);
      assert.equal(after.get(`${dir}/package.json`), before.get(`${dir}/package.json`));
    }
  });

  it('is idempotent and does not run prettier', () => {
    assert.equal(runSync('sync-license', fixture).code, 0);
    const afterFirstRun = fixture.snapshot();

    const result = runSync('sync-license', fixture);
    assert.equal(result.code, 0, result.stderr);
    assert.deepEqual(fixture.snapshot(), afterFirstRun);
    assert.deepEqual(readCalls(fixture), []);
  });
});
