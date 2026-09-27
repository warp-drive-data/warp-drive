import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';

import { CLI, createStubBin, makeTempDir, readJson, run, writeFile, writeJson, type RunResult } from './helpers.ts';

/**
 * A miniature WarpDrive monorepo, just big enough to walk every step of
 * `release publish canary --dry-run`:
 *
 * - `@warp-drive/utilities`: stable, stable types, mirror-published. Its
 *   tarball is unpacked and rewritten to `@warp-drive-mirror/utilities`.
 *   `printDirtyFiles` also insists on `warp-drive-packages/utilities/dist/index.js`.
 * - `@warp-drive/experiments`: alpha stage, alpha types, types-published. Its
 *   `dist/**\/*.d.ts` are synthesized into `unstable-preview-types/` and
 *   wrapped as ambient modules.
 * - `@warp-drive/internal`: private, so it is versioned but never packed.
 */
function createFixture(root: string, gitConfig: string) {
  const prepack = (name: string) => `node -e "require('fs').writeFileSync('prepack.log', '${name}')"`;

  writeJson(path.join(root, 'package.json'), {
    name: 'root',
    version: '1.2.0-alpha.3',
    private: true,
    // the same wiring as the real root package.json
    scripts: { release: CLI },
  });
  writeFile(path.join(root, 'pnpm-workspace.yaml'), `packages:\n  - 'packages/*'\n  - 'warp-drive-packages/*'\n`);
  writeFile(path.join(root, '.gitignore'), `node_modules\ntmp\nprepack.log\n`);
  writeJson(path.join(root, 'tools/release/strategy.json'), {
    config: { packageRoots: ['packages/*', 'warp-drive-packages/*'] },
    defaults: { stage: 'stable', types: 'private', mirrorPublish: false, typesPublish: false, unpkgPublish: false },
    rules: {
      '@warp-drive/utilities': { stage: 'stable', types: 'stable', mirrorPublish: true, typesPublish: false },
      '@warp-drive/experiments': { stage: 'alpha', types: 'alpha', mirrorPublish: false, typesPublish: true },
      '@warp-drive/internal': { stage: 'alpha', types: 'private' },
    },
  });

  const utilities = path.join(root, 'warp-drive-packages/utilities');
  writeJson(path.join(utilities, 'package.json'), {
    name: '@warp-drive/utilities',
    version: '1.2.0-alpha.3',
    license: 'MIT',
    files: ['dist'],
    exports: { '.': { types: './dist/index.d.ts', default: './dist/index.js' } },
    scripts: { prepack: prepack('@warp-drive/utilities') },
    dependencies: { '@warp-drive/experiments': 'workspace:*' },
  });
  writeFile(
    path.join(utilities, 'dist/index.js'),
    `export { thing } from '@warp-drive/experiments';\nexport const name = "@warp-drive/utilities";\n`
  );
  writeFile(path.join(utilities, 'dist/index.d.ts'), `export declare const name: string;\n`);
  writeFile(path.join(utilities, 'dist/nested/deep.js'), `export const pkg = '@warp-drive/utilities/nested';\n`);

  const experiments = path.join(root, 'packages/experiments');
  writeJson(path.join(experiments, 'package.json'), {
    name: '@warp-drive/experiments',
    version: '0.0.1-alpha.7',
    license: 'MIT',
    files: ['dist'],
    exports: { '.': { default: './dist/index.js' } },
    scripts: { prepack: prepack('@warp-drive/experiments') },
  });
  writeFile(path.join(experiments, 'dist/index.js'), `export const thing = 1;\n`);
  writeFile(
    path.join(experiments, 'dist/index.d.ts'),
    `export { thing } from './thing';\nexport type { Other } from './sub/other';\n`
  );
  writeFile(path.join(experiments, 'dist/thing.d.ts'), `export declare const thing: number;\n`);
  writeFile(
    path.join(experiments, 'dist/sub/other.d.ts'),
    `import type { thing } from '../thing';\nexport type Other = typeof thing;\n`
  );

  writeJson(path.join(root, 'packages/internal/package.json'), {
    name: '@warp-drive/internal',
    version: '0.0.0-alpha.1',
    private: true,
  });

  writeFile(
    gitConfig,
    `[user]\n\tname = Release Test\n\temail = release-test@example.com\n[commit]\n\tgpgsign = false\n[tag]\n\tgpgsign = false\n[init]\n\tdefaultBranch = main\n`
  );
  const env = { ...process.env, GIT_CONFIG_GLOBAL: gitConfig, GIT_CONFIG_NOSYSTEM: '1' };
  execFileSync('git', ['init', '-q', '-b', 'main'], { cwd: root, env });
  execFileSync('git', ['add', '-A'], { cwd: root, env });
  execFileSync('git', ['commit', '-q', '-m', 'initial'], { cwd: root, env });
}

function listTarball(tarball: string): string[] {
  return execFileSync('tar', ['-tzf', tarball], { encoding: 'utf8' }).split('\n').filter(Boolean).sort();
}

function readFromTarball(tarball: string, file: string): string {
  return execFileSync('tar', ['-xzOf', tarball, `package/${file}`], { encoding: 'utf8' });
}

describe('pnpm release publish canary --dry-run (fixture monorepo)', () => {
  let root: string;
  let stub: ReturnType<typeof createStubBin>;
  let result: RunResult;
  let git: (...args: string[]) => string;
  const tarballDir = () => path.join(root, 'tmp/tarballs/1.2.0-alpha.4');

  before(() => {
    const base = makeTempDir('publish');
    root = path.join(base, 'repo');
    fs.mkdirSync(root);
    const gitConfig = path.join(base, 'gitconfig');
    createFixture(root, gitConfig);
    stub = createStubBin();
    const env = stub.env({
      ...process.env,
      CI: 'true',
      GIT_CONFIG_GLOBAL: gitConfig,
      GIT_CONFIG_NOSYSTEM: '1',
      // keep pnpm from reaching for a registry or a shared store while installing the fixture
      npm_config_offline: 'true',
      npm_config_store_dir: path.join(base, 'pnpm-store'),
    });
    git = (...args: string[]) => execFileSync('git', args, { cwd: root, env, encoding: 'utf8' }).trim();
    // the way release.yml invokes it, so the tool's own pnpm install/pack/publish
    // calls run nested inside `pnpm run`
    result = run('pnpm', ['release', 'publish', 'canary', '-i', 'patch', '--dry-run'], {
      cwd: root,
      env,
      timeout: 180_000,
    });
  });

  after(() => {
    if (root) fs.rmSync(path.dirname(root), { recursive: true, force: true });
    if (stub) fs.rmSync(stub.dir, { recursive: true, force: true });
  });

  it('exits successfully', () => {
    assert.equal(result.status, 0, `stdout:\n${result.text}\nstderr:\n${result.stderr}`);
  });

  it('prints the resolved config', () => {
    assert.match(result.text, /channel\s*:?\s*.*canary/i);
    assert.match(result.text, /dry[_ ]run/i);
  });

  it('prints the release strategy with the version bumps', () => {
    assert.match(result.text, /Release Strategy for patch bump in canary channel/);
    // | New? | Name | Mirror | Types | From | To | Stage | Types | Dist Tag | Status | Location |
    const row = (name: string) => {
      const line = result.text.split('\n').find((l) => l.includes(`| ${name} `));
      assert.ok(line, `${name} row missing`);
      return line
        .trim()
        .split('|')
        .slice(1, -1)
        .map((cell) => cell.trim());
    };

    assert.deepEqual(row('@warp-drive/utilities'), [
      '',
      '@warp-drive/utilities',
      '✅',
      'N/A',
      '1.2.0-alpha.3',
      '1.2.0-alpha.4',
      'stable',
      'stable',
      'canary',
      'public',
      '<root>/warp-drive-packages',
    ]);
    assert.deepEqual(row('@warp-drive/experiments'), [
      '',
      '@warp-drive/experiments',
      'N/A',
      '✅',
      '0.0.1-alpha.7',
      '0.0.1-alpha.8',
      'alpha',
      'alpha',
      'canary',
      'public',
      '<root>/packages',
    ]);
    assert.deepEqual(row('@warp-drive/internal'), [
      '',
      '@warp-drive/internal',
      'N/A',
      'N/A',
      '0.0.0-alpha.1',
      '0.0.0-alpha.2',
      'alpha',
      'private',
      'N/A',
      'private',
      '<root>/packages',
    ]);
    assert.deepEqual(row('root'), [
      '',
      'root',
      'N/A',
      'N/A',
      '1.2.0-alpha.3',
      '1.2.0-alpha.4',
      'stable',
      'private',
      'N/A',
      'private',
      '<root>',
    ]);
  });

  it('runs each public package prepack script (and only those)', () => {
    assert.equal(
      fs.readFileSync(path.join(root, 'warp-drive-packages/utilities/prepack.log'), 'utf8'),
      '@warp-drive/utilities'
    );
    assert.equal(
      fs.readFileSync(path.join(root, 'packages/experiments/prepack.log'), 'utf8'),
      '@warp-drive/experiments'
    );
    assert.equal(fs.existsSync(path.join(root, 'packages/internal/prepack.log')), false);
  });

  it('commits and tags the version bump locally without pushing', () => {
    assert.equal(git('log', '-1', '--format=%s'), 'Release v1.2.0-alpha.4');
    assert.equal(git('tag', '--list'), 'v1.2.0-alpha.4');
    assert.equal(git('status', '--porcelain', '--untracked-files=no'), '');
    assert.equal(readJson<{ version: string }>(path.join(root, 'package.json')).version, '1.2.0-alpha.4');
    assert.equal(
      readJson<{ version: string }>(path.join(root, 'packages/experiments/package.json')).version,
      '0.0.1-alpha.8'
    );
  });

  it('packs exactly the expected tarballs', () => {
    assert.deepEqual(fs.readdirSync(tarballDir()).sort(), [
      'warp-drive-experiments-0.0.1-alpha.8.tgz',
      'warp-drive-mirror-utilities-1.2.0-alpha.4.tgz',
      'warp-drive-types-experiments-0.0.1-alpha.8.tgz',
      'warp-drive-utilities-1.2.0-alpha.4.tgz',
    ]);
  });

  it('pins workspace dependencies and drops prepack in the main tarball', () => {
    const tarball = path.join(tarballDir(), 'warp-drive-utilities-1.2.0-alpha.4.tgz');
    const pkg = JSON.parse(readFromTarball(tarball, 'package.json'));
    assert.equal(pkg.name, '@warp-drive/utilities');
    assert.equal(pkg.version, '1.2.0-alpha.4');
    assert.equal(pkg.dependencies['@warp-drive/experiments'], '0.0.1-alpha.8');
    assert.equal(pkg.scripts?.prepack, undefined);
  });

  it('rewrites package names in every file of the mirror tarball', () => {
    const tarball = path.join(tarballDir(), 'warp-drive-mirror-utilities-1.2.0-alpha.4.tgz');
    assert.deepEqual(listTarball(tarball), [
      'package/dist/index.d.ts',
      'package/dist/index.js',
      'package/dist/nested/deep.js',
      'package/package.json',
    ]);
    const pkg = JSON.parse(readFromTarball(tarball, 'package.json'));
    assert.equal(pkg.name, '@warp-drive-mirror/utilities');
    assert.equal(
      readFromTarball(tarball, 'dist/index.js'),
      `export { thing } from '@warp-drive/experiments';\nexport const name = "@warp-drive-mirror/utilities";\n`
    );
    assert.equal(
      readFromTarball(tarball, 'dist/nested/deep.js'),
      `export const pkg = '@warp-drive-mirror/utilities/nested';\n`
    );
  });

  it('ships alpha types as ambient modules in the main and types tarballs', () => {
    const main = path.join(tarballDir(), 'warp-drive-experiments-0.0.1-alpha.8.tgz');
    const files = listTarball(main);
    assert.ok(files.includes('package/unstable-preview-types/index.d.ts'), files.join('\n'));
    assert.ok(files.includes('package/unstable-preview-types/sub/other.d.ts'), files.join('\n'));

    const pkg = JSON.parse(readFromTarball(main, 'package.json'));
    assert.deepEqual(pkg.exports['./unstable-preview-types'], { types: './unstable-preview-types/index.d.ts' });

    const index = readFromTarball(main, 'unstable-preview-types/index.d.ts');
    const indexLines = index.split('\n');
    assert.deepEqual(indexLines.slice(0, 2).sort(), [
      '/// <reference path="./sub/other.d.ts" />',
      '/// <reference path="./thing.d.ts" />',
    ]);
    assert.equal(
      indexLines.slice(2).join('\n'),
      `declare module '@warp-drive/experiments' {\n  export { thing } from '@warp-drive/experiments/thing';\n  export type { Other } from '@warp-drive/experiments/sub/other';\n  \n}`
    );
    assert.equal(
      readFromTarball(main, 'unstable-preview-types/sub/other.d.ts'),
      `declare module '@warp-drive/experiments/sub/other' {\n  import type { thing } from '@warp-drive/experiments/thing';\n  export type Other = typeof thing;\n  \n}`
    );

    const types = path.join(tarballDir(), 'warp-drive-types-experiments-0.0.1-alpha.8.tgz');
    const typesPkg = JSON.parse(readFromTarball(types, 'package.json'));
    assert.equal(typesPkg.name, '@warp-drive-types/experiments');
    assert.equal(typesPkg.version, '0.0.1-alpha.8');
    assert.ok(listTarball(types).includes('package/unstable-preview-types/thing.d.ts'));
  });

  it('verifies the tarballs', () => {
    assert.match(result.text, /Verifying tarballs/);
    assert.match(result.text, /Tarball exists for package @warp-drive\/utilities/);
    assert.match(result.text, /Mirror tarball exists for package @warp-drive\/utilities/);
    assert.match(result.text, /Types tarball exists for package @warp-drive\/experiments/);
  });

  it('only runs `pnpm publish --dry-run`, once per tarball', () => {
    const calls = fs.readFileSync(stub.publishLog, 'utf8').trim().split('\n').sort();
    const expected = [
      'warp-drive-experiments-0.0.1-alpha.8.tgz',
      'warp-drive-mirror-utilities-1.2.0-alpha.4.tgz',
      'warp-drive-types-experiments-0.0.1-alpha.8.tgz',
      'warp-drive-utilities-1.2.0-alpha.4.tgz',
    ].map(
      (tarball) =>
        `publish ${path.join(tarballDir(), tarball)} --tag=canary --access=public --provenance --no-git-checks --dry-run`
    );
    assert.deepEqual(calls, expected.sort());
    assert.match(result.text, /published 4 📦 packages to npm/);
  });
});
