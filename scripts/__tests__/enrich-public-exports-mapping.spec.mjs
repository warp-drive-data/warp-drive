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
  const candidate = {
    module: '@warp-drive/core',
    export: 'Store',
    sourceFile: 'warp-drive-packages/core/src/index.ts',
    typeOnly: false,
    score: 11,
    isRoot: true,
  };

  assert.deepEqual(enriched, [
    {
      ...entry('packages/store/src/index.ts', '@ember-data/store', 'Store'),
      replacement: {
        all: [candidate],
        module: candidate.module,
        export: candidate.export,
        sourceFile: candidate.sourceFile,
        typeOnly: candidate.typeOnly,
        score: candidate.score,
        userAction: 'auto',
      },
    },
    {
      ...entry('packages/model/src/index.ts', '@ember-data/model', 'Model'),
      replacement: {
        all: [],
        notFound: true,
        missing: true,
        starExportFilePath: 'packages/model/src/index.ts',
        userAction: 'auto',
      },
    },
  ]);
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
