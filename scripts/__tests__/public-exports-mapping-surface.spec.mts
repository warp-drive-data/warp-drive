import assert from 'node:assert/strict';
import { readdirSync, readFileSync, realpathSync, symlinkSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { describe, test, type TestContext } from 'node:test';

import { canonical, REPO_ROOT, writeArtifact } from '../public-exports-mapping/artifacts.mts';
import {
  CONTRACT_COMMANDS,
  listCommands,
  main,
  NOT_IMPLEMENTED,
  runSteps,
  type Context,
} from '../public-exports-mapping/cli.mts';
import { run as release } from '../public-exports-mapping/commands/release.mts';
import { run as surfaceCommand } from '../public-exports-mapping/commands/surface.mts';
import { blankTemplateTags, exportsOfSource, type ExportRecord } from '../public-exports-mapping/exports.mts';
import { createResolver } from '../public-exports-mapping/resolver.mts';
import {
  bestExportsKey,
  discoverWorkspace,
  globToRegExp,
  surfaceOf,
  type Surface,
} from '../public-exports-mapping/surface.mts';
import { releaseTreeDir, tagOf } from '../public-exports-mapping/worktrees.mts';
import { tempDir } from './-run-script.mjs';
import { tree as SURFACE_TREE } from './fixtures/public-exports-mapping/surface.mts';
import { materialize, writeTree } from './fixtures/public-exports-mapping/tree.mts';

/** The fixture trees, written to disk once for this file. */
const FIXTURES = materialize(SURFACE_TREE, 'warp-drive-surface-fixtures-');
const FIXTURE_COMMANDS = path.join(FIXTURES, 'commands');

const computed: Map<string, { surface: Surface; diagnostics: { code: string; message: string }[] }> = new Map();

/**
 * The surface of one fixture tree (computed once) and the diagnostics it reported.
 */
function fixture(era: 'rollup' | 'vite' | 'tsdown') {
  let found = computed.get(era);
  if (!found) {
    const diagnostics: { code: string; message: string }[] = [];
    const surface = surfaceOf(path.join(FIXTURES, era), { version: '0.0.0', tag: 'v0.0.0', diagnostics });
    found = { surface, diagnostics };
    computed.set(era, found);
  }
  return found;
}

/**
 * Collects what the code under test prints, for the rest of the test.
 */
function captureConsole(t: TestContext) {
  const out: { log: string[]; error: string[] } = { log: [], error: [] };
  t.mock.method(console, 'log', (...args: unknown[]) => out.log.push(args.join(' ')));
  t.mock.method(console, 'error', (...args: unknown[]) => out.error.push(args.join(' ')));
  return out;
}

describe('rollup era: addon.publicEntrypoints', () => {
  const STORE = 'packages/store/src/-private/store-service.ts';
  const CACHES = 'packages/store/src/-private/caches.ts';

  test('entries are the sources whose .js output a public entrypoint matches, index dropped from the name', () => {
    const { surface, diagnostics } = fixture('rollup');
    assert.deepEqual(surface.packages, {
      '@fx/infra': { dir: 'packages/infra', modules: [] },
      '@fx/store': { dir: 'packages/store', modules: ['@fx/store', '@fx/store/-private'] },
      'fx-meta': {
        dir: 'packages/-meta',
        modules: ['fx-meta', 'fx-meta/-private', 'fx-meta/store', 'fx-meta/test-support', 'fx-meta/test-support/setup'],
      },
    });
    assert.equal(surface.modules['@fx/store'].entry, 'packages/store/src/index.ts');
    assert.equal(surface.modules['@fx/store/-private'].entry, 'packages/store/src/-private.ts');
    // the commented-out publicEntrypoints call and the private package's missing entry are not findings
    assert.deepEqual(diagnostics, [
      {
        code: 'entry-not-found',
        message: "packages/store/rollup.config.mjs: publicEntrypoints 'error.js' matches no file under src/",
      },
    ]);
  });

  test('a v1 addon exposes every module of addon/ except declaration files', () => {
    const { surface } = fixture('rollup');
    assert.equal(surface.modules['fx-meta'].entry, 'packages/-meta/addon/index.js');
    assert.equal(surface.modules['fx-meta/-private'].entry, 'packages/-meta/addon/-private/index.ts');
    assert.equal(surface.modules['fx-meta/types'], undefined);
  });

  test("a v1 addon's addon-test-support/ is served as <pkg>/test-support", () => {
    const { surface } = fixture('rollup');
    const setup = { kind: 'value', decl: 'packages/-meta/addon-test-support/setup.ts#setupStore' };
    assert.deepEqual(surface.modules['fx-meta/test-support'], {
      package: 'fx-meta',
      entry: 'packages/-meta/addon-test-support/index.js',
      forward: null,
      exports: {
        setupStore: setup, // re-exported from 'fx-meta/test-support/setup', resolved to the same tree
        render: { kind: 'value', decl: 'packages/-meta/addon-test-support/index.js#render' },
      },
    });
    assert.deepEqual(surface.modules['fx-meta/test-support/setup'].exports, { setupStore: setup });
    assert.equal(surface.modules['fx-meta/test-support/types'], undefined);
  });

  test('a default export keeps one identity through every re-export form', () => {
    const { surface } = fixture('rollup');
    const store = { kind: 'value', decl: `${STORE}#default` };
    assert.deepEqual(surface.modules['@fx/store'].exports.default, store); // export { default } from
    assert.deepEqual(surface.modules['@fx/store/-private'].exports.Store, store); // export { default as Store }
    assert.deepEqual(surface.modules['fx-meta'].exports.default, store); // import Store; export default Store
    assert.deepEqual(surface.modules['fx-meta/store'].exports.default, store); // across packages
  });

  test('export * chains resolve through every hop and keep @deprecated', () => {
    const { surface } = fixture('rollup');
    assert.deepEqual(surface.modules['@fx/store/-private'], {
      package: '@fx/store',
      entry: 'packages/store/src/-private.ts',
      forward: './-private/index',
      exports: {
        Store: { kind: 'value', decl: `${STORE}#default` },
        Thing: { kind: 'value', decl: 'packages/store/src/-private/thing.js#Thing' },
        recordIdentifierFor: { kind: 'value', decl: `${CACHES}#recordIdentifierFor`, deprecated: true },
        cacheFor: { kind: 'value', decl: `${CACHES}#cacheFor` },
      },
    });
    assert.deepEqual(surface.modules['@fx/store'].exports, {
      default: { kind: 'value', decl: `${STORE}#default` },
      recordIdentifierFor: { kind: 'value', decl: `${CACHES}#recordIdentifierFor`, deprecated: true },
      cacheFor: { kind: 'value', decl: `${CACHES}#cacheFor` },
      StoreOptions: { kind: 'type', decl: `${STORE}#StoreOptions` },
    });
    assert.deepEqual(surface.modules['fx-meta/-private'].exports, {
      Thing: { kind: 'value', decl: 'packages/store/src/-private/thing.js#Thing' },
    });
  });
});

describe('vite era: entryPoints and a package.json#exports pattern key', () => {
  const CT = 'packages/core-types/src';
  const ST = 'packages/store/src';

  test('module names come from the exports keys; `**` inside a segment stays within one directory', () => {
    const { surface, diagnostics } = fixture('vite');
    assert.deepEqual(surface.packages, {
      '@fx/core-types': {
        dir: 'packages/core-types',
        modules: [
          '@fx/core-types',
          '@fx/core-types/-private',
          '@fx/core-types/schema/fields',
          '@fx/core-types/schema/fields.type-test',
        ],
      },
      '@fx/store': { dir: 'packages/store', modules: ['@fx/store', '@fx/store/configure', '@fx/store/types'] },
    });
    assert.deepEqual(surface.modules['@fx/core-types/schema/fields.type-test'].exports, {});
    assert.deepEqual(diagnostics, [
      {
        code: 'declaration-entry',
        message:
          "packages/core-types/vite.config.mjs: './src/schema/**.ts' matches src/schema/shapes.d.ts; a .d.ts emits no module, skipped",
      },
    ]);
  });

  test('value and type exports, including the forms oxc-parser misreports', () => {
    const { surface } = fixture('vite');
    assert.deepEqual(surface.modules['@fx/store'], {
      package: '@fx/store',
      entry: `${ST}/index.ts`,
      forward: null,
      exports: {
        G: { kind: 'type', decl: `${ST}/g.ts#G` }, // import { G }; export type { G }
        D: { kind: 'value', decl: `${ST}/d.ts#default` }, // import D; export { D }
        macroCondition: { kind: 'value', decl: 'external:@embroider/macros#macroCondition' },
        field: { kind: 'value', decl: `${CT}/schema/fields.ts#field` },
        legacyField: { kind: 'value', decl: `${CT}/schema/fields.ts#legacyField`, deprecated: true },
        Thing: { kind: 'value', decl: `${ST}/thing.ts#default` }, // export default abstract class
        fromA: { kind: 'value', decl: `${ST}/star-a.ts#fromA` }, // export *, which never carries default
        FromB: { kind: 'type', decl: `${ST}/star-b.ts#FromB` }, // export type *
      },
    });
    assert.deepEqual(surface.modules['@fx/store/configure'].exports, {
      config: { kind: 'type', decl: `${ST}/configure.ts#config` }, // declare const + export { config }
      configure: { kind: 'type', decl: `${ST}/configure.ts#configure` }, // export declare function
    });
    assert.deepEqual(surface.modules['@fx/store/types'].exports, {
      Identifier: { kind: 'type', decl: `${CT}/identifier.ts#Identifier` },
      Field: { kind: 'type', decl: `${CT}/schema/fields.ts#Field` },
    });
  });

  test('namespace exports point at the module itself', () => {
    const { surface } = fixture('vite');
    assert.deepEqual(surface.modules['@fx/core-types/-private'].exports, {
      symbols: { kind: 'value', decl: `${CT}/symbols.ts#*ns` }, // export * as symbols
      Shapes: { kind: 'value', decl: `${CT}/shapes.ts#*ns` }, // import * as Shapes; export { Shapes }
    });
  });
});

describe('tsdown era: entryPoints, exports precedence, forward', () => {
  const CORE = 'warp-drive-packages/core/src';
  const SERVICE = `${CORE}/store/-private/store-service.ts`;
  const LEGACY = `${CORE}/store/-private/legacy-array.ts`;

  test('exact keys win over patterns, a pattern expansion keeps index, a longer pattern prefix wins', () => {
    const { surface, diagnostics } = fixture('tsdown');
    assert.deepEqual(surface.packages, {
      '@fx/core': {
        dir: 'warp-drive-packages/core',
        modules: [
          '@fx/core',
          '@fx/core/store',
          '@fx/core/store/-private',
          '@fx/core/types/index',
          '@fx/core/types/request',
        ],
      },
      '@fx/ember': {
        dir: 'warp-drive-packages/ember',
        modules: ['@fx/ember', '@fx/ember/-private/index', '@fx/ember/mock'],
      },
      '@fx/store': { dir: 'packages/store', modules: ['@fx/store', '@fx/store/-private', '@fx/store/mixed'] },
      'fx-bare': { dir: 'packages/bare', modules: [] },
      'fx-cli': { dir: 'packages/cli', modules: ['fx-cli/cli', 'fx-cli/commands'] },
      'fx-lint': { dir: 'packages/lint', modules: ['fx-lint', 'fx-lint/recommended'] },
      'fx-plugin': { dir: 'packages/plugin', modules: ['fx-plugin'] },
    });
    assert.deepEqual(diagnostics, [
      { code: 'target-not-found', message: 'fx-bare: main ./missing.js has no source in the tree' },
      // src/app/thing.ts builds to dist/app/thing.js, but `./app/*` (the longer prefix) maps
      // @fx/ember/app/thing to app/thing.js instead, so no key reaches that entry
      { code: 'entry-not-exported', message: '@fx/ember: no exports key reaches src/app/thing.ts' },
    ]);
  });

  test('a package without a build config is its exports targets, or without exports its main', () => {
    const { surface } = fixture('tsdown');
    assert.equal(surface.modules['fx-lint'].entry, 'packages/lint/src/index.js');
    assert.equal(surface.modules['fx-lint/recommended'].entry, 'packages/lint/src/recommended.js');
    assert.equal(surface.modules['fx-plugin'].entry, 'packages/plugin/lib/index.js');
    // a tsdown package without exports names its modules after the entries, index dropped
    assert.equal(surface.modules['fx-cli/commands'].entry, 'packages/cli/src/commands/index.ts');
    assert.deepEqual(surface.modules['fx-cli/cli'].exports, {
      pluginRules: { kind: 'value', decl: 'packages/plugin/lib/index.js#rules' },
      run: { kind: 'value', decl: 'packages/cli/src/cli.ts#run' },
    });
  });

  test('forward is set only when every statement is export * or export type * of one specifier', () => {
    const { surface } = fixture('tsdown');
    assert.equal(surface.modules['@fx/store/-private'].forward, '@fx/core/store/-private');
    assert.equal(surface.modules['@fx/store/mixed'].forward, null);
    assert.equal(surface.modules['@fx/core/store/-private'].forward, null);
    // export * and export type * of one module: a value stays a value
    assert.deepEqual(surface.modules['@fx/store/-private'].exports, surface.modules['@fx/core/store/-private'].exports);
  });

  test('@deprecated on an export specifier marks only that name', () => {
    const { surface } = fixture('tsdown');
    assert.deepEqual(surface.modules['@fx/core/store/-private'].exports, {
      Store: { kind: 'value', decl: `${SERVICE}#Store` },
      StoreOptions: { kind: 'type', decl: `${SERVICE}#StoreOptions` },
      LegacyArray: { kind: 'type', decl: `${LEGACY}#LegacyArray` },
      LiveArray: { kind: 'type', decl: `${LEGACY}#LegacyArray`, deprecated: true },
    });
  });

  test('a named class exported as default elsewhere keeps its own name', () => {
    const { surface } = fixture('tsdown');
    const store = { default: { kind: 'value', decl: `${SERVICE}#Store` } };
    assert.deepEqual(surface.modules['@fx/core/store'].exports, store); // export { Store as default } from
    assert.deepEqual(surface.modules['@fx/store'].exports, store); // import { Store }; export { Store as default }
  });

  test('.gts modules are read with their <template> blocks blanked', () => {
    const { surface } = fixture('tsdown');
    const dir = 'warp-drive-packages/ember/src/-private';
    assert.deepEqual(surface.modules['@fx/ember'].exports, {
      Request: { kind: 'value', decl: `${dir}/request.gts#Request` },
      RequestArgs: { kind: 'type', decl: `${dir}/request.gts#RequestArgs` },
      Hello: { kind: 'value', decl: `${dir}/hello.gts#default` }, // a template-only component
    });
  });
});

describe('resolver', () => {
  /**
   * A workspace with a decoy copy of @t/b in node_modules.
   */
  function workspace(t: TestContext) {
    const root = realpathSync(tempDir(t));
    writeTree(root, {
      'packages/a/package.json': {
        name: '@t/a',
        exports: { '.': { types: './declarations/index.d.ts', default: './dist/index.js' } },
      },
      'packages/a/vite.config.mjs': "export const entryPoints = ['./src/index.ts'];\n",
      'packages/a/src/index.ts': [
        "export { b } from '@t/b';",
        "export { deep } from '@t/b/-private/deep';",
        "export { mock } from '@t/c/mock';",
        "export { util } from '@t/c/util';",
        "export { fromOpaque } from './opaque';",
        "export { chunk } from 'lodash-es';",
        '',
      ].join('\n'),
      'packages/a/src/opaque.ts': "export * from 'lodash-es';\n",
      'packages/b/package.json': { name: '@t/b', exports: { '.': './dist/index.js' } },
      'packages/b/src/index.ts': 'export const b = 1;\n',
      'packages/b/src/-private/deep.ts': 'export const deep = 2;\n',
      // `./*` alone would send @t/c/mock to src/mock.ts; node picks the exact key whatever the order
      'packages/c/package.json': {
        name: '@t/c',
        exports: { './*': './dist/*.js', './mock': './dist/testing/mock.js' },
      },
      'packages/c/src/mock.ts': "export const mock = 'shadowed';\n",
      'packages/c/src/testing/mock.ts': "export const mock = 'exported';\n",
      'packages/c/src/util.ts': 'export const util = 1;\n',
      'node_modules/@t/b/package.json': { name: '@t/b', main: 'index.js' },
      'node_modules/@t/b/index.js': "export const b = 'decoy';\n",
      'node_modules/lodash-es/package.json': { name: 'lodash-es', main: 'lodash.js' },
      'node_modules/lodash-es/lodash.js': 'export const chunk = 1;\n',
    });
    return root;
  }

  test('workspace specifiers resolve to source through exports, never through node_modules', (t) => {
    const root = workspace(t);
    const resolver = createResolver(
      root,
      discoverWorkspace(root, () => {})
    );
    const from = path.join(root, 'packages/a/src/index.ts');
    assert.deepEqual(resolver.resolve(from, '@t/b'), { path: path.join(root, 'packages/b/src/index.ts') });
    assert.deepEqual(resolver.resolve(from, '@t/b/-private/deep'), {
      path: path.join(root, 'packages/b/src/-private/deep.ts'),
    });
    assert.deepEqual(resolver.resolve(from, '@t/c/util'), { path: path.join(root, 'packages/c/src/util.ts') });
    assert.deepEqual(resolver.resolve(from, 'lodash-es'), { external: 'lodash-es' });
    assert.deepEqual(resolver.resolve(from, './opaque.js'), { path: path.join(root, 'packages/a/src/opaque.ts') });
    assert.ok('error' in resolver.resolve(from, './missing'));
  });

  test('one alias per exports key, and an exact key beats a pattern on every instance', (t) => {
    const root = workspace(t);
    const packages = discoverWorkspace(root, () => {});
    const expected = { path: path.join(root, 'packages/c/src/testing/mock.ts') };
    for (let i = 0; i < 20; i++) {
      const resolver = createResolver(root, packages);
      assert.deepEqual(Object.keys(resolver.alias).sort(), ['@t/a$', '@t/b$', '@t/c/*', '@t/c/mock$']);
      assert.deepEqual(resolver.resolve(path.join(root, 'packages/a/src/index.ts'), '@t/c/mock'), expected);
    }
  });

  test('a chain that leaves the tree ends in an external: declaration', (t) => {
    const root = workspace(t);
    const diagnostics: { code: string; message: string }[] = [];
    const surface = surfaceOf(root, { version: 'head', tag: null, diagnostics });
    assert.deepEqual(surface.modules['@t/a'].exports, {
      b: { kind: 'value', decl: 'packages/b/src/index.ts#b' },
      deep: { kind: 'value', decl: 'packages/b/src/-private/deep.ts#deep' },
      mock: { kind: 'value', decl: 'packages/c/src/testing/mock.ts#mock' },
      util: { kind: 'value', decl: 'packages/c/src/util.ts#util' },
      fromOpaque: { kind: 'value', decl: 'external:lodash-es#fromOpaque' },
      chunk: { kind: 'value', decl: 'external:lodash-es#chunk' },
    });
    assert.deepEqual(diagnostics, [
      { code: 'resolver-conflict', message: '@t/c/mock: exports key ./mock and ./* resolve differently; ./mock wins' },
      // b and c have no build config, so their dist/ targets are mapped back to source
      {
        code: 'unbuilt-target',
        message: '@t/b: exports target ./dist/index.js is not an entry output; using src/index.ts',
      },
      {
        code: 'unbuilt-target',
        message: '@t/c/mock: exports target ./dist/testing/mock.js is not an entry output; using src/testing/mock.ts',
      },
    ]);
  });
  test('two packages with one name: the first one found wins and the clash is reported', (t) => {
    const root = realpathSync(tempDir(t));
    writeTree(root, {
      'packages/dup/package.json': { name: 'dup' },
      'packages/dup/addon/index.js': 'export const first = 1;\n',
      'warp-drive-packages/dup/package.json': { name: 'dup' },
      'warp-drive-packages/dup/addon/index.js': 'export const second = 2;\n',
    });
    const diagnostics: { code: string; message: string }[] = [];
    const surface = surfaceOf(root, { version: 'head', tag: null, diagnostics });
    assert.deepEqual(surface.packages, { dup: { dir: 'packages/dup', modules: ['dup'] } });
    assert.deepEqual(Object.keys(surface.modules.dup.exports), ['first']);
    assert.deepEqual(diagnostics, [
      {
        code: 'resolver-conflict',
        message: 'dup: declared by packages/dup and warp-drive-packages/dup; the first wins',
      },
    ]);
  });
});

describe('exports of one file', () => {
  const records = (file: string, source: string) => exportsOfSource(file, source).exports;

  test('the kind comes from the import side and from export type, not from oxc-parser alone', () => {
    const source = [
      "import { G } from './g';",
      "import type { T } from './t';",
      "import D from './d';",
      "import * as NS from './ns';",
      'declare const config: number;',
      'export type { G };',
      'export { T, D, NS, config };',
      'export default abstract class Thing {}',
      '',
    ].join('\n');
    assert.deepEqual(records('/x/index.ts', source), [
      { form: 'reexport', name: 'G', kind: 'type', from: './g', imported: 'G', deprecated: false },
      { form: 'reexport', name: 'T', kind: 'type', from: './t', imported: 'T', deprecated: false },
      { form: 'reexport', name: 'D', kind: 'value', from: './d', imported: 'default', deprecated: false },
      { form: 'namespace', name: 'NS', kind: 'value', from: './ns', deprecated: false },
      { form: 'local', name: 'config', kind: 'type', local: 'config', deprecated: false },
      { form: 'local', name: 'default', kind: 'value', local: 'default', deprecated: false },
    ]);
  });

  test('declaration files and declare forms are types; instantiated namespaces and enums are values', () => {
    assert.deepEqual(
      records('/x/a.d.ts', 'export declare const a: number;\nexport function f(): void;\nexport class K {}\n').map(
        (r) => r.kind
      ),
      ['type', 'type', 'type']
    );
    const source = [
      'export namespace N { export type X = 1; }',
      'export namespace V { export const x = 1; }',
      'export enum E { A }',
      'export declare enum DE { A }',
      'export interface I {}',
      'export type TA = 1;',
      '',
    ].join('\n');
    assert.deepEqual(
      (records('/x/f.ts', source) as Exclude<ExportRecord, { form: 'star' }>[]).map((r) => [r.name, r.kind]),
      [
        ['N', 'type'],
        ['V', 'value'],
        ['E', 'value'],
        ['DE', 'type'],
        ['I', 'type'],
        ['TA', 'type'],
      ]
    );
  });

  test('type modifiers on re-export specifiers and namespaces', () => {
    const source = [
      "export { type A, B } from './x';",
      "export * as ns from './y';",
      "export type * as tns from './y';",
      "export type * from './z';",
      '',
    ].join('\n');
    assert.deepEqual(records('/x/b.ts', source), [
      { form: 'reexport', name: 'A', kind: 'type', from: './x', imported: 'A', deprecated: false },
      { form: 'reexport', name: 'B', kind: 'value', from: './x', imported: 'B', deprecated: false },
      { form: 'namespace', name: 'ns', kind: 'value', from: './y', deprecated: false },
      { form: 'namespace', name: 'tns', kind: 'type', from: './y', deprecated: false },
      { form: 'star', kind: 'type', from: './z' },
    ]);
  });

  test('@deprecated comes from a JSDoc block on the declaration or on the export specifier', () => {
    const source = [
      '/** @deprecated use b */',
      'export const a = 1;',
      'export const b = 2;',
      '/* @deprecated is not JSDoc */',
      'export const c = 3;',
      '/** @deprecated */',
      'const d = 4;',
      'export { d, b as e, /** @deprecated an alias */ b as f };',
      '',
    ].join('\n');
    assert.deepEqual(
      (records('/x/e.ts', source) as Exclude<ExportRecord, { form: 'star' }>[]).map((r) => [r.name, r.deprecated]),
      [
        ['a', true],
        ['b', false],
        ['c', false],
        ['d', true],
        ['e', false],
        ['f', true],
      ]
    );
  });

  test('forward', () => {
    const forward = (source: string) => exportsOfSource('/x/m.ts', source).forward;
    assert.equal(forward("/** @module */\nexport * from './a';\nexport type * from './a';\n"), './a');
    assert.equal(forward("export * from './a';\n"), './a');
    assert.equal(forward("export * from './a';\nexport * from './b';\n"), null);
    assert.equal(forward("export * from './a';\nexport * as b from './a';\n"), null);
    assert.equal(forward("export * from './a';\nexport const b = 1;\n"), null);
    assert.equal(forward(''), null);
  });

  test('<template> blocks become same-length code; comments and strings are left alone', () => {
    const cases = [
      ['<template>\n  Hello\n</template>\n', 'export default 0; \n           \n'],
      [
        'export class A {\n  <template>{{this.x}}</template>\n}\n',
        'export class A {\n  0;                             \n}\n',
      ],
      ['export const B = <template>hi</template>;\n', 'export const B = 0                      ;\n'],
      ['// <template>a</template>\nconst s = "<template>";\n', '// <template>a</template>\nconst s = "<template>";\n'],
    ];
    for (const [source, expected] of cases) {
      assert.equal(blankTemplateTags(source), expected);
      assert.equal(blankTemplateTags(source).length, source.length);
    }
  });
});

describe('entry globs and exports keys', () => {
  test('globToRegExp follows node-glob', () => {
    assert.ok(globToRegExp('src/**/*.ts').test('src/a.ts'));
    assert.ok(globToRegExp('src/**/*.ts').test('src/x/y/a.ts'));
    assert.ok(globToRegExp('src/schema/**.ts').test('src/schema/a.ts'));
    assert.ok(!globToRegExp('src/schema/**.ts').test('src/schema/x/a.ts'));
    assert.ok(!globToRegExp('src/*.ts').test('src/.hidden.ts'));
    assert.ok(globToRegExp('src/{a,b}.ts').test('src/b.ts'));
  });

  test('bestExportsKey picks the key node would', () => {
    const keys = ['.', './mock', './app/*', './*.cjs', './*'];
    assert.equal(bestExportsKey(keys, 'mock'), './mock');
    assert.equal(bestExportsKey(keys, 'app/thing'), './app/*');
    assert.equal(bestExportsKey(keys, 'x/y'), './*');
    assert.equal(bestExportsKey(keys, 'x.cjs'), './*.cjs');
    assert.equal(bestExportsKey(['./mock'], 'other'), null);
  });
});

describe('canonical output', () => {
  test('is byte-identical on every run and wherever the tree is reached from', (t) => {
    const link = path.join(tempDir(t), 'tree');
    symlinkSync(path.join(FIXTURES, 'tsdown'), link);
    for (const era of ['rollup', 'vite', 'tsdown'] as const) {
      const first = canonical(surfaceOf(path.join(FIXTURES, era), { version: '0.0.0', tag: 'v0.0.0' }));
      assert.equal(canonical(surfaceOf(path.join(FIXTURES, era), { version: '0.0.0', tag: 'v0.0.0' })), first);
      assert.equal(first, canonical(fixture(era).surface));
    }
    assert.equal(canonical(surfaceOf(link, { version: '0.0.0', tag: 'v0.0.0' })), canonical(fixture('tsdown').surface));
  });

  test('has sorted keys, sorted module lists and only the fields the contract names', (t) => {
    const root = tempDir(t);
    writeTree(root, {
      'packages/one/package.json': { name: 'one', exports: { '.': './dist/index.js' } },
      'packages/one/vite.config.mjs': "export const entryPoints = ['./src/index.ts'];\n",
      'packages/one/src/index.ts': "export { a } from './a';\nexport type { B } from './b';\n",
      'packages/one/src/a.ts': '/** @deprecated */\nexport const a = 1;\n',
      'packages/one/src/b.ts': 'export interface B {}\n',
    });
    const surface = surfaceOf(root, { version: '1.0.0', tag: 'v1.0.0' });
    const expected = `{
  "kind": "surface",
  "modules": {
    "one": {
      "entry": "packages/one/src/index.ts",
      "exports": {
        "B": {
          "decl": "packages/one/src/b.ts#B",
          "kind": "type"
        },
        "a": {
          "decl": "packages/one/src/a.ts#a",
          "deprecated": true,
          "kind": "value"
        }
      },
      "forward": null,
      "package": "one"
    }
  },
  "packages": {
    "one": {
      "dir": "packages/one",
      "modules": [
        "one"
      ]
    }
  },
  "schema": 1,
  "tag": "v1.0.0",
  "version": "1.0.0"
}
`;
    assert.equal(canonical(surface), expected);
    const file = path.join(root, 'surfaces', '1.0.0.json');
    assert.equal(writeArtifact(file, surface).written, true);
    assert.equal(
      writeArtifact(file, surfaceOf(root, { version: '1.0.0', tag: 'v1.0.0' }), { check: true }).changed,
      false
    );
  });
});

describe('cli', () => {
  test('lists every contract command, implemented or not', async (t) => {
    const out = captureConsole(t);
    assert.equal(await main([], { dir: FIXTURE_COMMANDS }), 1);
    assert.equal(await main(['help'], { dir: FIXTURE_COMMANDS }), 0);
    for (const name of CONTRACT_COMMANDS) assert.match(out.log[0], new RegExp(`\\n  ${name} +not implemented yet`));
    assert.match(out.log[0], /\n {2}echo +records its arguments/);
    assert.match(out.log[0], /\n {2}broken +failed to load: commands\/broken\.mts exports name 'not-broken'/);

    const real = await listCommands();
    assert.deepEqual(
      real.slice(0, CONTRACT_COMMANDS.length).map((c) => c.name),
      CONTRACT_COMMANDS
    );
    for (const name of ['surface', 'update', 'release']) {
      assert.equal(real.find((c) => c.name === name)?.implemented, true, name);
    }
  });

  test('passes the arguments and the context to the command and returns its exit code', async (t) => {
    const { calls } = await import(path.join(FIXTURE_COMMANDS, 'echo.mts'));
    calls.length = 0;
    captureConsole(t);
    const context = { dataRoot: '/data', cwd: '/cwd' } as Context;
    assert.equal(await main(['echo', 'a', '--x'], { dir: FIXTURE_COMMANDS, context }), 0);
    assert.equal(await main(['echo', '--fail'], { dir: FIXTURE_COMMANDS, context }), 3);
    assert.deepEqual(calls, [
      { argv: ['a', '--x'], context },
      { argv: ['--fail'], context },
    ]);
  });

  test('a missing command is not implemented yet (2); a usage error or a bad module prints and exits 1', async (t) => {
    const out = captureConsole(t);
    assert.equal(await main(['history', '5.0.1', '5.4.1'], { dir: FIXTURE_COMMANDS }), NOT_IMPLEMENTED);
    assert.equal(await main(['echo', '--usage'], { dir: FIXTURE_COMMANDS }), 1);
    assert.equal(await main(['broken'], { dir: FIXTURE_COMMANDS }), 1);
    assert.equal(await main(['nope'], { dir: FIXTURE_COMMANDS }), 1);
    assert.deepEqual(out.error.slice(0, 4), [
      'history: not implemented yet',
      'usage: echo [--fail] [--usage]',
      "commands/broken.mts exports name 'not-broken'",
      "unknown command 'nope'\n",
    ]);
  });

  test('runSteps skips missing commands, stops at a failure, and in check mode runs every step', async (t) => {
    const { calls } = await import(path.join(FIXTURE_COMMANDS, 'echo.mts'));
    const out = captureConsole(t);
    const steps: [string, string[]][] = [
      ['echo', ['a']],
      ['history', ['b']],
      ['echo', ['--fail']],
      ['echo', ['c']],
    ];

    calls.length = 0;
    assert.equal(await runSteps('release', steps, { dir: FIXTURE_COMMANDS }), 3);
    assert.deepEqual(
      calls.map((c: { argv: string[] }) => c.argv),
      [['a'], ['--fail']]
    );
    assert.ok(out.log.includes('release: skipping history b (not implemented yet)'));
    assert.ok(out.error.includes('release: echo exited 3; stopping'));

    calls.length = 0;
    assert.equal(await runSteps('release', steps, { dir: FIXTURE_COMMANDS, check: true }), 3);
    assert.deepEqual(
      calls.map((c: { argv: string[] }) => c.argv),
      [
        ['a', '--check'],
        ['--fail', '--check'],
        ['c', '--check'],
      ]
    );
  });
});

describe('commands', () => {
  test('surface and release reject bad arguments before touching any tree', async (t) => {
    const dataRoot = tempDir(t);
    writeTree(dataRoot, { 'releases.json': { schema: 1, baseline: '1.0.0', releases: ['1.0.0', '1.1.0'] } });
    await assert.rejects(surfaceCommand([], { dataRoot }), /^Error: usage: surface/);
    await assert.rejects(surfaceCommand(['1.2'], { dataRoot }), /'1\.2' is neither a version nor head/);
    await assert.rejects(surfaceCommand(['--all', 'head'], { dataRoot }), /^Error: usage: surface/);
    await assert.rejects(release(['1.2.0'], { dataRoot }), /1\.2\.0 is not in releases\.json \(1\.0\.0, 1\.1\.0\)/);
    await assert.rejects(release([], { dataRoot }), /^Error: usage: release/);
  });

  test('surface head writes into scratch, in check mode too, since nothing tracks that file', async (t) => {
    const dataRoot = tempDir(t);
    const scratchRoot = tempDir(t);
    const out = captureConsole(t);
    assert.equal(await surfaceCommand(['head'], { dataRoot, scratchRoot }), 0);
    const file = path.join(scratchRoot, 'surfaces', 'head.json');
    const written = JSON.parse(readFileSync(file, 'utf8'));
    assert.equal(written.version, 'head');
    assert.equal(written.tag, null);
    assert.deepEqual(readdirSync(dataRoot), [], 'the data root gets nothing');
    assert.equal(await surfaceCommand(['head', '--check'], { dataRoot, scratchRoot }), 0);
    writeFileSync(file, '{}\n');
    assert.equal(await surfaceCommand(['head', '--check'], { dataRoot, scratchRoot }), 0);
    assert.equal(JSON.parse(readFileSync(file, 'utf8')).version, 'head', 'rewritten');
    assert.ok(out.log.some((line) => /^surface: wrote .*surfaces\/head\.json/.test(line)));
    assert.ok(out.log.includes('surface: 1 artifacts, 0 drifted'));
  });

  test('release trees live next to the main checkout, never inside it', () => {
    assert.equal(tagOf('5.9.1'), 'v5.9.1');
    assert.equal(tagOf('head'), null);
    const dir = releaseTreeDir('5.9.1');
    assert.ok(dir.endsWith(path.join('warp-drive-worktrees', 'releases', '5.9.1')), dir);
    assert.ok(path.relative(REPO_ROOT, dir).startsWith('..'), dir);
  });
});
