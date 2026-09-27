import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';

import { PACKAGE_ROOT, readFile, runBin, setupProject } from './helpers.ts';

const pkg = JSON.parse(fs.readFileSync(path.join(PACKAGE_ROOT, 'package.json'), 'utf8')) as {
  bin: Record<string, string>;
};
const canExecuteDirectly = process.platform !== 'win32';

test('every bin entry is an executable node script', () => {
  assert.deepEqual(Object.keys(pkg.bin).sort(), ['parse', 'resource']);

  for (const [name, entry] of Object.entries(pkg.bin)) {
    const filePath = path.join(PACKAGE_ROOT, entry);
    assert.ok(fs.existsSync(filePath), `bin "${name}" points at a missing file: ${entry}`);
    assert.ok(
      fs.readFileSync(filePath, 'utf8').startsWith('#!/usr/bin/env node\n'),
      `bin "${name}" (${entry}) needs a node shebang`
    );
    if (canExecuteDirectly) {
      assert.notEqual(fs.statSync(filePath).mode & 0o111, 0, `bin "${name}" (${entry}) is not executable`);
    }
  }
});

test('the parse bin runs through its shebang', { skip: !canExecuteDirectly }, (t) => {
  const dir = setupProject(t, {
    'schema.json': JSON.stringify({ schemas: './schemas', dest: './dist' }),
    'schemas/.gitkeep': '',
  });

  const result = runBin(pkg.bin.parse, ['schema.json'], dir);

  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout.slice(result.stdout.lastIndexOf('['))), []);
});

test('the resource bin scaffolds a resource', { skip: !canExecuteDirectly }, (t) => {
  const dir = setupProject(t);

  const result = runBin(pkg.bin.resource, ['blog-posts'], dir);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /@warp-drive\/schema scaffold resource blog-posts/);
  assert.deepEqual(JSON.parse(readFile(dir, 'schema.json')), { schemas: './schemas', dest: './dist' });
  const post = readFile(dir, 'schemas/blog-posts.ts');
  assert.match(post, /^@Resource \/\/ Resource is a default "Trait"/m);
  assert.match(post, /^class BlogPost \{$/m);
});

test('the resource bin reports a missing name', { skip: !canExecuteDirectly }, (t) => {
  const dir = setupProject(t);

  const result = runBin(pkg.bin.resource, [], dir);

  assert.equal(result.status, 1, result.stderr);
  assert.match(result.stdout, /Error Please supply a name for the resource to scaffold!/);
});
