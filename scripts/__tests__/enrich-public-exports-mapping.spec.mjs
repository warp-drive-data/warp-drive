import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';

import { runScript, tempDir } from './-run-script.mjs';

function write(root, file, content) {
  const target = path.join(root, file);
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, typeof content === 'string' ? content : JSON.stringify(content, null, 2));
}

function entry(filePath, module, exportName) {
  return { filePath, module, export: exportName, typeOnly: false, replacement: {} };
}

function makeFixture(t) {
  const root = tempDir(t);
  // the warp-drive side: one package exporting one symbol
  write(root, 'warp-drive-packages/core/src/index.ts', 'export class Store {}\n');
  write(root, 'public-exports-mapping-wd.json', [
    entry('warp-drive-packages/core/src/index.ts', '@warp-drive/core', 'Store'),
  ]);
  // the ember-data side: one export that resolves, one that does not
  write(root, 'packages/store/src/index.ts', 'export class Store {}\n');
  write(root, 'packages/model/src/index.ts', "export * from './-private';\n");
  write(root, 'mapping.json', [
    entry('packages/store/src/index.ts', '@ember-data/store', 'Store'),
    entry('packages/model/src/index.ts', '@ember-data/model', 'Model'),
  ]);
  return root;
}

test('it enriches each mapping entry with its warp-drive replacement', (t) => {
  const root = makeFixture(t);

  const { status, stdout, stderr } = runScript(
    'enrich-public-exports-mapping.ts',
    ['--in', 'mapping.json', '--wd', 'public-exports-mapping-wd.json', '--root', '.', '--out', 'enriched.json'],
    { cwd: root }
  );

  assert.equal(status, 0, stderr);
  assert.match(stdout, /Export index built with 1 distinct symbol names\./);
  assert.match(stdout, /Wrote enriched mapping to .*enriched\.json/);

  const enriched = JSON.parse(readFileSync(path.join(root, 'enriched.json'), 'utf8'));
  assert.equal(enriched.length, 2);
  const [store, model] = enriched;

  // Scores are heuristic; only their presence is part of this contract.
  const target = {
    module: '@warp-drive/core',
    export: 'Store',
    sourceFile: 'warp-drive-packages/core/src/index.ts',
    typeOnly: false,
  };

  assert.equal(store.export, 'Store');
  assert.equal(store.module, '@ember-data/store');
  assert.ok(Array.isArray(store.replacement.all));
  assert.equal(store.replacement.all.length, 1);
  for (const [key, value] of Object.entries(target)) {
    assert.equal(store.replacement.all[0][key], value, `replacement.all[0].${key}`);
    assert.equal(store.replacement[key], value, `replacement.${key}`);
  }
  assert.equal(typeof store.replacement.score, 'number');
  assert.equal(typeof store.replacement.all[0].score, 'number');
  assert.equal(store.replacement.notFound, undefined);
  assert.equal(store.replacement.missing, undefined);
  assert.equal(store.replacement.starExportFilePath, undefined);

  assert.equal(model.export, 'Model');
  assert.equal(model.module, '@ember-data/model');
  assert.deepEqual(model.replacement.all, []);
  assert.equal(model.replacement.module, undefined);
  assert.equal(model.replacement.notFound, true);
  assert.equal(model.replacement.missing, true);
  assert.equal(model.replacement.starExportFilePath, 'packages/model/src/index.ts');
});

test('it writes <in>.enriched.json next to the input when --out is omitted', (t) => {
  const root = makeFixture(t);

  const { status, stderr } = runScript(
    'enrich-public-exports-mapping.ts',
    ['--in', 'mapping.json', '--wd', 'public-exports-mapping-wd.json', '--root', root],
    { cwd: root }
  );

  assert.equal(status, 0, stderr);
  const enriched = JSON.parse(readFileSync(path.join(root, 'mapping.enriched.json'), 'utf8'));
  assert.deepEqual(
    enriched.map((e) => [e.export, e.replacement.module ?? null, e.replacement.notFound ?? false]),
    [
      ['Store', '@warp-drive/core', false],
      ['Model', null, true],
    ]
  );
});
