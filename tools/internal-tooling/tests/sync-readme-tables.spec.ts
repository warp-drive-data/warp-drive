import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';

import { Compatibility } from '../src/tasks/-data/compatibility.ts';
import { Versions } from '../src/tasks/-data/versions.ts';
import {
  COMPATIBILITY_END,
  COMPATIBILITY_START,
  createFixture,
  readCalls,
  README_INTRO,
  README_MIDDLE,
  README_OUTRO,
  runSync,
  VERSIONS_END,
  VERSIONS_START,
  type Fixture,
} from './-fixture.ts';

function between(text: string, start: string, end: string) {
  const from = text.indexOf(start);
  const to = text.indexOf(end);
  assert.ok(from !== -1 && to > from, `expected ${start} ... ${end} in the README`);
  return text.slice(from + start.length, to);
}

function tableRows(table: string) {
  return table.split('\n').filter((line) => line.startsWith('|'));
}

describe('sync-readme-tables', () => {
  let fixture: Fixture;
  beforeEach(() => {
    fixture = createFixture();
  });
  afterEach(() => {
    fixture.cleanup();
  });

  it('rewrites the compatibility table from the compatibility data', () => {
    const result = runSync('sync-readme-tables', fixture);
    assert.equal(result.code, 0, result.stderr);

    const table = between(fixture.read('README.md'), COMPATIBILITY_START, COMPATIBILITY_END);
    assert.doesNotMatch(table, /stale/);

    const rows = tableRows(table);
    assert.equal(rows[0], '|  | Status | WarpDrive | Lockstep | Supported | Tested | Range |');
    assert.equal(rows[1], '| --- | --- | --- | --- | --- | --- | --- |');
    assert.equal(rows.length, 2 + Compatibility.length);
    Compatibility.forEach((entry, index) => {
      assert.ok(
        rows[index + 2].includes(
          `![NPM ${entry.channel} Version](https://img.shields.io/npm/v/ember-data/${entry.channel}?`
        ),
        rows[index + 2]
      );
    });
  });

  it('rewrites the versions table from the versions data and the public workspace packages', () => {
    const result = runSync('sync-readme-tables', fixture);
    assert.equal(result.code, 0, result.stderr);

    const table = between(fixture.read('README.md'), VERSIONS_START, VERSIONS_END);
    assert.doesNotMatch(table, /stale/);

    const rows = tableRows(table);
    assert.equal(rows[0], '| Package | Audience | Canary | Beta | Stable | LTS | V4-Canary | LTS-4-12 |');
    assert.equal(rows[1], '| ------- | -------- | --------- | -------- | --- | ------ | ---- | ------ |');

    const names = rows.slice(2).map((row) => /^\| \[([^\]]+)\]/.exec(row)?.[1]);
    const known = Versions.map((v) => v.name).sort((a, b) => (a > b ? -1 : 1));
    // known packages first, sorted descending, then workspace packages missing from the data
    assert.deepEqual(names.slice(0, known.length), known);
    assert.deepEqual(names.slice(known.length).sort(), ['@fixture/alpha', '@fixture/beta']);

    // packages missing from the data link to their package.json and default to the 🐹 audience
    assert.ok(
      rows.some((row) => row.startsWith('| [@fixture/alpha](./packages/alpha/package.json#readme) | 🐹 | ')),
      table
    );
    assert.ok(
      rows.some((row) => row.includes('![NPM Canary Version](https://img.shields.io/npm/v/@fixture/beta/canary?')),
      table
    );
    // private packages are never listed
    assert.doesNotMatch(table, /private-thing|fixture-exam-app|fixture-testem-app/);
  });

  it('keeps the rest of the README', () => {
    const result = runSync('sync-readme-tables', fixture);
    assert.equal(result.code, 0, result.stderr);

    const readme = fixture.read('README.md');
    assert.ok(readme.startsWith(README_INTRO + '\n' + COMPATIBILITY_START));
    assert.ok(readme.includes(COMPATIBILITY_END + '\n' + README_MIDDLE + '\n' + VERSIONS_START));
    assert.ok(readme.endsWith(VERSIONS_END + '\n' + README_OUTRO));
  });

  it('leaves an up to date README byte-identical and touches nothing else', () => {
    assert.equal(runSync('sync-readme-tables', fixture).code, 0);
    const afterFirstRun = fixture.snapshot();

    const result = runSync('sync-readme-tables', fixture);
    assert.equal(result.code, 0, result.stderr);
    assert.deepEqual(fixture.snapshot(), afterFirstRun);
    assert.match(result.stderr, /Compatibility Table is already up to date/);
    assert.match(result.stderr, /Versions Table is already up to date/);
    assert.deepEqual(readCalls(fixture), []);
  });

  it('only edits the README', () => {
    const before = fixture.snapshot();

    assert.equal(runSync('sync-readme-tables', fixture).code, 0);

    const after = fixture.snapshot();
    const changed = [...after.keys()].filter((file) => after.get(file) !== before.get(file));
    assert.deepEqual(changed, ['README.md']);
    assert.equal(after.size, before.size);
  });
});
