import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';

import { createFixture, isPrettierFixCall, readCalls, runSync, type Fixture } from './-fixture.ts';

interface TsConfig {
  compilerOptions: Record<string, unknown>;
  references: { path: string }[];
  include?: string[];
}

describe('sync-references', () => {
  let fixture: Fixture;
  beforeEach(() => {
    fixture = createFixture();
  });
  afterEach(() => {
    fixture.cleanup();
  });

  it('adds a reference for each workspace dependency that emits types', () => {
    const result = runSync('sync-references', fixture);
    assert.equal(result.code, 0, result.stderr);

    assert.deepEqual(fixture.readJsonc<TsConfig>('packages/alpha/tsconfig.json').references, []);
    assert.deepEqual(fixture.readJsonc<TsConfig>('packages/beta/tsconfig.json').references, [{ path: '../alpha' }]);
    assert.deepEqual(fixture.readJsonc<TsConfig>('tests/exam-app/tsconfig.json').references, [
      { path: '../../packages/beta' },
    ]);
  });

  it('applies the monorepo compilerOptions defaults and keeps existing settings', () => {
    const result = runSync('sync-references', fixture);
    assert.equal(result.code, 0, result.stderr);

    const alpha = fixture.readJsonc<TsConfig>('packages/alpha/tsconfig.json');
    // booleans are forced to the default
    assert.equal(alpha.compilerOptions.composite, true);
    assert.equal(alpha.compilerOptions.declaration, true);
    assert.equal(alpha.compilerOptions.emitDeclarationOnly, true);
    assert.equal(alpha.compilerOptions.erasableSyntaxOnly, true);
    // missing values are added
    assert.equal(alpha.compilerOptions.rootDir, 'src');
    assert.equal(alpha.compilerOptions.moduleResolution, 'bundler');
    // existing non-boolean values are kept
    assert.equal(alpha.compilerOptions.declarationDir, 'unstable-preview-types');
    assert.deepEqual(alpha.compilerOptions.lib, ['ESNext', 'DOM']);
    assert.deepEqual(alpha.include, ['src/**/*']);

    const beta = fixture.readJsonc<TsConfig>('packages/beta/tsconfig.json');
    assert.equal(beta.compilerOptions.strict, true);

    const examApp = fixture.readJsonc<TsConfig>('tests/exam-app/tsconfig.json');
    assert.equal(examApp.compilerOptions.rootDir, '.');
    assert.equal(examApp.compilerOptions.noEmit, undefined);
  });

  it('keeps comments in tsconfig.json', () => {
    const result = runSync('sync-references', fixture);
    assert.equal(result.code, 0, result.stderr);

    const alpha = fixture.read('packages/alpha/tsconfig.json');
    assert.match(alpha, /\/\/ alpha keeps this comment/);
    assert.match(alpha, /\/\/ where types are emitted/);
    assert.match(fixture.read('packages/beta/tsconfig.json'), /\/\* beta keeps this block comment \*\//);
    assert.match(fixture.read('tests/exam-app/tsconfig.json'), /\/\/ the exam app keeps this comment/);
  });

  it('moves peer dependencies out of dependencies and mirrors them into devDependencies', () => {
    const result = runSync('sync-references', fixture);
    assert.equal(result.code, 0, result.stderr);

    const beta = fixture.readJson<Record<string, Record<string, string>>>('packages/beta/package.json');
    assert.deepEqual(beta.dependencies, {});
    assert.deepEqual(beta.peerDependencies, { '@fixture/alpha': 'workspace:*', 'external-lib': '^1.0.0' });
    assert.deepEqual(beta.devDependencies, { '@fixture/alpha': 'workspace:*', 'external-lib': '^1.0.0' });
  });

  it('leaves packages without a tsconfig.json alone', () => {
    const before = fixture.snapshot();

    const result = runSync('sync-references', fixture);
    assert.equal(result.code, 0, result.stderr);

    const after = fixture.snapshot();
    for (const dir of ['packages/private-thing', 'tests/testem-app']) {
      assert.equal(fixture.exists(dir, 'tsconfig.json'), false);
      assert.equal(after.get(`${dir}/package.json`), before.get(`${dir}/package.json`));
    }
  });

  it('runs prettier once after editing', () => {
    assert.equal(runSync('sync-references', fixture).code, 0);
    const calls = readCalls(fixture);
    assert.equal(calls.length, 1, JSON.stringify(calls));
    assert.ok(isPrettierFixCall(calls[0]), calls[0].command);
  });

  it('is idempotent', () => {
    assert.equal(runSync('sync-references', fixture).code, 0);
    const afterFirstRun = fixture.snapshot();

    // Note: a second run still counts as an edit (and runs prettier again) because the
    // `noEmit: undefined` default is re-added to every tsconfig that lacks `noEmit`,
    // but the files it writes are byte-identical.
    const result = runSync('sync-references', fixture);
    assert.equal(result.code, 0, result.stderr);
    assert.deepEqual(fixture.snapshot(), afterFirstRun);
  });
});
