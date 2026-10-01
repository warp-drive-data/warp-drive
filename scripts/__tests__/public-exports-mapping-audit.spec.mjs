/**
 * Area C of scripts/public-exports-mapping: the published package (published.mjs), the audit
 * against a surface (audit.mjs) and the `audit` command.
 *
 * Fixtures live in fixtures/public-exports-mapping/audit/:
 * - `kit/package/` is an exports-map package; `kit.tar.gz` is built from it with
 *   `tar --format=pax --pax-option=delete=atime,delete=ctime --sort=name --owner=0 --group=0
 *   --numeric-owner --mtime='2000-01-01 00:00Z' -cf - -C kit package | gzip -9n > kit.tar.gz`
 *   (one file has a path over 100 bytes, so the archive carries a pax header). Its build output
 *   lives in `lib/` and the archive is not named `.tgz` because the repository ignores `dist` and
 *   `*.tgz`;
 * - `addon/package/` is a v1 addon, read as an unpacked directory.
 * No test reaches the network: `fetchTarball` is handed a `pack` that copies the fixture.
 */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';

import { canonical, REPO_ROOT, writeArtifact } from '../public-exports-mapping/artifacts.mjs';
import { auditRelease, compareWithSurface, publishedKinds } from '../public-exports-mapping/audit.mjs';
import { run } from '../public-exports-mapping/commands/audit.mjs';
import {
  fetchTarball,
  isChunk,
  openPublished,
  packagesAt,
  PublishedPackage,
  PublishedRelease,
  readPublished,
  readTarball,
  tarballPath,
  unpublishedMarkerPath,
} from '../public-exports-mapping/published.mjs';
import { tempDir } from './-run-script.mjs';

const FIXTURES = path.join(import.meta.dirname, 'fixtures', 'public-exports-mapping', 'audit');
const KIT_TGZ = path.join(FIXTURES, 'kit.tar.gz');
const KIT_DIR = path.join(FIXTURES, 'kit', 'package');
const ADDON_DIR = path.join(FIXTURES, 'addon', 'package');
const AMBIENT_FILE =
  'types/ambient-declarations-kept-in-a-directory-with-a-deliberately-long-name/ambient-modules-declared-for-typescript-consumers.d.ts';

const KIT = { name: '@fixture/kit', dir: 'packages/kit', version: '1.2.3' };
const GONE = { name: '@fixture/gone', dir: 'packages/gone', version: '0.1.0' };

/**
 * A `pack` that serves the fixture tarball for `@fixture/kit@1.2.3` and reports every other
 * version as missing from the registry, recording each call.
 */
function fixturePack() {
  /** @type {string[]} */
  const calls = [];
  /** @type {import('../public-exports-mapping/published.mjs').Pack} */
  const pack = async ({ name, version, destination }) => {
    calls.push(`${name}@${version}`);
    if (name !== KIT.name || version !== KIT.version) return null;
    const file = path.join(destination, 'fixture-kit-1.2.3.tgz');
    copyFileSync(KIT_TGZ, file);
    return file;
  };
  return { pack, calls };
}

/**
 * A surface in the contract's shape that disagrees with the published fixture in every way the
 * audit reports.
 */
function fixtureSurface() {
  return {
    schema: 1,
    kind: 'surface',
    version: '1.2.3',
    tag: 'v1.2.3',
    packages: {
      '@fixture/kit': {
        dir: 'packages/kit',
        modules: ['@fixture/kit', '@fixture/kit/gone', '@fixture/kit/internal', '@fixture/kit/widget'],
      },
      '@fixture/gone': { dir: 'packages/gone', modules: ['@fixture/gone'] },
      '@fixture/elsewhere': { dir: 'packages/elsewhere', modules: ['@fixture/elsewhere'] },
    },
    modules: {
      '@fixture/kit': {
        package: '@fixture/kit',
        entry: 'packages/kit/src/index.ts',
        forward: null,
        exports: {
          Widget: { kind: 'value', decl: 'packages/kit/src/widget.ts#Widget' },
          makeWidget: { kind: 'value', decl: 'packages/kit/src/widget.ts#createWidget' },
          WidgetOptions: { kind: 'type', decl: 'packages/kit/src/widget.ts#WidgetOptions' },
          VERSION: { kind: 'type', decl: 'packages/kit/src/index.ts#VERSION' },
          Shared: { kind: 'value', decl: 'packages/kit/src/shared.ts#Shared' },
          removed: { kind: 'value', decl: 'packages/kit/src/removed.ts#removed' },
        },
      },
      '@fixture/kit/widget': {
        package: '@fixture/kit',
        entry: 'packages/kit/src/widget.ts',
        forward: null,
        exports: {
          Widget: { kind: 'value', decl: 'packages/kit/src/widget.ts#Widget' },
          WidgetOptions: { kind: 'type', decl: 'packages/kit/src/widget.ts#WidgetOptions' },
          makeWidget: { kind: 'value', decl: 'packages/kit/src/widget.ts#createWidget' },
        },
      },
      '@fixture/kit/gone': {
        package: '@fixture/kit',
        entry: 'packages/kit/src/gone.ts',
        forward: null,
        exports: { gone: { kind: 'value', decl: 'packages/kit/src/gone.ts#gone' } },
      },
      '@fixture/kit/internal': {
        package: '@fixture/kit',
        entry: 'packages/kit/src/internal.ts',
        forward: null,
        exports: { secret: { kind: 'value', decl: 'packages/kit/src/internal.ts#secret' } },
      },
      '@fixture/gone': {
        package: '@fixture/gone',
        entry: 'packages/gone/src/index.ts',
        forward: null,
        exports: { gone: { kind: 'value', decl: 'packages/gone/src/index.ts#gone' } },
      },
      '@fixture/elsewhere': {
        package: '@fixture/elsewhere',
        entry: 'packages/elsewhere/src/index.ts',
        forward: null,
        exports: { here: { kind: 'value', decl: 'external:@fixture/elsewhere#here' } },
      },
    },
  };
}

/** @param {string} root */
function filesUnder(root) {
  /** @type {Map<string, Buffer>} */
  const files = new Map();
  /** @param {string} dir */
  const walk = (dir) => {
    for (const entry of readdirSync(path.join(root, dir), { withFileTypes: true })) {
      const relative = dir ? `${dir}/${entry.name}` : entry.name;
      if (entry.isDirectory()) walk(relative);
      else files.set(relative, readFileSync(path.join(root, relative)));
    }
  };
  walk('');
  return files;
}

test('the fixture tarball holds exactly the fixture directory, long paths included', () => {
  const fromTarball = readTarball(KIT_TGZ);
  const fromDirectory = filesUnder(KIT_DIR);
  assert.deepEqual([...fromTarball.keys()].sort(), [...fromDirectory.keys()].sort());
  for (const [file, bytes] of fromDirectory) assert.ok(bytes.equals(fromTarball.get(file)), `${file} drifted`);
  assert.ok(fromTarball.has(AMBIENT_FILE), 'the pax path header names the long file');
});

test('readPublished records the exports map and every target that does not ship', () => {
  const kit = readPublished(KIT_TGZ);
  const manifest = JSON.parse(readFileSync(path.join(KIT_DIR, 'package.json'), 'utf8'));
  assert.equal(kit.published, true);
  assert.equal(kit.version, '1.2.3');
  assert.equal(kit.modulesFrom, 'exports');
  assert.deepEqual(kit.exports, manifest.exports);
  assert.deepEqual(kit.missing, {
    './gone': { default: ['./lib/gone.js'] },
    './legacy/*': { default: ['./legacy/*.cjs'] },
    './*': { types: ['./lib/extra.d.ts'] },
  });
});

test('readPublished expands pattern keys past chunks, explicit aliases and nested condition targets', () => {
  const kit = readPublished(KIT_TGZ);
  assert.deepEqual(Object.keys(kit.modules), [
    '@fixture/kit',
    '@fixture/kit/ambient',
    '@fixture/kit/deep',
    '@fixture/kit/extra',
    '@fixture/kit/gone',
    '@fixture/kit/shared',
    '@fixture/kit/widget',
  ]);
  assert.deepEqual(kit.chunks, ['lib/chunk-AbCd1234.js']);
  assert.deepEqual(kit.modules['@fixture/kit/gone'], { runtime: null, types: null });
  assert.equal(kit.modules['@fixture/kit/extra'].types, null, 'the types target of extra does not ship');
});

test('runtime names follow export * through the JS; type names come from the .d.ts or a declare module block', () => {
  const kit = readPublished(KIT_TGZ);
  assert.deepEqual(kit.modules['@fixture/kit'], {
    runtime: {
      file: 'lib/index.js',
      names: ['DEFAULTS', 'VERSION', 'Widget', 'deep', 'helper', 'makeWidget'],
    },
    types: {
      file: 'lib/index.d.ts',
      names: ['DEFAULTS', 'Shared', 'VERSION', 'Widget', 'WidgetOptions', 'deep', 'helper', 'makeWidget'],
    },
  });
  assert.deepEqual(kit.modules['@fixture/kit/deep'].runtime?.names, ['deep', 'default']);
  assert.deepEqual(kit.modules['@fixture/kit/ambient'], {
    runtime: { file: 'lib/ambient.js', names: ['ping'] },
    types: { file: AMBIENT_FILE, names: ['Pong', 'ping'], ambient: true },
  });
  assert.deepEqual(Object.fromEntries(publishedKinds(kit.modules['@fixture/kit/widget'])), {
    Widget: 'value',
    WidgetOptions: 'type',
    makeWidget: 'value',
  });
});

test('shapes print a class, a function and an interface as the .d.ts declares them', () => {
  const { shapes } = new PublishedRelease([openPublished(KIT_TGZ)]).shapes();
  assert.equal(
    shapes.get('@fixture/kit/lib/widget.d.ts#Widget'),
    [
      'class Widget extends EventTarget',
      '  #private',
      '  constructor(options: WidgetOptions)',
      '  readonly label: string',
      '  get size(): number',
      '  static create(options?: Partial<WidgetOptions>): Widget',
      "  render(target: HTMLElement, mode?: 'replace' | 'append'): void",
    ].join('\n')
  );
  assert.equal(
    shapes.get('@fixture/kit/lib/widget.d.ts#makeWidget'),
    'function makeWidget(options: WidgetOptions): Widget'
  );
  assert.equal(
    shapes.get('@fixture/kit/lib/widget.d.ts#WidgetOptions'),
    'interface WidgetOptions { label: string; size?: number; }'
  );
  assert.equal(shapes.get(`@fixture/kit/${AMBIENT_FILE}#ping`), 'function ping(): void');
  assert.equal(shapes.get('@fixture/kit/lib/shared.d.ts#Shared'), 'type Shared = string');
});

test("a v1 addon's modules are its addon/ and addon-test-support/ files, index dropped", () => {
  const addon = readPublished(ADDON_DIR);
  assert.equal(addon.modulesFrom, 'addon');
  assert.deepEqual(Object.keys(addon.modules), [
    '@fixture/addon',
    '@fixture/addon/-private',
    '@fixture/addon/test-support',
    '@fixture/addon/utils/strings',
  ]);
  assert.deepEqual(addon.chunks, ['addon/index-1a2b3c4d.js']);
  assert.deepEqual(addon.modules['@fixture/addon/-private'], {
    runtime: { file: 'addon/-private/index.ts', names: ['Thing', 'configure'] },
    types: { file: 'addon/-private/index.ts', names: ['Mode', 'Options', 'Thing', 'configure'] },
  });
});

test('only code modules count: no package.json, Markdown, JSON, blueprints or unstable-preview-types', () => {
  const files = new Map(
    Object.entries({
      'package.json': JSON.stringify({
        name: '@fixture/tools',
        version: '2.0.0',
        exports: {
          '.': { types: './dist/index.d.ts', default: './dist/index.js' },
          './package.json': './package.json',
          './test-support': { types: './dist/test-support.d.ts', default: './dist/test-support.js' },
          './unstable-preview-types': { types: './unstable-preview-types/index.d.ts' },
          './types': { types: './dist/types.d.ts' },
          './styles/*': './dist/styles/*.css',
          './blueprints/*': './blueprints/*.js',
          './migrate/*': './src/migrate/*',
        },
      }),
      'dist/index.js': 'export const run = () => {};\n',
      'dist/index.d.ts': 'export declare const run: () => void;\n',
      'dist/test-support.js': 'export function setupTest() {}\n',
      'dist/test-support.d.ts': 'export declare function setupTest(): void;\n',
      'dist/types.d.ts': 'export type Mode = "a" | "b";\n',
      'dist/styles/theme.css': ':root {}\n',
      'unstable-preview-types/index.d.ts': "declare module '@fixture/tools' {\n  export const run: () => void;\n}\n",
      'blueprints/model/index.js': 'module.exports = {};\n',
      'src/migrate/README.md': '# migrate\n',
      'src/migrate/config.json': '{}\n',
      'src/migrate/legacy.cjs': 'module.exports = {};\n',
      'src/migrate/task.mjs': 'export function migrate() {}\n',
      'src/migrate/types.ts': 'export interface Options {}\nexport const DEFAULTS: Options = {};\n',
    }).map(([file, text]) => [file, Buffer.from(text)])
  );
  const pkg = new PublishedPackage(files);
  const { modules, missing } = new PublishedRelease([pkg]).describe(pkg);
  assert.deepEqual(Object.keys(modules), [
    '@fixture/tools',
    '@fixture/tools/migrate/legacy.cjs',
    '@fixture/tools/migrate/task.mjs',
    '@fixture/tools/migrate/types.ts',
    '@fixture/tools/test-support',
    '@fixture/tools/types',
  ]);
  assert.deepEqual(modules['@fixture/tools/types'], {
    runtime: null,
    types: { file: 'dist/types.d.ts', names: ['Mode'] },
  });
  assert.deepEqual(modules['@fixture/tools/migrate/types.ts'], {
    runtime: { file: 'src/migrate/types.ts', names: ['DEFAULTS'] },
    types: { file: 'src/migrate/types.ts', names: ['DEFAULTS', 'Options'] },
  });
  assert.deepEqual(missing, {}, 'every target ships, whether or not its subpath counts as a module');
});

test('export * from another package of the release resolves there; read alone it stays unresolved', () => {
  const alone = readPublished(ADDON_DIR);
  assert.deepEqual(alone.modules['@fixture/addon'], {
    runtime: { file: 'addon/index.js', names: ['camelize', 'dasherize', 'default'] },
    types: null,
    unresolved: ['@fixture/kit/widget'],
  });
  const release = new PublishedRelease([openPublished(KIT_TGZ), openPublished(ADDON_DIR)]);
  const together = release.describe(/** @type {any} */ (release.packages.get('@fixture/addon')));
  assert.deepEqual(together.modules['@fixture/addon'], {
    runtime: { file: 'addon/index.js', names: ['Widget', 'camelize', 'dasherize', 'default', 'makeWidget'] },
    types: null,
  });
});

test('names and declarations reached through an export * cycle are complete from every module of it', () => {
  const files = new Map(
    Object.entries({
      'package.json': JSON.stringify({
        name: '@fixture/cycle',
        version: '1.0.0',
        exports: { './*': { types: './*.d.ts', default: './*.js' } },
      }),
      'a.js': "export * from './b.js';\nexport * from './c.js';\nexport const a = 1;\n",
      'a.d.ts': "export * from './b.js';\nexport * from './c.js';\nexport declare const a: 1;\n",
      'b.js': "export * from './a.js';\nexport const b = 2;\n",
      'b.d.ts': "export * from './a.js';\nexport declare const b: 2;\n",
      'c.js': 'export const c = 3;\n',
      'c.d.ts': 'export declare const c: 3;\n',
    }).map(([file, text]) => [file, Buffer.from(text)])
  );
  const pkg = new PublishedPackage(files);
  const release = new PublishedRelease([pkg]);
  // `a` is read first, which reaches `b` while `a` is still being read
  const { modules } = release.describe(pkg);
  for (const module of ['@fixture/cycle/a', '@fixture/cycle/b']) {
    assert.deepEqual(modules[module].runtime?.names, ['a', 'b', 'c'], module);
    assert.deepEqual(modules[module].types?.names, ['a', 'b', 'c'], module);
  }
  const { shapes, declarations } = release.shapes();
  for (const module of ['@fixture/cycle/a', '@fixture/cycle/b', '@fixture/cycle/c']) {
    assert.equal(declarations.get(`${module}\0c`)?.file, 'c.d.ts', module);
  }
  assert.equal(shapes.get('@fixture/cycle/c.d.ts#c'), 'const c: 3');
});

test('fetchTarball packs once into the cache and remembers a version the registry lacks as unpublished', async (t) => {
  const cacheDir = tempDir(t);
  const { pack, calls } = fixturePack();

  const first = await fetchTarball(KIT.name, KIT.version, { cacheDir, pack });
  assert.deepEqual(first, {
    name: KIT.name,
    version: KIT.version,
    status: 'fetched',
    path: path.join(cacheDir, '@fixture+kit', '1.2.3.tgz'),
  });
  assert.equal(first.path, tarballPath(cacheDir, KIT.name, KIT.version));
  assert.ok(readFileSync(KIT_TGZ).equals(readFileSync(/** @type {string} */ (first.path))));
  assert.equal(existsSync(path.join(cacheDir, '@fixture+kit', 'fixture-kit-1.2.3.tgz')), false);

  const second = await fetchTarball(KIT.name, KIT.version, { cacheDir, pack });
  assert.equal(second.status, 'cached');
  assert.deepEqual(calls, ['@fixture/kit@1.2.3'], 'a cached tarball is never packed again');

  const missing = await fetchTarball(GONE.name, GONE.version, { cacheDir, pack });
  assert.deepEqual(missing, { name: GONE.name, version: GONE.version, status: 'unpublished', path: null });
  assert.equal(existsSync(tarballPath(cacheDir, GONE.name, GONE.version)), false);
  const marker = unpublishedMarkerPath(cacheDir, GONE.name, GONE.version);
  assert.equal(marker, path.join(cacheDir, '@fixture+gone', '0.1.0.unpublished'));
  assert.ok(existsSync(marker));

  const again = await fetchTarball(GONE.name, GONE.version, { cacheDir, pack });
  assert.deepEqual(again, missing);
  assert.deepEqual(calls, ['@fixture/kit@1.2.3', '@fixture/gone@0.1.0'], 'the registry is asked once per version');
});

test('the audit compares the published packages with a contract-shaped surface', async (t) => {
  const { audit, shapes, tarballs } = await auditRelease('1.2.3', {
    packages: [GONE, KIT],
    surface: /** @type {any} */ (fixtureSurface()),
    cacheDir: tempDir(t),
    pack: fixturePack().pack,
  });
  assert.deepEqual(
    tarballs.map((tarball) => tarball.status),
    ['unpublished', 'fetched']
  );
  assert.equal(audit.tag, 'v1.2.3');
  assert.equal(audit.surface, 'scripts/public-exports-mapping/surfaces/1.2.3.json');
  assert.deepEqual(audit.surfacePackagesNotInRelease, ['@fixture/elsewhere']);
  assert.deepEqual(audit.packages['@fixture/gone'], {
    dir: 'packages/gone',
    version: '0.1.0',
    published: false,
    differences: {
      modulesNotShipped: ['@fixture/gone'],
      modulesNotInSurface: [],
      tokensNotShipped: {},
      tokensNotInSurface: {},
      kinds: {},
    },
  });
  const kit = /** @type {any} */ (audit.packages['@fixture/kit']);
  assert.equal(kit.dir, 'packages/kit');
  assert.deepEqual(kit.differences, {
    modulesNotShipped: ['@fixture/kit/gone', '@fixture/kit/internal'],
    modulesNotInSurface: ['@fixture/kit/ambient', '@fixture/kit/deep', '@fixture/kit/extra', '@fixture/kit/shared'],
    tokensNotShipped: { '@fixture/kit': ['removed'] },
    tokensNotInSurface: { '@fixture/kit': ['DEFAULTS', 'deep', 'helper'] },
    kinds: {
      '@fixture/kit': {
        Shared: { published: 'type', surface: 'value' },
        VERSION: { published: 'value', surface: 'type' },
      },
    },
  });

  const widget = shapes.shapes['@fixture/kit/lib/widget.d.ts#Widget'];
  assert.match(widget, /^class Widget extends EventTarget\n/);
  assert.equal(shapes.shapes['packages/kit/src/widget.ts#Widget'], widget, 'the source id shares the shape');
  assert.equal(
    shapes.shapes['packages/kit/src/widget.ts#WidgetOptions'],
    'interface WidgetOptions { label: string; size?: number; }'
  );
  assert.equal(
    shapes.shapes['packages/kit/src/widget.ts#createWidget'],
    undefined,
    'a source id whose name differs from the published declaration gets no shape'
  );
});

test('compareWithSurface reports nothing for a surface that matches', async (t) => {
  const { audit } = await auditRelease('1.2.3', { packages: [KIT], cacheDir: tempDir(t), pack: fixturePack().pack });
  /** @type {Record<string, import('../public-exports-mapping/published.mjs').ModuleRecord>} */
  const published = /** @type {any} */ (audit.packages['@fixture/kit']).modules;
  /** @type {Record<string, any>} */
  const modules = {};
  for (const [module, record] of Object.entries(published)) {
    if (!record.runtime && !record.types) continue;
    const exports = Object.fromEntries(
      [...publishedKinds(record)].map(([name, kind]) => [name, { kind, decl: `src#${name}` }])
    );
    modules[module] = { package: '@fixture/kit', exports };
  }
  const { differences, surfaceOnly } = compareWithSurface(audit.packages, /** @type {any} */ ({ modules }));
  assert.deepEqual(surfaceOnly, []);
  assert.deepEqual(differences['@fixture/kit'], {
    modulesNotShipped: [],
    modulesNotInSurface: [],
    tokensNotShipped: {},
    tokensNotInSurface: {},
    kinds: {},
  });
});

test('without a surface the audit records surface: null and no differences', async (t) => {
  const { audit } = await auditRelease('1.2.3', {
    packages: [KIT, GONE],
    cacheDir: tempDir(t),
    pack: fixturePack().pack,
  });
  assert.equal(audit.surface, null);
  assert.equal('surfacePackagesNotInRelease' in audit, false);
  for (const record of Object.values(audit.packages)) assert.equal('differences' in record, false);
  assert.deepEqual(audit.packages['@fixture/gone'], { dir: 'packages/gone', version: '0.1.0', published: false });
});

test('audits and shapes are canonical: the same bytes whatever the package order, and rewriting changes nothing', async (t) => {
  const cacheDir = tempDir(t);
  const { pack } = fixturePack();
  const surface = /** @type {any} */ (fixtureSurface());
  const one = await auditRelease('1.2.3', { packages: [KIT, GONE], surface, cacheDir, pack });
  const two = await auditRelease('1.2.3', { packages: [GONE, KIT], surface, cacheDir, pack });
  assert.equal(canonical(one.audit), canonical(two.audit));
  assert.equal(canonical(one.shapes), canonical(two.shapes));
  assert.doesNotMatch(canonical(one.audit), new RegExp(cacheDir.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));

  const file = path.join(tempDir(t), 'audit.json');
  assert.equal(writeArtifact(file, one.audit).written, true);
  const again = writeArtifact(file, two.audit, { check: true });
  assert.equal(again.changed, false);
  assert.equal(readFileSync(file, 'utf8'), canonical(one.audit));
});

test('run writes audits/ and shapes/, and --check exits 1 only when a file would change', async (t) => {
  t.mock.method(console, 'log', () => {});
  const dataRoot = tempDir(t);
  const cacheDir = tempDir(t);
  /** @type {string[]} */
  const lines = [];
  const options = {
    dataRoot,
    cacheDir,
    pack: fixturePack().pack,
    packages: () => [KIT, GONE],
    releases: () => ({ releases: ['1.2.3'] }),
    log: (/** @type {string} */ line) => lines.push(line),
  };
  mkdirSync(path.join(dataRoot, 'surfaces'), { recursive: true });
  writeFileSync(path.join(dataRoot, 'surfaces', '1.2.3.json'), canonical(fixtureSurface()));

  assert.equal(await run(['1.2.3'], options), 0);
  const auditFile = path.join(dataRoot, 'audits', '1.2.3.json');
  const shapesFile = path.join(dataRoot, 'shapes', '1.2.3.json');
  const audit = JSON.parse(readFileSync(auditFile, 'utf8'));
  assert.equal(audit.kind, 'audit');
  assert.deepEqual(audit.packages['@fixture/kit'].differences.tokensNotShipped, { '@fixture/kit': ['removed'] });
  assert.equal(JSON.parse(readFileSync(shapesFile, 'utf8')).kind, 'shapes');
  assert.match(lines[0], /^audit 1\.2\.3: 2 packages \(1 unpublished, 1 fetched\), 7 modules, .*surface compared$/);

  assert.equal(await run(['--all', '--check'], options), 0);
  writeFileSync(auditFile, readFileSync(auditFile, 'utf8').replace('"removed"', '"renamed"'));
  assert.equal(await run(['audit', '1.2.3', '--check'], options), 1);
  assert.match(readFileSync(auditFile, 'utf8'), /"renamed"/, '--check writes nothing');

  assert.equal(await run([], options), 2);
  assert.equal(await run(['--all', '1.2.3'], options), 2);
  assert.equal(await run(['--bogus'], options), 2);
});

test('isChunk tells content-hashed build chunks from entries', () => {
  for (const file of ['dist/index-cc461d33.js', 'dist/many-array-BwVo-2vv.js', 'dist/-private-BFNUVPb_.d.ts']) {
    assert.equal(isChunk(file), true, file);
  }
  for (const file of ['dist/reactive-document.js', 'dist/no-legacy-request-patterns.js', 'dist/-private.js']) {
    assert.equal(isChunk(file), false, file);
  }
});

test('packagesAt lists the non-private packages of the working tree with their own versions', () => {
  const packages = packagesAt('head');
  const core = packages.find((pkg) => pkg.name === '@warp-drive/core');
  assert.equal(core?.dir, 'warp-drive-packages/core');
  const manifest = JSON.parse(readFileSync(path.join(REPO_ROOT, 'warp-drive-packages/core/package.json'), 'utf8'));
  assert.equal(core?.version, manifest.version);
  assert.equal(
    packages.some((pkg) => pkg.name === '@ember-data/unpublished-test-infra'),
    false,
    'private packages are skipped'
  );
  assert.deepEqual(
    packages.map((pkg) => pkg.name),
    packages.map((pkg) => pkg.name).sort()
  );
});

test('packagesAt reads a release tag, where a package may carry its own version', (t) => {
  try {
    execFileSync('git', ['rev-parse', '--verify', '--quiet', 'v5.4.1^{commit}'], { cwd: REPO_ROOT, stdio: 'ignore' });
  } catch {
    t.skip('tag v5.4.1 is not in this clone');
    return;
  }
  const packages = packagesAt('5.4.1');
  assert.deepEqual(
    packages.find((pkg) => pkg.name === '@warp-drive/core'),
    { name: '@warp-drive/core', dir: 'warp-drive-packages/core', version: '5.4.1-alpha.142' }
  );
  assert.equal(packages.find((pkg) => pkg.name === '@ember-data/store')?.version, '5.4.1');
  assert.equal(
    packages.some((pkg) => pkg.name === '@ember-data/codemods'),
    false,
    'the codemods package was private at 5.4.1'
  );
});
