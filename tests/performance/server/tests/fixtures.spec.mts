#!/usr/bin/env node
/**
 * Black-box spec for `pnpm fixtures`, which regenerates the committed
 * `fixtures/generated/*.json.br` payloads.
 *
 * The generator writes to `./fixtures/generated` relative to its working
 * directory, so the spec runs the real `fixtures/index.js` with the runtime the
 * package's `fixtures` script uses, from a temp working directory, and leaves
 * the committed files alone.
 */
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, test } from 'node:test';
import { brotliDecompressSync } from 'node:zlib';

const PACKAGE_DIR = join(import.meta.dirname, '../..');
const COMMITTED_DIR = join(PACKAGE_DIR, 'fixtures/generated');
const ENTRY = './fixtures/index.js';

type Payload = { data: unknown[]; included: unknown[] };

function readPayload(file: string): Payload {
  return JSON.parse(brotliDecompressSync(readFileSync(file)).toString()) as Payload;
}

function fixturesCommand(): [string, string[]] {
  const pkg = JSON.parse(readFileSync(join(PACKAGE_DIR, 'package.json'), 'utf8')) as {
    scripts: Record<string, string>;
  };
  const [cmd, ...args] = pkg.scripts.fixtures.split(/\s+/);
  assert.ok(args.includes(ENTRY), `expected the fixtures script to run ${ENTRY}: ${pkg.scripts.fixtures}`);
  return [cmd, args.map((arg) => (arg === ENTRY ? join(PACKAGE_DIR, ENTRY) : arg))];
}

describe('performance-test-app fixtures generator', () => {
  let cwd: string;
  let result: ReturnType<typeof spawnSync>;

  before(() => {
    cwd = mkdtempSync(join(tmpdir(), 'perf-fixtures-'));
    mkdirSync(join(cwd, 'fixtures/generated'), { recursive: true });
    const [cmd, args] = fixturesCommand();
    result = spawnSync(cmd, args, { cwd, encoding: 'utf8', timeout: 120_000 });
  });

  after(() => {
    rmSync(cwd, { recursive: true, force: true });
  });

  test('exits cleanly and reports what it generated', () => {
    assert.equal(result.status, 0, `stderr:\n${result.stderr}`);
    assert.match(String(result.stdout), /Regenerating Fixtures For Performance Benchmarks/);
    assert.match(String(result.stdout), /Generated fixtures for big-many-to-many: 100 primary, 1016 included/);
    assert.match(
      String(result.stdout),
      /Generated fixtures for big-many-to-many-with-removal: 100 primary, 1016 included/
    );
  });

  test('writes only the enabled fixtures', () => {
    assert.deepEqual(readdirSync(join(cwd, 'fixtures/generated')).sort(), [
      'big-many-to-many-with-removal.json.br',
      'big-many-to-many.json.br',
    ]);
  });

  for (const name of ['big-many-to-many', 'big-many-to-many-with-removal']) {
    test(`${name}.json.br decompresses to the committed JSON:API payload`, () => {
      const generated = readPayload(join(cwd, 'fixtures/generated', `${name}.json.br`));
      assert.ok(Array.isArray(generated.data), 'data is an array');
      assert.ok(Array.isArray(generated.included), 'included is an array');
      assert.equal(generated.data.length, 100);
      assert.equal(generated.included.length, 1016);
      assert.deepEqual(generated, readPayload(join(COMMITTED_DIR, `${name}.json.br`)));
    });
  }
});
