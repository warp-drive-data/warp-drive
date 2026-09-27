import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';

import { runScript, tempDir } from './-run-script.mjs';

const SCRIPT = 'copy-declarations.mjs';

function makeFixture(t, inputDir = 'src') {
  const cwd = tempDir(t);
  mkdirSync(path.join(cwd, inputDir, 'nested'), { recursive: true });
  writeFileSync(path.join(cwd, inputDir, 'a.d.ts'), 'export declare const a: string;\n');
  writeFileSync(path.join(cwd, inputDir, 'nested', 'b.d.ts'), 'export declare const b: number;\n');
  writeFileSync(path.join(cwd, inputDir, 'decoy.ts'), 'export const decoy = true;\n');
  return cwd;
}

function assertCopied(cwd, inputDir, outputDir) {
  assert.equal(
    readFileSync(path.join(cwd, outputDir, 'a.d.ts'), 'utf8'),
    readFileSync(path.join(cwd, inputDir, 'a.d.ts'), 'utf8')
  );
  assert.equal(
    readFileSync(path.join(cwd, outputDir, 'nested', 'b.d.ts'), 'utf8'),
    readFileSync(path.join(cwd, inputDir, 'nested', 'b.d.ts'), 'utf8')
  );
  assert.equal(existsSync(path.join(cwd, outputDir, 'decoy.ts')), false, 'non-declaration files are not copied');
}

test('with no arguments it copies src/**/*.d.ts into unstable-preview-types', (t) => {
  const cwd = makeFixture(t);

  const { status, stdout } = runScript(SCRIPT, [], { cwd });

  assert.equal(status, 0);
  assertCopied(cwd, 'src', 'unstable-preview-types');
  assert.match(stdout, /from: src/);
  assert.match(stdout, /to: unstable-preview-types/);
  assert.match(stdout, /Found 2 files/);
  assert.match(stdout, /Copied 2 files/);
});

test('with one argument it copies from that directory into unstable-preview-types', (t) => {
  const cwd = makeFixture(t, 'addon');

  const { status, stdout } = runScript(SCRIPT, ['addon'], { cwd });

  assert.equal(status, 0);
  assertCopied(cwd, 'addon', 'unstable-preview-types');
  assert.match(stdout, /Copied 2 files/);
});

test('with two arguments it copies between the given directories, creating nested output directories', (t) => {
  const cwd = makeFixture(t, 'addon');

  const { status, stdout } = runScript(SCRIPT, ['addon', 'dist/types'], { cwd });

  assert.equal(status, 0);
  assertCopied(cwd, 'addon', 'dist/types');
  assert.equal(existsSync(path.join(cwd, 'unstable-preview-types')), false);
  assert.match(stdout, /addon\/nested\/b\.d\.ts => dist\/types\/nested\/b\.d\.ts/);
});

test('it exits with code 1 when the input directory has no declaration files', (t) => {
  const cwd = tempDir(t);
  mkdirSync(path.join(cwd, 'src'));
  writeFileSync(path.join(cwd, 'src', 'decoy.ts'), 'export const decoy = true;\n');

  const { status, stdout } = runScript(SCRIPT, [], { cwd });

  assert.equal(status, 1);
  assert.match(stdout, /No \*\*\/\*\.d\.ts files found in src/);
  assert.doesNotMatch(stdout, /Found \d+ files/);
  assert.doesNotMatch(stdout, /Copied \d+ files/);
  assert.equal(existsSync(path.join(cwd, 'unstable-preview-types')), false);
});
