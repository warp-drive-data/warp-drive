import assert from 'node:assert/strict';
import path from 'node:path';
import { test } from 'node:test';

import { runCli, setupProject } from './helpers.ts';

const PARSE = 'src/parse.ts';
const CONFIG = JSON.stringify({ schemas: './schemas', dest: './dist' }, null, 2);

test('parse prints an empty schema list when the schema directory has no .ts files', (t) => {
  const dir = setupProject(t, {
    'schema.json': CONFIG,
    'schemas/README.md': '# not a schema\n',
    'schemas/nested/notes.txt': 'also not a schema\n',
  });

  const result = runCli(PARSE, ['schema.json'], dir);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /@warp-drive\/schema parse schema\.json/);
  assert.match(result.stdout, /Parsing schema files from schemas\b/);
  assert.doesNotMatch(result.stdout, /Parsing (README\.md|nested)/);
  assert.deepEqual(JSON.parse(result.stdout.slice(result.stdout.lastIndexOf('['))), []);
});

test('parse resolves the schema directory relative to the config file', (t) => {
  const dir = setupProject(t, {
    'app/schema.json': CONFIG,
    'app/schemas/.gitkeep': '',
  });

  const result = runCli(PARSE, ['app/schema.json'], dir);

  assert.equal(result.status, 0, result.stderr);
  assert.ok(
    result.stdout.includes(`Parsing schema files from ${path.join('app', 'schemas')}`),
    `unexpected output:\n${result.stdout}`
  );
  assert.deepEqual(JSON.parse(result.stdout.slice(result.stdout.lastIndexOf('['))), []);
});

test('parse skips directories whose name ends in .ts', (t) => {
  const dir = setupProject(t, {
    'schema.json': CONFIG,
    'schemas/something.ts/README.md': '# a directory, not a schema\n',
  });

  const result = runCli(PARSE, ['schema.json'], dir);

  assert.equal(result.status, 0, result.stderr);
  assert.doesNotMatch(result.stdout, /Parsing something\.ts/);
  assert.deepEqual(JSON.parse(result.stdout.slice(result.stdout.lastIndexOf('['))), []);
});

test('parse accepts an absolute path to the schema config', (t) => {
  const dir = setupProject(t, {
    'app/schema.json': CONFIG,
    'app/schemas/.gitkeep': '',
  });
  const cwd = setupProject(t);

  const result = runCli(PARSE, [path.join(dir, 'app', 'schema.json')], cwd);

  assert.equal(result.status, 0, result.stderr);
  assert.ok(
    result.stdout.includes(`Parsing schema files from ${path.relative(cwd, path.join(dir, 'app', 'schemas'))}`),
    `unexpected output:\n${result.stdout}`
  );
  assert.deepEqual(JSON.parse(result.stdout.slice(result.stdout.lastIndexOf('['))), []);
});

for (const key of ['schemas', 'dest']) {
  test(`parse exits 1 when the schema config has no string "${key}"`, (t) => {
    const config: Record<string, unknown> = { schemas: './schemas', dest: './dist' };
    config[key] = 42;
    const dir = setupProject(t, { 'schema.json': JSON.stringify(config) });

    const result = runCli(PARSE, ['schema.json'], dir);

    assert.equal(result.status, 1);
    assert.match(result.stdout, new RegExp(`Error schema\\.json must set "${key}" to a path string!`));
    assert.doesNotMatch(result.stderr, /TypeError/);
  });
}

test('parse exits 1 when no schema config path is given', (t) => {
  const dir = setupProject(t);

  const result = runCli(PARSE, [], dir);

  assert.equal(result.status, 1);
  assert.match(result.stdout, /@warp-drive\/schema parse <missing path>/);
  assert.match(result.stdout, /Error Please supply a path to the schema file to parse!/);
});

test('parse exits 1 when the schema config file does not exist', (t) => {
  const dir = setupProject(t);

  const result = runCli(PARSE, ['missing.json'], dir);

  assert.equal(result.status, 1);
  assert.match(result.stdout, /Error missing\.json does not exist!/);
});

// The parser does not yet produce output for any `.ts` schema file: the traverse
// step never populates `exports`, so `compileJSONSchemas` reads the name of an
// export that is not there and throws. Turn this into a real test once
// compilation is implemented.
test.todo('parse compiles declarative schema files into JSON schemas');
