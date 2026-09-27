import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';

import { scanFiles } from '../utils/glob.ts';
import { gatherPackages, loadStrategy } from '../utils/package.ts';
import { makeTempDir, writeFile, writeJson } from './helpers.ts';

describe('utils/package', () => {
  let cwd: string;

  before(() => {
    cwd = makeTempDir('package');
    writeJson(path.join(cwd, 'package.json'), { name: 'root', version: '1.0.0', private: true });
    writeJson(path.join(cwd, 'packages/a/package.json'), { name: '@scope/a', version: '1.0.0' });
    writeJson(path.join(cwd, 'packages/b/package.json'), { name: 'b', version: '0.1.0' });
    // not a package: no package.json directly inside
    fs.mkdirSync(path.join(cwd, 'packages/empty/src'), { recursive: true });
    // too deep for `packages/*`
    writeJson(path.join(cwd, 'packages/a/node_modules/dep/package.json'), { name: 'dep', version: '9.9.9' });
    writeJson(path.join(cwd, 'tools/c/package.json'), { name: 'c', version: '2.0.0', private: true });
    writeJson(path.join(cwd, 'tools/release/strategy.json'), {
      config: { packageRoots: ['packages/*', 'tools/*', 'does-not-exist'] },
      defaults: { stage: 'stable', types: 'private' },
      rules: {},
    });
  });

  after(() => fs.rmSync(cwd, { recursive: true, force: true }));

  it('loadStrategy reads tools/release/strategy.json below cwd', async () => {
    const strategy = await loadStrategy(cwd);
    assert.deepEqual(strategy.config.packageRoots, ['packages/*', 'tools/*', 'does-not-exist']);
  });

  it('gatherPackages finds the root and every package root, keyed by name', async () => {
    const strategy = await loadStrategy(cwd);
    const packages = await gatherPackages(strategy.config, cwd);

    assert.deepEqual([...packages.keys()].sort(), ['@scope/a', 'b', 'c', 'root']);

    const root = packages.get('root')!;
    assert.equal(root.filePath, `${cwd}/package.json`);
    assert.equal(root.pkgData.version, '1.0.0');

    // package paths are relative to cwd; callers join them with cwd or PROJECT_ROOT
    assert.equal(packages.get('@scope/a')!.filePath, 'packages/a/package.json');
    assert.equal(packages.get('@scope/a')!.projectPath, 'packages/a');
    assert.equal(packages.get('b')!.filePath, 'packages/b/package.json');
    assert.equal(packages.get('c')!.filePath, 'tools/c/package.json');
    assert.equal(packages.get('c')!.pkgData.private, true);
    assert.equal(packages.get('c')!.file.filePath, path.join(cwd, 'tools/c/package.json'));
  });

  it('Package#refresh re-reads package.json from disk', async () => {
    const strategy = await loadStrategy(cwd);
    const packages = await gatherPackages(strategy.config, cwd);
    const pkg = packages.get('b')!;
    writeJson(path.join(cwd, 'packages/b/package.json'), { name: 'b', version: '0.2.0' });
    await pkg.refresh();
    assert.equal(pkg.pkgData.version, '0.2.0');
  });
});

describe('utils/glob scanFiles', () => {
  let cwd: string;

  before(() => {
    cwd = makeTempDir('glob');
    writeFile(path.join(cwd, 'index.d.ts'), '');
    writeFile(path.join(cwd, 'sub/deep/thing.d.ts'), '');
    writeFile(path.join(cwd, 'sub/file.js'), '');
    writeFile(path.join(cwd, '.hidden/secret.d.ts'), '');
    writeFile(path.join(cwd, '.dotfile'), '');
    // a directory whose name matches the pattern
    fs.mkdirSync(path.join(cwd, 'dir.d.ts'));
  });

  after(() => fs.rmSync(cwd, { recursive: true, force: true }));

  async function scan(pattern: string, dir: string) {
    const found: string[] = [];
    for await (const file of scanFiles(pattern, dir)) found.push(file);
    return found.sort();
  }

  it('yields only files, relative to cwd, skipping dot entries', async () => {
    assert.deepEqual(await scan('**/*', cwd), ['index.d.ts', 'sub/deep/thing.d.ts', 'sub/file.js']);
    assert.deepEqual(await scan('**/*.d.ts', cwd), ['index.d.ts', 'sub/deep/thing.d.ts']);
  });

  it('follows symbolic links to files, skipping broken links and links to directories', async () => {
    const base = makeTempDir('glob-links');
    try {
      writeFile(path.join(base, 'target/real.d.ts'), '');
      fs.mkdirSync(path.join(base, 'target/dir'));
      const tree = path.join(base, 'tree');
      writeFile(path.join(tree, 'plain.d.ts'), '');
      writeFile(path.join(tree, 'sub/nested.d.ts'), '');
      fs.symlinkSync('../target/real.d.ts', path.join(tree, 'linked.d.ts'));
      fs.symlinkSync('../../target/real.d.ts', path.join(tree, 'sub/linked-nested.d.ts'));
      // a link to a directory is never yielded itself, even when its name matches
      fs.symlinkSync('../target/dir', path.join(tree, 'linked-dir.d.ts'));
      fs.symlinkSync('../target/missing.d.ts', path.join(tree, 'broken.d.ts'));

      assert.deepEqual(await scan('**/*.d.ts', tree), [
        'linked.d.ts',
        'plain.d.ts',
        'sub/linked-nested.d.ts',
        'sub/nested.d.ts',
      ]);
    } finally {
      fs.rmSync(base, { recursive: true, force: true });
    }
  });

  it('accepts a cwd relative to the process cwd', async () => {
    const relative = path.relative(process.cwd(), path.join(cwd, 'sub'));
    assert.deepEqual(await scan('**/*', relative), ['deep/thing.d.ts', 'file.js']);
  });

  it('yields nothing for a missing directory', async () => {
    assert.deepEqual(await scan('**/*', path.join(cwd, 'nope')), []);
  });
});
