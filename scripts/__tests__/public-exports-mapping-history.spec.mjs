import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';

import { canonical } from '../public-exports-mapping/artifacts.mjs';
import * as diffCommand from '../public-exports-mapping/commands/diff.mjs';
import * as historyCommand from '../public-exports-mapping/commands/history.mjs';
import { applyDiff, declarationIds, diffSurfaces } from '../public-exports-mapping/diff.mjs';
import {
  declaredExports,
  fileMoves,
  historyOf,
  mapForward,
  parseNameStatus,
  twinsOf,
  withoutTemplateTags,
} from '../public-exports-mapping/history.mjs';
import { tempDir } from './-run-script.mjs';
import { tree as FIXTURES } from './fixtures/public-exports-mapping/history.mjs';

/** The text of a fixture file. @param {string} name */
function fixture(name) {
  const value = FIXTURES[name];
  return typeof value === 'string' ? value : JSON.stringify(value);
}

/** A fresh copy of a JSON fixture. @param {string} name */
function fixtureJson(name) {
  return structuredClone(FIXTURES[name]);
}

/** The hand-written pair 1.0.0 -> 1.1.0: two surfaces and their history. */
function handWrittenPair() {
  return {
    surfaceA: fixtureJson('surface-1.0.0.json'),
    surfaceB: fixtureJson('surface-1.1.0.json'),
    history: fixtureJson('history-1.0.0-1.1.0.json'),
  };
}

/**
 * A deep copy of `value` whose objects list their keys in reverse order; arrays keep theirs.
 * @param {any} value
 * @returns {any}
 */
function reverseKeys(value) {
  if (Array.isArray(value)) return value.map(reverseKeys);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value)
        .reverse()
        .map((key) => [key, reverseKeys(value[key])])
    );
  }
  return value;
}

/** Git for fixture repositories, isolated from the user's configuration. */
const GIT_ENV = (() => {
  const env = { ...process.env, GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_NOSYSTEM: '1' };
  for (const key of ['GIT_DIR', 'GIT_WORK_TREE', 'GIT_INDEX_FILE', 'GIT_COMMON_DIR', 'GIT_OBJECT_DIRECTORY']) {
    delete env[key];
  }
  return env;
})();

/**
 * @param {string} cwd
 * @param {string[]} args
 * @param {Record<string, string>} [env]
 */
function git(cwd, args, env = {}) {
  return execFileSync('git', ['-c', 'commit.gpgsign=false', '-c', 'tag.gpgsign=false', ...args], {
    cwd,
    encoding: 'utf8',
    env: { ...GIT_ENV, ...env },
  }).trim();
}

/** b.ts as moving foo out of a.ts left it. */
const B_TS = [
  '/**',
  ' * Helpers that used to live in a.ts, rewritten while moving them.',
  ' */',
  "export const helper = 'helper';",
  '',
  'export function foo(): number {',
  '  const doubled = helper.length * 2;',
  '  return doubled + 30;',
  '}',
  '',
].join('\n');

/**
 * The commits of the fixture repository, oldest first. `files` maps a path to its new
 * contents, or to `null` to delete it.
 * @type {{ subject: string, tag?: string, files: Record<string, string | null> }[]}
 */
const COMMITS = [
  {
    subject: 'feat: first release',
    tag: 'v1.0.0',
    files: {
      'packages/lib/package.json': '{ "name": "@acme/lib" }\n',
      'packages/lib/src/index.ts': [
        "export { foo, type Bar } from './a';",
        "export { default } from './store';",
        "export { legacy } from './old';",
        "export { gone } from './gone';",
        '',
      ].join('\n'),
      'packages/lib/src/a.ts':
        '/** Returns the answer. */\nexport function foo(): number {\n  return 42;\n}\n\nexport type Bar = { id: string };\n',
      'packages/lib/src/store.ts': 'export default class Store {\n  records = new Map<string, unknown>();\n}\n',
      'packages/lib/src/old.js': "export function legacy() {\n  return 'legacy';\n}\n",
      'packages/lib/src/gone.ts': "export const gone = 'gone';\n",
    },
  },
  {
    subject: 'feat: move foo into b.ts',
    files: {
      'packages/lib/src/a.ts': 'export type Bar = { id: string };\n',
      'packages/lib/src/b.ts': B_TS,
    },
  },
  {
    subject: 'refactor: rename Bar to Baz',
    files: { 'packages/lib/src/a.ts': 'export type Baz = { id: string };\n' },
  },
  {
    subject: 'docs: note the old name of Baz',
    files: { 'packages/lib/src/a.ts': '// Baz was called Bar before 1.1.\nexport type Baz = { id: string };\n' },
  },
  {
    subject: 'refactor: export Store by name',
    files: { 'packages/lib/src/store.ts': 'export class Store {\n  records = new Map<string, unknown>();\n}\n' },
  },
  {
    subject: 'chore: convert old.js to TypeScript',
    files: {
      'packages/lib/src/old.js': null,
      'packages/lib/src/old.ts': [
        '/**',
        ' * The legacy entry point, now typed.',
        ' */',
        'export function legacy(): string {',
        "  const value: string = 'legacy';",
        '  return value;',
        '}',
        '',
      ].join('\n'),
    },
  },
  {
    subject: 'chore: drop gone',
    tag: 'v1.1.0',
    files: {
      'packages/lib/src/gone.ts': null,
      'packages/lib/src/index.ts': [
        "export { foo } from './b';",
        "export { type Baz } from './a';",
        "export { Store } from './store';",
        "export { legacy } from './old';",
        '',
      ].join('\n'),
    },
  },
];

/**
 * Another history, where the commit moving foo out of a.ts adds b.ts and scratch.ts, and
 * before the release b.ts moves under utils/ and scratch.ts is deleted.
 * @type {typeof COMMITS}
 */
const MOVED_TWICE = [
  {
    subject: 'feat: first release',
    tag: 'v1.0.0',
    files: {
      'packages/lib/package.json': '{ "name": "@acme/lib" }\n',
      'packages/lib/src/index.ts': "export { foo } from './a';\n",
      'packages/lib/src/a.ts': 'export function foo(): number {\n  return 42;\n}\n',
    },
  },
  {
    subject: 'feat: move foo into b.ts',
    files: {
      'packages/lib/src/index.ts': "export { foo } from './b';\n",
      'packages/lib/src/a.ts': 'export {};\n',
      'packages/lib/src/b.ts': B_TS,
      'packages/lib/src/scratch.ts': "export const scratch = 'scratch';\n",
    },
  },
  {
    subject: 'refactor: move b.ts under utils/',
    files: {
      'packages/lib/src/index.ts': "export { foo } from './utils/b';\n",
      'packages/lib/src/b.ts': null,
      'packages/lib/src/utils/b.ts': B_TS,
    },
  },
  {
    subject: 'chore: drop scratch.ts',
    tag: 'v1.1.0',
    files: { 'packages/lib/src/scratch.ts': null },
  },
];

/**
 * A git repository with the commits of `log` (`COMMITS` unless told otherwise), tagged as
 * they say.
 * @param {import('node:test').TestContext} t
 * @param {typeof COMMITS} [log]
 * @returns {{ repo: string, commits: Record<string, string> }} the repository and the full
 *   hash of each commit by subject
 */
function fixtureRepo(t, log = COMMITS) {
  const repo = tempDir(t, 'public-exports-mapping-history-');
  git(repo, ['init', '--quiet', '--initial-branch=main']);
  /** @type {Record<string, string>} */
  const commits = {};
  log.forEach(({ subject, tag, files }, i) => {
    for (const [file, contents] of Object.entries(files)) {
      const absolute = path.join(repo, file);
      if (contents === null) {
        rmSync(absolute);
      } else {
        mkdirSync(path.dirname(absolute), { recursive: true });
        writeFileSync(absolute, contents);
      }
    }
    const date = `2024-01-${String(i + 1).padStart(2, '0')}T00:00:00Z`;
    const identity = {
      GIT_AUTHOR_NAME: 'Fixture',
      GIT_AUTHOR_EMAIL: 'fixture@example.com',
      GIT_AUTHOR_DATE: date,
      GIT_COMMITTER_NAME: 'Fixture',
      GIT_COMMITTER_EMAIL: 'fixture@example.com',
      GIT_COMMITTER_DATE: date,
    };
    git(repo, ['add', '--all']);
    git(repo, ['commit', '--quiet', '-m', subject], identity);
    commits[subject] = git(repo, ['rev-parse', 'HEAD']);
    if (tag) git(repo, ['tag', tag]);
  });
  return { repo, commits };
}

/**
 * Surfaces of the fixture repository's two releases, one module each.
 * @param {string} version
 * @param {Record<string, { kind: 'value' | 'type', decl: string }>} exports
 */
function libSurface(version, exports) {
  return {
    schema: 1,
    kind: 'surface',
    version,
    tag: `v${version}`,
    packages: { '@acme/lib': { dir: 'packages/lib', modules: ['@acme/lib'] } },
    modules: {
      '@acme/lib': { package: '@acme/lib', entry: 'packages/lib/src/index.ts', forward: null, exports },
    },
  };
}

function libSurfaces() {
  return {
    surfaceA: libSurface('1.0.0', {
      Bar: { kind: 'type', decl: 'packages/lib/src/a.ts#Bar' },
      default: { kind: 'value', decl: 'packages/lib/src/store.ts#default' },
      foo: { kind: 'value', decl: 'packages/lib/src/a.ts#foo' },
      gone: { kind: 'value', decl: 'packages/lib/src/gone.ts#gone' },
      legacy: { kind: 'value', decl: 'packages/lib/src/old.js#legacy' },
    }),
    surfaceB: libSurface('1.1.0', {
      Baz: { kind: 'type', decl: 'packages/lib/src/a.ts#Baz' },
      Store: { kind: 'value', decl: 'packages/lib/src/store.ts#Store' },
      foo: { kind: 'value', decl: 'packages/lib/src/b.ts#foo' },
      legacy: { kind: 'value', decl: 'packages/lib/src/old.ts#legacy' },
    }),
  };
}

/**
 * A data root for the commands, with the given artifacts written canonically.
 * @param {import('node:test').TestContext} t
 * @param {Record<string, unknown>} artifacts  by path relative to the data root
 */
function dataRoot(t, artifacts = {}) {
  const root = tempDir(t, 'public-exports-mapping-data-');
  for (const [file, value] of Object.entries(artifacts)) {
    mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    writeFileSync(path.join(root, file), canonical(value));
  }
  return root;
}

/**
 * Silences `console.log` for the rest of the test and returns what it printed.
 * @param {import('node:test').TestContext} t
 */
function captureLog(t) {
  const log = t.mock.method(console, 'log', () => {});
  return () => log.mock.calls.map((call) => call.arguments.join(' ')).join('\n');
}

test('parseNameStatus reads statuses, scores and paths of git diff --name-status', () => {
  const records = parseNameStatus(fixture('name-status-5.5.0-5.6.0.txt'));

  assert.equal(records.length, 14);
  assert.deepEqual(records[0], { status: 'D', score: null, paths: ['packages/build-config/src/env.ts'] });
  assert.deepEqual(
    records.find((record) => record.status === 'R'),
    {
      status: 'R',
      score: 92,
      paths: [
        'packages/store/src/-private/store-service.ts',
        'warp-drive-packages/core/src/store/-private/store-service.ts',
      ],
    }
  );
  assert.deepEqual(parseNameStatus('\n'), []);
});

test('parseNameStatus refuses a line it cannot read', () => {
  for (const line of [
    'R100\tonly/one/path.ts',
    'M\t"quoted\\tpath.ts"',
    'Q\tpackages/x/src/a.ts',
    'D\tpackages/x/src/a.ts\tpackages/x/src/b.ts',
  ]) {
    assert.throws(() => parseNameStatus(line), /cannot read this line/, line);
  }
});

test('fileMoves maps renames, copies and deletions under src/ and addon/, and keeps a copied file that survives', () => {
  const { files, counts } = fileMoves(parseNameStatus(fixture('name-status-5.5.0-5.6.0.txt')));

  assert.deepEqual(files, {
    'packages/build-config/src/env.ts': [],
    'packages/ember/src/.gitkeep': [
      'warp-drive-packages/core/src/index.md',
      'warp-drive-packages/ember/src/.gitkeep',
      'warp-drive-packages/experiments/src/.gitkeep',
      'warp-drive-packages/legacy/src/compat/.gitkeep',
      'warp-drive-packages/legacy/src/serializer/.gitkeep',
    ],
    'packages/graph/src/-private.ts': [
      'packages/graph/src/-private.ts',
      'warp-drive-packages/core/src/graph/-private.ts',
    ],
    'packages/model/src/-private/attr.ts': ['warp-drive-packages/legacy/src/model/-private/attr.ts'],
    'packages/request/src/-private/manager.ts': [],
    'packages/store/src/-private/store-service.ts': ['warp-drive-packages/core/src/store/-private/store-service.ts'],
    'packages/store/src/-private/store-service.type-test.ts': [
      'warp-drive-packages/core/src/store/-private/store-service.type-test.ts',
    ],
  });
  assert.deepEqual(counts, { renamed: 4, copied: 5, deleted: 2, twins: 0 });
});

test('fileMoves turns a deletion into a rename when its .ts or src/ twin was added in the same pair', () => {
  const { files, counts } = fileMoves(parseNameStatus(fixture('name-status-5.0.1-5.4.1.txt')));

  assert.deepEqual(files, {
    'packages/-ember-data/addon/adapter.ts': ['packages/-ember-data/src/adapter.ts'],
    'packages/-ember-data/addon/index.js': ['packages/-ember-data/src/index.ts'],
    'packages/graph/src/-private/graph/-state.ts': ['packages/graph/src/-private/-state.ts'],
    'packages/graph/src/-private/graph/index.ts': [],
    'packages/model/src/-private/attr.js': ['packages/model/src/-private/attr.ts'],
    'packages/private-build-infra/src/transforms/babel-plugin-transform-deprecations/index.js': [
      'packages/build-config/cjs-src/transforms/babel-plugin-transform-deprecations.js',
    ],
    'packages/store/src/-private/managers/cache-manager.ts': [
      'packages/core-types/src/cache.ts',
      'packages/experiments/src/persisted-cache/cache.ts',
      'packages/store/src/-private/managers/cache-manager.ts',
    ],
  });
  assert.deepEqual(counts, { renamed: 2, copied: 2, deleted: 1, twins: 3 });
  // a path outside src/ and addon/ (addon-test-support/) has no entry, even when it moved into src/
  assert.equal(files['packages/-ember-data/addon-test-support/index.js'], undefined);
});

test('twinsOf lists the .ts twin, the src/ twin of an addon/ file, and both', () => {
  assert.deepEqual(twinsOf('packages/model/src/-private/attr.js'), ['packages/model/src/-private/attr.ts']);
  assert.deepEqual(twinsOf('packages/ember/src/-private/request.gjs'), ['packages/ember/src/-private/request.gts']);
  assert.deepEqual(twinsOf('packages/-ember-data/addon/index.js'), [
    'packages/-ember-data/addon/index.ts',
    'packages/-ember-data/src/index.js',
    'packages/-ember-data/src/index.ts',
  ]);
  assert.deepEqual(twinsOf('packages/-ember-data/addon/store.ts'), ['packages/-ember-data/src/store.ts']);
  assert.deepEqual(twinsOf('packages/store/src/index.ts'), []);
});

test('fileMoves does not depend on the order of the lines', () => {
  for (const name of ['name-status-5.0.1-5.4.1.txt', 'name-status-5.5.0-5.6.0.txt']) {
    const lines = fixture(name).split('\n');
    const reversed = [...lines].reverse().join('\n');
    assert.equal(canonical(fileMoves(parseNameStatus(reversed))), canonical(fileMoves(parseNameStatus(fixture(name)))));
  }
});

test('mapForward renames declaration ids through files, and keeps one whose file was deleted', () => {
  const files = {
    'packages/lib/src/b.ts': ['packages/lib/src/utils/b.ts'],
    'packages/lib/src/cache.ts': ['packages/lib/src/cache.ts', 'packages/other/src/cache.ts'],
    'packages/lib/src/old.js': ['packages/lib/src/old.ts'],
    'packages/lib/src/scratch.ts': [],
  };

  assert.deepEqual(
    mapForward(
      [
        'packages/lib/src/b.ts#foo', // renamed
        'packages/lib/src/cache.ts#Cache', // copied, and the source survives
        'packages/lib/src/old.js#legacy', // replaced by its .ts twin
        'packages/lib/src/scratch.ts#scratch', // deleted with nothing continuing it: kept
        'packages/lib/src/store.ts#Store', // untouched
      ],
      files
    ),
    [
      'packages/lib/src/cache.ts#Cache',
      'packages/lib/src/old.ts#legacy',
      'packages/lib/src/scratch.ts#scratch',
      'packages/lib/src/store.ts#Store',
      'packages/lib/src/utils/b.ts#foo',
      'packages/other/src/cache.ts#Cache',
    ]
  );
  assert.deepEqual(mapForward([], files), []);
});

test('declaredExports lists the bindings a file declares and exports, not the ones it re-exports', () => {
  const source = [
    "import { imported } from './x';",
    "import * as ns from './ns';",
    "import type { Shape } from './shape';",
    'export { imported, ns };',
    'export type { Shape };',
    "export { renamed as alias } from './y';",
    "export * from './z';",
    "export * as everything from './w';",
    'export const a = 1, b = 2;',
    'export function f() {}',
    'export class C {}',
    'export interface I {}',
    'export type T = string;',
    'export enum E { A }',
    'export declare const declared: string;',
    'const local = 1;',
    'export { local as exportedLocal };',
    'export default class Store {}',
  ].join('\n');

  assert.deepEqual(declaredExports('x.ts', source), [
    'C',
    'E',
    'I',
    'T',
    'a',
    'b',
    'declared',
    'default',
    'f',
    'local',
  ]);
  assert.deepEqual(declaredExports('y.js', 'function g() {}\nexport { g as default };\n'), ['default']);
});

test('declaredExports reads .gts files around their <template> tags', () => {
  const source = [
    "import Component from '@glimmer/component';",
    '',
    'export const helper = () => 1;',
    '',
    'export class Request extends Component {',
    '  get value() {',
    '    return { a: 1 };',
    '  }',
    '',
    '  <template>',
    '    <div>{{this.value.a}}</div>',
    '  </template>',
    '}',
    '',
    'export const Inline = <template>hi</template>;',
    '',
    '<template>',
    '  <Request />',
    '</template>',
    '',
  ].join('\n');

  const blanked = withoutTemplateTags('request.gts', source);
  assert.equal(blanked.split('\n').length, source.split('\n').length, 'line breaks are kept');
  assert.match(blanked, /static \{\}/);
  assert.match(blanked, /export const Inline = 0;/);
  assert.deepEqual(declaredExports('request.gts', source), ['Inline', 'Request', 'default', 'helper']);
  assert.equal(withoutTemplateTags('request.ts', source), source, 'other files are left alone');
});

test('historyOf finds the commit that removed each declaration and what it added', (t) => {
  const { repo, commits } = fixtureRepo(t);
  const { surfaceA, surfaceB } = libSurfaces();
  const short = (/** @type {string} */ subject) => commits[subject].slice(0, 10);

  const history = historyOf('1.0.0', '1.1.0', { surfaceA, surfaceB, cwd: repo });

  assert.deepEqual(history, {
    schema: 1,
    kind: 'history',
    from: '1.0.0',
    to: '1.1.0',
    files: {
      'packages/lib/src/gone.ts': [],
      'packages/lib/src/old.js': ['packages/lib/src/old.ts'],
    },
    symbols: {
      // the newest commit naming Bar only added a comment; the rename before it removed the type
      'packages/lib/src/a.ts#Bar': {
        commit: short('refactor: rename Bar to Baz'),
        subject: 'refactor: rename Bar to Baz',
        added: ['packages/lib/src/a.ts#Baz'],
      },
      'packages/lib/src/a.ts#foo': {
        commit: short('feat: move foo into b.ts'),
        subject: 'feat: move foo into b.ts',
        added: ['packages/lib/src/b.ts#foo', 'packages/lib/src/b.ts#helper'],
      },
      'packages/lib/src/gone.ts#gone': {
        commit: short('chore: drop gone'),
        subject: 'chore: drop gone',
        added: [],
      },
      // a default export is searched by `export default`, which the conversion removed
      'packages/lib/src/store.ts#default': {
        commit: short('refactor: export Store by name'),
        subject: 'refactor: export Store by name',
        added: ['packages/lib/src/store.ts#Store'],
      },
    },
  });

  assert.deepEqual(diffSurfaces(surfaceA, surfaceB, history).declarations, {
    'packages/lib/src/a.ts#Bar': 'packages/lib/src/a.ts#Baz',
    'packages/lib/src/a.ts#foo': 'packages/lib/src/b.ts#foo',
    'packages/lib/src/gone.ts#gone': null,
    'packages/lib/src/old.js#legacy': 'packages/lib/src/old.ts#legacy',
    'packages/lib/src/store.ts#default': 'packages/lib/src/store.ts#Store',
  });
  assert.equal(
    canonical(historyOf('1.0.0', '1.1.0', { surfaceA, surfaceB, cwd: repo })),
    canonical(history),
    'a second run gives the same bytes'
  );
});

test('historyOf names what the removing commit added by the paths those files have at b', (t) => {
  const { repo, commits } = fixtureRepo(t, MOVED_TWICE);
  const surfaceA = libSurface('1.0.0', { foo: { kind: 'value', decl: 'packages/lib/src/a.ts#foo' } });
  const surfaceB = libSurface('1.1.0', { foo: { kind: 'value', decl: 'packages/lib/src/utils/b.ts#foo' } });
  const move = { commit: commits['feat: move foo into b.ts'].slice(0, 10), subject: 'feat: move foo into b.ts' };

  const history = historyOf('1.0.0', '1.1.0', { surfaceA, surfaceB, cwd: repo });

  assert.deepEqual(history, {
    schema: 1,
    kind: 'history',
    from: '1.0.0',
    to: '1.1.0',
    files: {},
    symbols: {
      // the commit added b.ts, which moved under utils/ later; scratch.ts, deleted, keeps its path
      'packages/lib/src/a.ts#foo': {
        ...move,
        added: [
          'packages/lib/src/scratch.ts#scratch',
          'packages/lib/src/utils/b.ts#foo',
          'packages/lib/src/utils/b.ts#helper',
        ],
      },
    },
  });
  assert.deepEqual(diffSurfaces(surfaceA, surfaceB, history).declarations, {
    'packages/lib/src/a.ts#foo': 'packages/lib/src/utils/b.ts#foo',
  });

  // for head, the paths are the working tree's
  mkdirSync(path.join(repo, 'packages/lib/src/core'));
  git(repo, ['mv', 'packages/lib/src/utils/b.ts', 'packages/lib/src/core/b.ts']);
  const head = {
    ...libSurface('head', { foo: { kind: 'value', decl: 'packages/lib/src/core/b.ts#foo' } }),
    tag: null,
  };
  assert.deepEqual(historyOf('1.0.0', 'head', { surfaceA, surfaceB: head, cwd: repo }).symbols, {
    'packages/lib/src/a.ts#foo': {
      ...move,
      added: [
        'packages/lib/src/core/b.ts#foo',
        'packages/lib/src/core/b.ts#helper',
        'packages/lib/src/scratch.ts#scratch',
      ],
    },
  });
});

test('historyOf without both surfaces computes files only', (t) => {
  const { repo } = fixtureRepo(t);
  const { surfaceA } = libSurfaces();

  for (const options of [{}, { surfaceA }]) {
    const history = historyOf('1.0.0', '1.1.0', { ...options, cwd: repo });
    assert.deepEqual(history.symbols, {});
    assert.deepEqual(history.files, {
      'packages/lib/src/gone.ts': [],
      'packages/lib/src/old.js': ['packages/lib/src/old.ts'],
    });
  }
  assert.throws(() => historyOf('1.0.0', '1.1.0', { surfaceA, surfaceB: surfaceA, cwd: repo }), /surface of 1\.0\.0/);
});

test('historyOf diffs the working tree for head', (t) => {
  const { repo } = fixtureRepo(t);
  writeFileSync(path.join(repo, 'packages/lib/src/a.ts'), 'export {};\n');
  rmSync(path.join(repo, 'packages/lib/src/b.ts'));

  assert.deepEqual(historyOf('1.1.0', 'head', { cwd: repo }).files, { 'packages/lib/src/b.ts': [] });
  assert.throws(() => historyOf('head', '1.1.0', { cwd: repo }), /head can only be the newer side/);
});

test('historyOf refuses to search symbols in a range a shallow clone cuts', (t) => {
  const { repo } = fixtureRepo(t);
  const clone = path.join(tempDir(t, 'public-exports-mapping-clone-'), 'clone');
  git(repo, ['clone', '--quiet', '--depth', '3', `file://${repo}`, clone]);
  git(clone, ['fetch', '--quiet', '--depth', '1', 'origin', 'refs/tags/v1.0.0:refs/tags/v1.0.0']);
  const { surfaceA, surfaceB } = libSurfaces();

  assert.throws(() => historyOf('1.0.0', '1.1.0', { surfaceA, surfaceB, cwd: clone }), /edge of this shallow clone/);
  assert.deepEqual(
    historyOf('1.0.0', '1.1.0', { cwd: clone }).files,
    { 'packages/lib/src/gone.ts': [], 'packages/lib/src/old.js': ['packages/lib/src/old.ts'] },
    'files only needs the two trees'
  );
});

test('diffSurfaces maps every declaration of a: through files, then the tokens that carried it, then the removing commit', () => {
  const { surfaceA, surfaceB, history } = handWrittenPair();

  const { declarations } = diffSurfaces(surfaceA, surfaceB, history);

  assert.deepEqual(Object.keys(declarations), declarationIds(surfaceA), 'every declaration of a, sorted');
  assert.deepEqual(declarations, {
    // files: unchanged, renamed, a .ts twin, a namespace, external ids
    'packages/store/src/cache.ts#Cache': 'packages/store/src/cache.ts#Cache',
    'packages/store/src/request.js#request': 'packages/store/src/request.ts#request',
    'packages/store/src/types.ts#*ns': 'warp-drive-packages/core/src/types.ts#*ns',
    'external:@ember/object#default': 'external:@ember/object#default',
    'external:rsvp#Promise': null,
    // files: a copied file that survives as a shim (only the copy declares it now) ...
    'packages/store/src/schema.ts#Schema': 'warp-drive-packages/core/src/schema.ts#Schema',
    // ... or still declares it next to the copy, which keeps the id
    'packages/store/src/utils.ts#assert': 'packages/store/src/utils.ts#assert',
    // files: several continuations declare it, the first path wins
    'packages/store/src/graph.ts#Graph': 'warp-drive-packages/core/src/graph.ts#Graph',
    // files: deleted, or still there but no longer in surface b, and no commit removed it; a
    // token still in b does not count when it names a declaration in a file that does not continue it
    'packages/store/src/gone.ts#gone': null,
    'packages/store/src/cache.ts#peekCache': null,
    'packages/store/src/normalize.ts#normalizeModelName': null,
    // tokens: one that carried it is still in b, on a declaration in the same file (a default
    // export that became a named one, which no commit was found for) or in a file continuing it ...
    'packages/store/src/coerce-id.ts#default': 'packages/store/src/coerce-id.ts#coerceId',
    'packages/store/src/store.ts#default': 'warp-drive-packages/core/src/store.ts#Store',
    // ... and when such tokens disagree, the first module's wins, ahead of symbols (LegacySnapshot)
    'packages/store/src/snapshot.ts#default': 'warp-drive-packages/legacy/src/snapshot.ts#Snapshot',
    // symbols: moved under the same name (its token stays, in a file that does not continue
    // record.ts), or a default export that became a named one and lost its token
    'packages/store/src/record.ts#Record': 'warp-drive-packages/core/src/record.ts#Record',
    'packages/store/src/record-array.ts#default': 'packages/store/src/record-array.ts#LiveArray',
    // symbols: the only added declaration of the same kind
    'packages/store/src/identifier.ts#isStableIdentifier': 'packages/store/src/identifier.ts#isResourceKey',
    'packages/store/src/identifier.ts#Identifier': 'packages/store/src/identifier.ts#ResourceKey',
    // symbols: nothing added, nothing of the same kind, something added outside surface b,
    // two candidates, or two declarations removed for one candidate
    'packages/old/src/index.ts#oldThing': null,
    'packages/store/src/flags.ts#FLAG': null,
    'packages/store/src/legacy.ts#legacyHelper': null,
    'packages/store/src/manager.ts#Manager': null,
    'packages/store/src/ids.ts#OldA': null,
    'packages/store/src/ids.ts#OldB': null,
  });
});

test('diffSurfaces writes the expected diff, and applyDiff rebuilds surface b from it byte for byte', () => {
  const { surfaceA, surfaceB, history } = handWrittenPair();

  const diff = diffSurfaces(surfaceA, surfaceB, history);

  assert.deepEqual(diff, fixtureJson('diff-1.0.0-1.1.0.json'));
  assert.equal(canonical(applyDiff(surfaceA, diff)), canonical(surfaceB));
  assert.equal(canonical(surfaceA), canonical(handWrittenPair().surfaceA), 'surface a is left untouched');
});

test('applyDiff rebuilds surface b for the reverse pair and for a pair without changes', () => {
  const { surfaceA, surfaceB } = handWrittenPair();
  const noMoves = (/** @type {string} */ from, /** @type {string} */ to) => ({
    schema: 1,
    kind: 'history',
    from,
    to,
    files: {},
    symbols: {},
  });

  const back = diffSurfaces(surfaceB, surfaceA, noMoves('1.1.0', '1.0.0'));
  assert.equal(canonical(applyDiff(surfaceB, back)), canonical(surfaceA));

  const head = { ...structuredClone(surfaceB), version: 'head', tag: null };
  const same = diffSurfaces(surfaceB, head, noMoves('1.1.0', 'head'));
  assert.deepEqual(same.modules, { added: {}, removed: [], changed: {} });
  assert.deepEqual(same.packages, { added: {}, removed: [], changed: {} });
  assert.deepEqual(same.exports, {});
  assert.equal(canonical(applyDiff(surfaceB, same)), canonical(head));
});

test('diffs are canonical: the key order of the inputs does not change their bytes', () => {
  const { surfaceA, surfaceB, history } = handWrittenPair();

  const bytes = canonical(diffSurfaces(surfaceA, surfaceB, history));

  assert.equal(canonical(diffSurfaces(reverseKeys(surfaceA), reverseKeys(surfaceB), reverseKeys(history))), bytes);
  assert.equal(canonical(diffSurfaces(surfaceA, surfaceB, history)), bytes);
});

test('applyDiff refuses a diff that does not fit the surface', () => {
  const { surfaceA, surfaceB, history } = handWrittenPair();
  const diff = diffSurfaces(surfaceA, surfaceB, history);

  assert.throws(() => applyDiff(surfaceB, diff), /does not apply to surface 1\.1\.0/);
  const stale = structuredClone(diff);
  stale.modules.removed.push('@acme/missing');
  assert.throws(() => applyDiff(surfaceA, stale), /cannot remove module @acme\/missing/);
  const doubled = structuredClone(diff);
  doubled.exports['@acme/store'].added.Cache = { kind: 'type', decl: 'packages/store/src/cache.ts#Cache' };
  assert.throws(() => applyDiff(surfaceA, doubled), /cannot add export Cache/);
});

test('diffSurfaces refuses inputs it cannot diff completely', () => {
  const { surfaceA, surfaceB, history } = handWrittenPair();

  assert.throws(() => diffSurfaces(surfaceA, { ...surfaceB, extra: 1 }, history), /differ in "extra"/);
  assert.throws(
    () => diffSurfaces(surfaceA, surfaceB, { ...history, to: '1.2.0' }),
    /not history\/1\.0\.0-1\.1\.0\.json/
  );
  assert.throws(() => diffSurfaces({ ...surfaceA, schema: 2 }, surfaceB, history), /not a schema 1 surface/);
  assert.throws(
    () => diffSurfaces(surfaceA, { ...surfaceB, tag: 'v1.1.0-beta.1' }, history),
    /has the tag v1\.1\.0-beta\.1, not v1\.1\.0/
  );
  // `changed` writes an attribute missing from b as null, so b cannot hold a null of its own
  const nulled = structuredClone(surfaceB);
  nulled.modules['@acme/store'].exports.Cache.note = null;
  assert.throws(() => diffSurfaces(surfaceA, nulled, history), /holds a value no section of a diff can carry/);
});

test('the history command writes files only until both surfaces exist, then fills symbols in', async (t) => {
  const { repo } = fixtureRepo(t);
  const { surfaceA, surfaceB } = libSurfaces();
  const root = dataRoot(t);
  const output = captureLog(t);
  const file = path.join(root, 'history', '1.0.0-1.1.0.json');

  assert.equal(await historyCommand.run(['1.0.0', '1.1.0'], { dataRoot: root, scratchRoot: root, cwd: repo }), 0);
  assert.deepEqual(JSON.parse(readFileSync(file, 'utf8')).symbols, {});
  assert.match(output(), /symbols stays empty until both surfaces exist/);
  assert.equal(
    await historyCommand.run(['1.0.0', '1.1.0', '--check'], { dataRoot: root, scratchRoot: root, cwd: repo }),
    0
  );

  for (const surface of [surfaceA, surfaceB]) {
    mkdirSync(path.join(root, 'surfaces'), { recursive: true });
    writeFileSync(path.join(root, 'surfaces', `${surface.version}.json`), canonical(surface));
  }
  const before = readFileSync(file, 'utf8');
  assert.equal(
    await historyCommand.run(['1.0.0', '1.1.0', '--check'], { dataRoot: root, scratchRoot: root, cwd: repo }),
    0
  );
  assert.notEqual(readFileSync(file, 'utf8'), before, 'a scratch file is written in check mode too');
  assert.match(output(), /wrote .*1\.0\.0-1\.1\.0\.json/);

  assert.equal(await historyCommand.run(['1.0.0', '1.1.0'], { dataRoot: root, scratchRoot: root, cwd: repo }), 0);
  const written = readFileSync(file, 'utf8');
  assert.equal(written, canonical(historyOf('1.0.0', '1.1.0', { surfaceA, surfaceB, cwd: repo })));
  assert.equal(Object.keys(JSON.parse(written).symbols).length, 4);
  assert.equal(
    await historyCommand.run(['1.0.0', '1.1.0', '--check'], { dataRoot: root, scratchRoot: root, cwd: repo }),
    0
  );
});

test('the diff command names the inputs it is missing', async (t) => {
  const { surfaceA } = handWrittenPair();
  const root = dataRoot(t, { 'surfaces/1.0.0.json': surfaceA });

  await assert.rejects(
    diffCommand.run(['1.0.0', '1.1.0'], { dataRoot: root, scratchRoot: root }),
    (/** @type {Error} */ error) =>
      error.message.includes('missing surfaces/1.1.0.json (`cli.mjs surface 1.1.0` writes it)') &&
      error.message.includes('history/1.0.0-1.1.0.json (`cli.mjs history 1.0.0 1.1.0` writes it)') &&
      !error.message.includes('surfaces/1.0.0.json')
  );
  assert.equal(existsSync(path.join(root, 'diffs')), false);
});

test('the diff command writes diffs/<a>-<b>.json, and --check passes on it', async (t) => {
  const { surfaceA, surfaceB, history } = handWrittenPair();
  const root = dataRoot(t, {
    'surfaces/1.0.0.json': surfaceA,
    'surfaces/1.1.0.json': surfaceB,
    'history/1.0.0-1.1.0.json': history,
  });
  const output = captureLog(t);
  const file = path.join(root, 'diffs', '1.0.0-1.1.0.json');

  assert.equal(await diffCommand.run(['1.0.0', '1.1.0', '--check'], { dataRoot: root, scratchRoot: root }), 1);
  assert.equal(existsSync(file), false);
  assert.equal(await diffCommand.run(['1.0.0', '1.1.0'], { dataRoot: root, scratchRoot: root }), 0);
  assert.equal(readFileSync(file, 'utf8'), canonical(fixtureJson('diff-1.0.0-1.1.0.json')));
  assert.equal(await diffCommand.run(['1.0.0', '1.1.0', '--check'], { dataRoot: root, scratchRoot: root }), 0);
  assert.doesNotMatch(output(), /has no symbols/);
});

test('the diff command warns when the history was written before the surfaces existed', async (t) => {
  const { surfaceA, surfaceB, history } = handWrittenPair();
  const root = dataRoot(t, {
    'surfaces/1.0.0.json': surfaceA,
    'surfaces/1.1.0.json': surfaceB,
    'history/1.0.0-1.1.0.json': { ...history, symbols: {} },
  });
  const output = captureLog(t);

  assert.equal(await diffCommand.run(['1.0.0', '1.1.0'], { dataRoot: root, scratchRoot: root }), 0);
  assert.match(output(), /has no symbols although some declarations of 1\.0\.0 are not in 1\.1\.0/);
});

test('the commands describe themselves and refuse wrong arguments', async () => {
  for (const command of [historyCommand, diffCommand]) {
    assert.equal(typeof command.name, 'string');
    assert.match(command.describe, new RegExp(`^${command.name} <a> <b> \\[--check\\]`));
    await assert.rejects(command.run(['1.0.0']), /usage:/);
    await assert.rejects(command.run(['head', '1.0.0']), /usage:/);
    await assert.rejects(command.run(['1.0.0', '1.1.0', '--force']), /Unknown option '--force'/);
  }
});
