import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { after, describe, it } from 'node:test';

import { rewriteForMirror } from '../core/publish/steps/generate-mirror-tarballs.ts';
import { convertTypesToModules } from '../core/publish/steps/generate-tarballs.ts';
import type { Package } from '../utils/package.ts';
import { makeTempDir, writeFile } from './helpers.ts';

function fakePackage(dir: string, name: string): Package {
  return { filePath: path.join(dir, 'package.json'), pkgData: { name } } as Package;
}

const read = (file: string) => fs.readFileSync(file, 'utf8');

describe('generate-tarballs convertTypesToModules', () => {
  const tmp = makeTempDir('types');
  after(() => fs.rmSync(tmp, { recursive: true, force: true }));

  it('wraps every declaration as an ambient module and references them from index.d.ts', async () => {
    const pkgDir = path.join(tmp, 'with-index');
    const types = path.join(pkgDir, 'unstable-preview-types');
    writeFile(path.join(types, 'index.d.ts'), `export { thing } from './thing';\nexport * from "./sub/other";\n`);
    writeFile(
      path.join(types, 'thing.d.ts'),
      `export declare const thing: number;\n//# sourceMappingURL=thing.d.ts.map`
    );
    writeFile(
      path.join(types, 'sub/other.d.ts'),
      `import type { thing } from '../thing';\nexport type Other = typeof thing;\nexport type Lazy = import('./lazy').Lazy;\n`
    );
    // a directory whose name matches the pattern is skipped, not read
    fs.mkdirSync(path.join(types, 'folder.d.ts'));

    await convertTypesToModules(fakePackage(pkgDir, '@warp-drive/experiments'), 'unstable-preview-types');

    const index = read(path.join(types, 'index.d.ts')).split('\n');
    assert.deepEqual(index.slice(0, 2).sort(), [
      '/// <reference path="./sub/other.d.ts" />',
      '/// <reference path="./thing.d.ts" />',
    ]);
    assert.deepEqual(index.slice(2), [
      `declare module '@warp-drive/experiments' {`,
      `  export { thing } from '@warp-drive/experiments/thing';`,
      `  export * from "@warp-drive/experiments/sub/other";`,
      `  `,
      `}`,
    ]);
    assert.equal(
      read(path.join(types, 'thing.d.ts')),
      `declare module '@warp-drive/experiments/thing' {\n  export const thing: number;\n}\n//# sourceMappingURL=thing.d.ts.map`
    );
    assert.equal(
      read(path.join(types, 'sub/other.d.ts')),
      [
        `declare module '@warp-drive/experiments/sub/other' {`,
        `  import type { thing } from '@warp-drive/experiments/thing';`,
        `  export type Other = typeof thing;`,
        `  export type Lazy = import('@warp-drive/experiments/sub/lazy').Lazy;`,
        `  `,
        `}`,
      ].join('\n')
    );
    assert.ok(fs.statSync(path.join(types, 'folder.d.ts')).isDirectory());
  });

  it('creates index.d.ts with only the references when there is none', async () => {
    const pkgDir = path.join(tmp, 'without-index');
    const types = path.join(pkgDir, 'preview-types');
    writeFile(path.join(types, 'a.d.ts'), `export declare const a: 1;\n`);

    await convertTypesToModules(fakePackage(pkgDir, '@warp-drive/a'), 'preview-types');

    assert.equal(read(path.join(types, 'index.d.ts')), '/// <reference path="./a.d.ts" />');
  });

  it('accepts a package path relative to the process cwd', async () => {
    const pkgDir = path.join(tmp, 'relative');
    const types = path.join(pkgDir, 'types');
    writeFile(path.join(types, 'b.d.ts'), `export declare const b: 1;\n`);

    await convertTypesToModules(fakePackage(path.relative(process.cwd(), pkgDir), '@warp-drive/b'), 'types');

    assert.equal(read(path.join(types, 'b.d.ts')), `declare module '@warp-drive/b/b' {\n  export const b: 1;\n  \n}`);
  });
});

describe('generate-mirror-tarballs rewriteForMirror', () => {
  const tmp = makeTempDir('mirror');
  after(() => fs.rmSync(tmp, { recursive: true, force: true }));

  const toReplace = new Map([
    ['@warp-drive/core', '@warp-drive-mirror/core'],
    ['@ember-data/store', '@ember-data-mirror/store'],
  ]);
  const cautionReplace = new Map([['ember-data', 'ember-data-mirror']]);

  it('rewrites package names in every file, including nested ones', async () => {
    const dir = path.join(tmp, 'core/package');
    writeFile(
      path.join(dir, 'package.json'),
      JSON.stringify({ name: '@warp-drive/core', dependencies: { 'ember-data': '1.0.0' } }, null, 2)
    );
    writeFile(
      path.join(dir, 'dist/index.js'),
      [
        `import { Store } from '@ember-data/store';`,
        `import Model from "ember-data/model";`,
        `import '@warp-drive/core/types';`,
        `const pkg = 'ember-data';`,
        `// mentions ember-data in prose`,
        `const flags = getGlobalConfig().WarpDrive.features;`,
        `const prefix = '@ember-data/';`,
        `const prefix2 = "@ember-data/";`,
        `const name = "WarpDrive";`,
      ].join('\n')
    );
    writeFile(path.join(dir, 'dist/deep/nested/file.d.ts'), `export * from '@warp-drive/core/request';\n`);
    writeFile(path.join(dir, '.dotfile'), `'@warp-drive/core'`);

    await rewriteForMirror(dir, '@warp-drive/core', toReplace, cautionReplace);

    assert.equal(
      read(path.join(dir, 'package.json')),
      JSON.stringify({ name: '@warp-drive-mirror/core', dependencies: { 'ember-data-mirror': '1.0.0' } }, null, 2)
    );
    assert.equal(
      read(path.join(dir, 'dist/index.js')),
      [
        `import { Store } from '@ember-data-mirror/store';`,
        `import Model from "ember-data-mirror/model";`,
        `import '@warp-drive-mirror/core/types';`,
        `const pkg = 'ember-data-mirror';`,
        `// mentions ember-data in prose`,
        `const flags = getGlobalConfig().WarpDriveMirror.features;`,
        `const prefix = '@ember-data-mirror/';`,
        `const prefix2 = "@ember-data-mirror/";`,
        `const name = "WarpDrive";`,
      ].join('\n')
    );
    assert.equal(
      read(path.join(dir, 'dist/deep/nested/file.d.ts')),
      `export * from '@warp-drive-mirror/core/request';\n`
    );
    // dot files are not matched by the scan, so they are left alone
    assert.equal(read(path.join(dir, '.dotfile')), `'@warp-drive/core'`);
  });

  it('renames the quoted global config key only for @warp-drive/build-config', async () => {
    const dir = path.join(tmp, 'build-config/package');
    const source = `setGlobalConfig(import.meta.filename, "WarpDrive", config);\nglobalConfig['WarpDrive'];\n`;
    writeFile(path.join(dir, 'dist/index.js'), source);

    await rewriteForMirror(dir, '@warp-drive/build-config', new Map(), new Map());

    assert.equal(
      read(path.join(dir, 'dist/index.js')),
      `setGlobalConfig(import.meta.filename, "WarpDriveMirror", config);\nglobalConfig['WarpDriveMirror'];\n`
    );
  });
});
