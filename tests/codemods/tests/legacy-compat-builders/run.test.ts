import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { runTransform } from '../../../../packages/codemods/src/legacy-compat-builders/run.ts';

const SOURCE = `const post = await store.findRecord('post', '1');\n`;

describe('legacy-compat-builders runTransform', () => {
  let projectDir: string;
  let originalCwd: string;

  beforeEach(() => {
    originalCwd = process.cwd();
    projectDir = mkdtempSync(path.join(tmpdir(), 'codemods-run-'));
    mkdirSync(path.join(projectDir, 'app'), { recursive: true });
    mkdirSync(path.join(projectDir, 'node_modules', 'some-dep'), { recursive: true });
    writeFileSync(path.join(projectDir, 'app', 'sample.js'), SOURCE, 'utf8');
    writeFileSync(path.join(projectDir, 'node_modules', 'some-dep', 'ignored.js'), SOURCE, 'utf8');
    // patterns and the `ignore` matcher are cwd-relative
    process.chdir(projectDir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(projectDir, { recursive: true, force: true });
  });

  it('leaves files untouched in dry mode', async () => {
    await runTransform({ patterns: ['app/**/*.js'], dry: true, storeNames: ['store'] });

    expect(readFileSync(path.join(projectDir, 'app', 'sample.js'), 'utf8')).toBe(SOURCE);
  });

  it('rewrites matched files', async () => {
    await runTransform({ patterns: ['app/**/*.js'], storeNames: ['store'] });

    const transformed = readFileSync(path.join(projectDir, 'app', 'sample.js'), 'utf8');
    expect(transformed).toContain('import { findRecord }');
    expect(transformed).toContain("store.request(findRecord('post', '1'))");
  });

  it('skips ignored files', async () => {
    await runTransform({ patterns: ['**/*.js'], storeNames: ['store'] });

    const ignored = readFileSync(path.join(projectDir, 'node_modules', 'some-dep', 'ignored.js'), 'utf8');
    expect(ignored).toBe(SOURCE);
  });

  it('completes without throwing when nothing matches', async () => {
    await expect(runTransform({ patterns: ['nothing/**/*.js'], storeNames: ['store'] })).resolves.toBeUndefined();
  });
});
