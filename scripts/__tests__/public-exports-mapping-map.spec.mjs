import assert from 'node:assert/strict';
import { cpSync, existsSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { describe, test } from 'node:test';

import { canonical, REPO_ROOT } from '../public-exports-mapping/artifacts.mjs';
import * as shipCommand from '../public-exports-mapping/commands/ship.mjs';
import {
  applyDiff,
  buildMap,
  createDataset,
  followDeclaration,
  isOldContract,
  isPublicModule,
  isShimForward,
  pathSegments,
  rankCandidates,
  resolveVersion,
  separatingRule,
  SOURCE_TIE_RULE,
} from '../public-exports-mapping/map.mjs';
import { MESSAGES, ship } from '../public-exports-mapping/ship.mjs';
import { tempDir } from './-run-script.mjs';

const FIXTURE = path.join(import.meta.dirname, 'fixtures', 'public-exports-mapping', 'map');
const PLUGIN_FIXTURE = path.join(
  REPO_ROOT,
  'packages',
  'eslint-plugin-warp-drive',
  'tests',
  'fixtures',
  'legacy-import-mapping'
);
const PREFERENCES = { schema: 1, audience: 'ember', tieBreak: ['@warp-drive/ember'], report: {} };

/** @param {string} file */
const read = (file) => JSON.parse(readFileSync(path.join(FIXTURE, file), 'utf8'));
/** @param {string} dir */
const jsonIn = (dir) => readdirSync(path.join(FIXTURE, dir)).map((name) => read(`${dir}/${name}`));

/** The fixture data as `buildMap` takes it: the baseline surface only, the rest from the diffs. */
function fixtureData() {
  return {
    releases: read('releases.json'),
    surfaces: [read('surfaces/4.12.8.json')],
    diffs: jsonIn('diffs'),
    decisions: jsonIn('decisions'),
    preferences: read('preferences.json'),
    headVersion: '5.10.0',
  };
}

/** @param {string} from @param {string} to */
const fixtureMap = (from, to) => buildMap({ ...fixtureData(), from, to });

/**
 * A candidate token. `forward` is its module's `forward`: a bare specifier makes the module a shim.
 * @param {string} module
 * @param {string} name
 * @param {{ kind?: 'value' | 'type', deprecated?: boolean, pkg?: string, forward?: string | null }} [options]
 */
function token(module, name, { kind = 'value', deprecated = false, pkg, forward = null } = {}) {
  const scoped = module.startsWith('@');
  const segments = module.split('/');
  const pkgName = pkg ?? (scoped ? segments.slice(0, 2).join('/') : segments[0]);
  const shim = isShimForward(forward);
  return { module, export: name, kind, decl: `src/${name}.ts#${name}`, deprecated, package: pkgName, shim };
}

describe('module classification', () => {
  test('a module with any segment starting with - is private', () => {
    assert.equal(isPublicModule('@warp-drive/core/store'), true);
    assert.equal(isPublicModule('@warp-drive/core/store/-private'), false);
    assert.equal(isPublicModule('@warp-drive/core/signals/-leaked'), false);
    assert.equal(isPublicModule('ember-data/-private'), false);
  });

  test('ember-data and @ember-data/* are the old contract, @warp-drive/legacy is modern', () => {
    assert.equal(isOldContract('ember-data'), true);
    assert.equal(isOldContract('@ember-data/store'), true);
    assert.equal(isOldContract('@warp-drive/legacy'), false);
    assert.equal(isOldContract('@warp-drive/core'), false);
  });

  test('a module is a shim when its forward is a bare specifier, and a home otherwise', () => {
    assert.equal(isShimForward(null), false);
    assert.equal(isShimForward('./request/info.ts'), false);
    assert.equal(isShimForward('../shared/index.ts'), false);
    assert.equal(isShimForward('@warp-drive/core/types/request'), true);
    assert.equal(isShimForward('ember-inflector'), true);
  });

  test('path segments are counted below the package, so a scope is not one', () => {
    assert.equal(pathSegments('@warp-drive/core'), 0);
    assert.equal(pathSegments('@warp-drive/core/store/-private'), 2);
    assert.equal(pathSegments('ember-data'), 0);
    assert.equal(pathSegments('ember-data/store'), 1);
  });
});

describe('ranking', () => {
  const source = { module: '@ember-data/store', export: 'Thing' };

  /**
   * Asserts that `rule` is the first rule separating `better` from `worse`, in both argument
   * orders, and that ranking puts `better` first.
   */
  function separates(rule, better, worse, preferences = PREFERENCES) {
    assert.deepEqual(separatingRule(better, worse, source, preferences)?.rule, rule);
    assert.deepEqual(separatingRule(better, worse, source, preferences)?.order, -1);
    assert.deepEqual(separatingRule(worse, better, source, preferences)?.order, 1);
    assert.deepEqual(rankCandidates([worse, better], source, preferences), [better, worse]);
  }

  test('0: a home before a shim, even with more path segments or in a private module', () => {
    const shimOf = (module, target) => token(module, 'Thing', { forward: target });
    separates(
      0,
      token('@warp-drive/core/types/request', 'Thing'),
      shimOf('@warp-drive/core-types/request', '@warp-drive/core/types/request')
    );
    separates(
      0,
      token('@warp-drive/core/types/request', 'Thing', { forward: './request/info.ts' }),
      shimOf('@warp-drive/core-types/request', '@warp-drive/core/types/request')
    );
    separates(
      0,
      token('@warp-drive/core/store/-private', 'Thing'),
      shimOf('@warp-drive/core/store', '@warp-drive/core/store/-private')
    );
  });

  test('1: a public module before a private one, even an old-contract one', () => {
    separates(1, token('@ember-data/store', 'Thing'), token('@warp-drive/core/store/-private', 'Thing'));
  });

  test('2: a modern package before an old-contract one, even with more segments', () => {
    separates(2, token('@warp-drive/core/store', 'Thing'), token('@ember-data/store', 'Thing'));
    separates(2, token('@warp-drive/legacy/model', 'Thing'), token('ember-data', 'Thing'));
  });

  test('3: fewer path segments, even when deprecated', () => {
    separates(3, token('@warp-drive/core', 'Thing', { deprecated: true }), token('@warp-drive/core/store', 'Thing'));
  });

  test('4: not deprecated, even a type against a value', () => {
    separates(
      4,
      token('@warp-drive/core/store', 'Other', { kind: 'type' }),
      token('@warp-drive/core/store', 'Thing', { deprecated: true })
    );
  });

  test('5: a value before a type, even under another name', () => {
    separates(5, token('@warp-drive/core', 'Other'), token('@warp-drive/core', 'Thing', { kind: 'type' }));
  });

  test('6: the source export name, even outside preferences.tieBreak', () => {
    separates(6, token('@warp-drive/react', 'Thing'), token('@warp-drive/ember', 'Other'));
  });

  test('7: a module of a package in preferences.tieBreak, in its order, before the alphabet', () => {
    separates(7, token('@warp-drive/ember', 'Thing'), token('@warp-drive/core', 'Thing'));
    separates(7, token('@warp-drive/ember/reactive', 'Thing'), token('@warp-drive/core/reactive', 'Thing'));
    const preferences = { ...PREFERENCES, tieBreak: ['@warp-drive/react', '@warp-drive/ember'] };
    separates(7, token('@warp-drive/react', 'Thing'), token('@warp-drive/ember', 'Thing'), preferences);
    // a package whose name only starts with an entry is another package
    separates(8, token('@warp-drive/core', 'Thing'), token('@warp-drive/ember-extra', 'Thing'));
  });

  test('8: module name, then export name, alphabetical', () => {
    separates(8, token('@warp-drive/core', 'Other'), token('@warp-drive/legacy', 'Other'));
    separates(8, token('@warp-drive/core', 'Alpha'), token('@warp-drive/core', 'Beta'));
  });

  test('the source token keeps a tie that only rules 6 to 8 would break', () => {
    const react = { module: '@warp-drive/react', export: 'getRequestState' };
    const own = token('@warp-drive/react', 'getRequestState');
    const ember = token('@warp-drive/ember', 'getRequestState');
    assert.equal(SOURCE_TIE_RULE, 5);
    assert.equal(separatingRule(ember, own, react, PREFERENCES)?.rule, 7);
    assert.deepEqual(rankCandidates([ember, own], react, PREFERENCES), [own, ember]);
    // a rule up to 5 still ranks a better home before the source token
    const deprecated = token('@warp-drive/react', 'getRequestState', { deprecated: true });
    assert.deepEqual(rankCandidates([deprecated, ember], react, PREFERENCES), [ember, deprecated]);
    const shim = token('@warp-drive/react', 'getRequestState', { forward: '@warp-drive/ember' });
    assert.deepEqual(rankCandidates([shim, ember], react, PREFERENCES), [ember, shim]);
  });

  test('the same token is not separated', () => {
    assert.equal(
      separatingRule(token('@warp-drive/core', 'Thing'), token('@warp-drive/core', 'Thing'), source, PREFERENCES),
      null
    );
  });
});

describe('diffs and versions', () => {
  const surface = {
    schema: 1,
    kind: 'surface',
    version: '1.0.0',
    tag: 'v1.0.0',
    packages: { a: { dir: 'packages/a', modules: ['a'] } },
    modules: {
      a: {
        package: 'a',
        entry: 'packages/a/src/index.ts',
        forward: 'b',
        exports: { x: { kind: 'value', decl: 'a.ts#x', deprecated: true } },
      },
    },
  };
  const diff = (changes) => ({
    schema: 1,
    kind: 'diff',
    from: '1.0.0',
    to: '2.0.0',
    modules: { added: {}, removed: [], changed: {} },
    exports: {},
    declarations: {},
    ...changes,
  });

  test('null removes deprecated, and is the value of an attribute that is always present', () => {
    const next = applyDiff(
      surface,
      diff({
        modules: { added: {}, removed: [], changed: { a: { forward: null } } },
        exports: { a: { added: {}, removed: [], changed: { x: { deprecated: null } } } },
      })
    );
    assert.equal(next.version, '2.0.0');
    assert.equal(next.tag, 'v2.0.0');
    assert.equal(Object.hasOwn(next.modules.a, 'forward'), true);
    assert.equal(next.modules.a.forward, null);
    assert.deepEqual(next.modules.a.exports.x, { kind: 'value', decl: 'a.ts#x' });
    assert.equal(surface.modules.a.exports.x.deprecated, true, 'the input is not changed');
  });

  test('applies the packages section', () => {
    const next = applyDiff(
      surface,
      diff({
        packages: {
          added: { c: { dir: 'packages/c', modules: [] } },
          removed: [],
          changed: { a: { dir: 'warp-drive-packages/a' } },
        },
      })
    );
    assert.deepEqual(next.packages, {
      a: { dir: 'warp-drive-packages/a', modules: ['a'] },
      c: { dir: 'packages/c', modules: [] },
    });
    const gone = applyDiff(
      next,
      diff({ from: '2.0.0', to: '3.0.0', packages: { added: {}, removed: ['c'], changed: {} } })
    );
    assert.deepEqual(Object.keys(gone.packages), ['a']);
    assert.throws(
      () => applyDiff(surface, diff({ packages: { added: {}, removed: ['z'], changed: {} } })),
      /cannot remove package z/
    );
  });

  test('an added module starts empty and takes its exports from the exports section', () => {
    const next = applyDiff(
      surface,
      diff({
        to: 'head',
        modules: {
          added: { c: { package: 'a', entry: 'packages/a/src/c.ts', forward: null } },
          removed: [],
          changed: {},
        },
        exports: { c: { added: { y: { kind: 'type', decl: 'c.ts#y' } }, removed: [], changed: {} } },
      })
    );
    assert.equal(next.tag, null);
    assert.deepEqual(next.modules.c.exports, { y: { kind: 'type', decl: 'c.ts#y' } });
  });

  test('a diff that does not apply throws', () => {
    assert.throws(() => applyDiff(surface, diff({ from: '0.9.0' })), /does not apply to surface 1\.0\.0/);
    assert.throws(
      () => applyDiff(surface, diff({ modules: { added: {}, removed: ['z'], changed: {} } })),
      /cannot remove module z/
    );
    assert.throws(
      () =>
        applyDiff(
          surface,
          diff({ exports: { a: { added: { x: { kind: 'value', decl: 'a.ts#x' } }, removed: [], changed: {} } } })
        ),
      /cannot add export x, it exists/
    );
    assert.throws(
      () => applyDiff(surface, diff({ exports: { z: { added: {}, removed: [], changed: {} } } })),
      /a module it lacks/
    );
  });

  test('a declaration follows the diffs pair by pair, and resumes where a later surface declares it again', () => {
    /** A surface whose module m exports one name per declaration id. */
    const at = (version, decls) => ({
      schema: 1,
      kind: 'surface',
      version,
      modules: {
        m: {
          package: 'm',
          forward: null,
          exports: Object.fromEntries(decls.map((decl) => [decl.split('#')[1], { kind: 'value', decl }])),
        },
      },
    });
    const step = (from, to, declarations) => ({ ...diff({ from, to }), declarations });
    const dataset = createDataset({
      releases: { schema: 1, baseline: '1.0.0', releases: ['1.0.0', '2.0.0', '3.0.0', '4.0.0'] },
      surfaces: [
        at('1.0.0', ['a#x', 'c#y', 'z#z']),
        at('2.0.0', ['z#z']),
        at('3.0.0', ['a#x', 'z#z']),
        at('4.0.0', ['b#x2', 'z#z']),
      ],
      diffs: [
        step('1.0.0', '2.0.0', { 'a#x': null, 'c#y': null }),
        step('2.0.0', '3.0.0', { 'z#z': 'z#z' }),
        step('3.0.0', '4.0.0', { 'a#x': 'b#x2', 'z#z': 'z#z' }),
      ],
      preferences: PREFERENCES,
    });
    assert.equal(followDeclaration(dataset, 'a#x', '1.0.0', '4.0.0'), 'b#x2', 'resumes at 3.0.0, then moves');
    assert.equal(followDeclaration(dataset, 'a#x', '1.0.0', '3.0.0'), 'a#x');
    assert.equal(followDeclaration(dataset, 'a#x', '1.0.0', '2.0.0'), null, 'nothing up to to declares it');
    assert.equal(followDeclaration(dataset, 'c#y', '1.0.0', '4.0.0'), null);
    assert.equal(followDeclaration(dataset, 'z#z', '1.0.0', '4.0.0'), 'z#z', 'an id a diff does not list keeps its id');
    assert.equal(followDeclaration(dataset, 'a#x', '3.0.0', '3.0.0'), 'a#x');
  });

  test('a version is a release, its minor, a minor between releases, or head', () => {
    const dataset = createDataset(fixtureData());
    assert.deepEqual(dataset.versions, ['4.12.8', '5.0.1', '5.6.0', '5.9.1', 'head']);
    assert.equal(resolveVersion(dataset, '5.6.0'), '5.6.0');
    assert.equal(resolveVersion(dataset, '5.6'), '5.6.0');
    assert.equal(resolveVersion(dataset, '5.6.2-beta.1'), '5.6.0');
    assert.equal(resolveVersion(dataset, '5.8'), '5.6.0');
    assert.equal(resolveVersion(dataset, '5.10.0-alpha.3'), 'head');
    assert.equal(resolveVersion(dataset, 'head'), 'head');
    assert.throws(() => resolveVersion(dataset, '4.6'), /no data for 4\.6/);
    assert.throws(() => resolveVersion(dataset, '5.11'), /no data for 5\.11/);
    assert.throws(() => resolveVersion(dataset, 'next'), /"next" is not a version/);
  });

  test('preferences.report takes only the known reasons, and the lists take names', () => {
    assert.throws(
      () => createDataset({ ...fixtureData(), preferences: { schema: 1, report: { 'ember-data': 'gone' } } }),
      /reports ember-data as "gone"/
    );
    assert.throws(
      () => createDataset({ ...fixtureData(), preferences: { schema: 1, ignorePackages: 'warp-drive' } }),
      /ignorePackages must be a list/
    );
    assert.throws(
      () => createDataset({ ...fixtureData(), preferences: { schema: 1, tieBreak: [1] } }),
      /tieBreak must be a list/
    );
  });
});

describe('buildMap', () => {
  const map = fixtureMap('4.12', '5.9');
  /** @param {string} module @param {string} name @param {boolean} [typeOnly] */
  const decide = (module, name, typeOnly = false) => map.resolve(module, name, { typeOnly });

  test('lists every token of the from surface once, with how it resolved', () => {
    const surface = read('surfaces/4.12.8.json');
    const expected = Object.entries(surface.modules).flatMap(([module, record]) =>
      Object.keys(record.exports).map((name) => `${module} ${name}`)
    );
    assert.deepEqual(map.tokens.map((t) => `${t.module} ${t.export}`).sort(), expected.sort());
    const store = map.tokens.find((t) => t.module === '@ember-data/store' && t.export === 'default');
    assert.equal(store.via, 'declarations');
    assert.equal(store.target, 'warp-drive-packages/core/src/store/-private/store-service.ts#Store');
    assert.deepEqual(store.candidates[0], { module: '@warp-drive/core', export: 'Store', kind: 'value' });
    assert.deepEqual(store.decision, { action: 'rewrite', to: { module: '@warp-drive/core', export: 'Store' } });
    assert.equal('typeOnlyDecision' in store, false);
  });

  test('module not in the from surface: keep', () => {
    assert.deepEqual(decide('lodash', 'debounce'), { action: 'keep' });
    assert.deepEqual(decide('@warp-drive/core', 'Store'), { action: 'keep' });
  });

  test('module in preferences.report: report with that reason, whatever the name', () => {
    assert.deepEqual(decide('ember-data', 'default'), { action: 'report', reason: 'side-effect' });
    assert.deepEqual(decide('ember-data/store', 'Whatever'), { action: 'report', reason: 'side-effect' });
  });

  test('name not in the module: untracked, unless the module forwards at to', () => {
    assert.deepEqual(decide('@ember-data/store', 'Nope'), { action: 'report', reason: 'untracked' });
    assert.deepEqual(decide('@ember-data/legacy-compat', 'Nope'), {
      action: 'rewrite',
      to: { module: '@warp-drive/legacy/compat', export: 'Nope' },
    });
    assert.deepEqual(decide('@ember-data/store/-private', 'Nope'), {
      action: 'rewrite',
      to: { module: '@warp-drive/core/store/-private', export: 'Nope' },
      reason: 'private-target',
    });
  });

  test('no candidate and no decision: removed, and residue for the judge', () => {
    assert.deepEqual(decide('@ember-data/store', 'normalizeModelName'), { action: 'report', reason: 'removed' });
    assert.deepEqual(map.residue, [
      {
        module: '@ember-data/store',
        export: 'normalizeModelName',
        kind: 'value',
        decl: 'packages/store/src/-private/index.ts#normalizeModelName',
        target: null,
      },
    ]);
  });

  test('a declaration the next release lacks and a later one declares again resumes there', () => {
    const source = ['@ember-data/request-utils', 'setBuildURLConfig'];
    assert.deepEqual(fixtureMap('4.12', '5.0').resolve(...source), { action: 'report', reason: 'removed' });
    assert.deepEqual(fixtureMap('4.12', '5.6').resolve(...source), { action: 'keep' });
    assert.deepEqual(decide(...source), {
      action: 'rewrite',
      to: { module: '@warp-drive/utilities', export: 'setBuildURLConfig' },
    });
    const resumed = map.tokens.find((t) => t.export === 'setBuildURLConfig');
    assert.equal(resumed.via, 'declarations');
    assert.equal(resumed.target, 'warp-drive-packages/utilities/src/index.ts#setBuildURLConfig');
    assert.equal(
      fixtureMap('4.12', '5.0').residue.some((t) => t.export === 'setBuildURLConfig'),
      true
    );
  });

  test('no candidate and a removal decision: removed with removedIn and shim, not residue', () => {
    const decision = decide('@ember-data/adapter/error', 'errorsArrayToHash');
    assert.equal(decision.reason, 'removed');
    assert.equal(decision.removedIn, '#8550');
    assert.match(decision.shim, /^export function errorsArrayToHash/);
    assert.equal(decision.links, undefined, 'links come from messages.json, which the scripts do not pass');
    assert.equal(map.tokens.find((t) => t.export === 'errorsArrayToHash').via, 'decision');
  });

  test('no candidate and a judged choice: the choice', () => {
    assert.deepEqual(decide('@ember-data/store', 'CacheHandler'), {
      action: 'rewrite',
      to: { module: '@warp-drive/core', export: 'CacheHandler' },
    });
  });

  test('a judged choice follows its declaration to a later or an earlier to', () => {
    assert.deepEqual(fixtureMap('4.12', 'head').resolve('@ember-data/store/-private', 'IdentifierArray'), {
      action: 'rewrite',
      to: { module: '@warp-drive/core/store/-private', export: 'ReactiveResourceArray' },
      reason: 'private-target',
    });
    assert.deepEqual(fixtureMap('4.12', '5.6').resolve('@ember-data/store', 'CacheHandler'), {
      action: 'rewrite',
      to: { module: '@warp-drive/core', export: 'CacheHandler' },
    });
  });

  test('winner is the same token: keep', () => {
    assert.deepEqual(fixtureMap('4.12', '5.0').resolve('@ember-data/store', 'default'), { action: 'keep' });
  });

  test('a value import whose winner is a type: type-only; a type import of it: rewrite', () => {
    assert.deepEqual(decide('@ember-data/model/-private', 'ManyArray'), {
      action: 'report',
      reason: 'type-only',
      to: { module: '@warp-drive/legacy/model', export: 'ManyArray' },
    });
    assert.deepEqual(decide('@ember-data/model/-private', 'ManyArray', true), {
      action: 'rewrite',
      to: { module: '@warp-drive/legacy/model', export: 'ManyArray' },
    });
    assert.deepEqual(
      map.tokens.find((t) => t.export === 'ManyArray').typeOnlyDecision,
      decide('@ember-data/model/-private', 'ManyArray', true)
    );
  });

  test('winner in a private module: rewrite with reason private-target', () => {
    assert.deepEqual(decide('@ember-data/store/-private', 'coerceId'), {
      action: 'rewrite',
      to: { module: '@warp-drive/core/store/-private', export: 'coerceId' },
      reason: 'private-target',
    });
  });

  test('otherwise: rewrite, keeping a default to named or named to default move', () => {
    assert.deepEqual(decide('@ember-data/adapter/json-api', 'default'), {
      action: 'rewrite',
      to: { module: '@warp-drive/legacy/adapter/json-api', export: 'JSONAPIAdapter' },
    });
    assert.deepEqual(fixtureMap('4.12', '5.0').resolve('ember-data/adapters/errors', 'AdapterError'), {
      action: 'rewrite',
      to: { module: '@ember-data/adapter/error', export: 'default' },
    });
  });

  test('a namespace import follows a forward, or a move of every export to one module', () => {
    assert.deepEqual(decide('@ember-data/legacy-compat', '*'), {
      action: 'rewrite',
      to: { module: '@warp-drive/legacy/compat', export: '*' },
    });
    assert.deepEqual(decide('@ember-data/model', '*'), {
      action: 'rewrite',
      to: { module: '@warp-drive/legacy/model', export: '*' },
    });
    assert.deepEqual(decide('@ember-data/store', '*'), { action: 'keep' });
    assert.deepEqual(decide('ember-data/adapters/errors', '*'), {
      action: 'rewrite',
      to: { module: '@warp-drive/legacy/adapter/error', export: '*' },
    });
  });

  test('a namespace import of a module that is gone and did not move as a whole: removed', () => {
    const data = fixtureData();
    const fixtureSurface = data.surfaces[0];
    fixtureSurface.modules['ember-data/adapters/errors'].exports.Extra = { kind: 'value', decl: 'gone.ts#Extra' };
    const gone = buildMap({ ...data, from: '4.12', to: '5.9' });
    assert.deepEqual(gone.resolve('ember-data/adapters/errors', '*'), { action: 'report', reason: 'removed' });
  });

  test('stale decisions are listed and not applied', () => {
    const data = fixtureData();
    data.decisions[0].entries.push({ decl: 'nowhere.ts#x', source: null, choice: null });
    const stale = buildMap({ ...data, from: '4.12', to: '5.9' }).stale;
    assert.deepEqual(stale, [{ decl: 'nowhere.ts#x', source: null, choice: null, reason: 'decl-not-in-from' }]);
  });

  test('residue leaves out modules preferences.report reports anyway', () => {
    const data = fixtureData();
    const diff = data.diffs.find((d) => d.from === '5.0.1');
    diff.declarations['packages/-ember-data/addon/store.ts#default'] = null;
    diff.exports['ember-data/store'].changed.default.decl = 'nowhere.ts#default';
    const after = buildMap({ ...data, from: '4.12', to: '5.6' });
    assert.equal(after.tokens.find((t) => t.module === 'ember-data/store').via, null);
    assert.equal(
      after.residue.some((t) => t.module === 'ember-data/store'),
      false
    );
  });

  test('a value that became a type in place is reported: type-only is checked before keep', () => {
    const surface = (version, kind) => ({
      schema: 1,
      kind: 'surface',
      version,
      modules: { m: { package: 'm', forward: null, exports: { X: { kind, decl: 'm.ts#X' } } } },
    });
    const inPlace = buildMap({
      from: '1.0.0',
      to: '2.0.0',
      releases: { schema: 1, baseline: '1.0.0', releases: ['1.0.0', '2.0.0'] },
      surfaces: [surface('1.0.0', 'value'), surface('2.0.0', 'type')],
      diffs: [
        {
          schema: 1,
          kind: 'diff',
          from: '1.0.0',
          to: '2.0.0',
          modules: { added: {}, removed: [], changed: {} },
          exports: { m: { added: {}, removed: [], changed: { X: { kind: 'type' } } } },
          declarations: {},
        },
      ],
      preferences: PREFERENCES,
    });
    assert.deepEqual(inPlace.resolve('m', 'X'), {
      action: 'report',
      reason: 'type-only',
      to: { module: 'm', export: 'X' },
    });
    assert.deepEqual(inPlace.resolve('m', 'X', { typeOnly: true }), { action: 'keep' });
  });

  test('in the fixture: a value import of a class that became a type in place', () => {
    const map56 = fixtureMap('5.6', '5.9');
    assert.deepEqual(map56.resolve('@warp-drive/core', 'ConfiguredStore'), {
      action: 'report',
      reason: 'type-only',
      to: { module: '@warp-drive/core', export: 'ConfiguredStore' },
    });
    assert.deepEqual(map56.resolve('@warp-drive/core', 'ConfiguredStore', { typeOnly: true }), { action: 'keep' });
  });

  test('a home ranks before a shim of it, whatever the path segments', () => {
    const request = map.tokens.find((t) => t.module === '@ember-data/request' && t.export === 'RequestInfo');
    assert.deepEqual(
      request.candidates.map((c) => c.module),
      ['@warp-drive/core/types/request', '@ember-data/request', '@warp-drive/core-types/request']
    );
    assert.deepEqual(decide('@ember-data/request', 'RequestInfo', true), {
      action: 'rewrite',
      to: { module: '@warp-drive/core/types/request', export: 'RequestInfo' },
    });
    assert.deepEqual(
      fixtureMap('5.6', '5.9').resolve('@warp-drive/core-types/request', 'RequestInfo', { typeOnly: true }),
      {
        action: 'rewrite',
        to: { module: '@warp-drive/core/types/request', export: 'RequestInfo' },
      }
    );
  });

  test('only a shim forwards names and namespaces; a relative forward is a home', () => {
    const map56 = fixtureMap('5.6', '5.9');
    assert.deepEqual(map56.resolve('@warp-drive/core-types/request', 'Unknown'), {
      action: 'rewrite',
      to: { module: '@warp-drive/core/types/request', export: 'Unknown' },
    });
    assert.deepEqual(map56.resolve('@warp-drive/core-types/request', '*'), {
      action: 'rewrite',
      to: { module: '@warp-drive/core/types/request', export: '*' },
    });
    assert.deepEqual(map56.resolve('@warp-drive/core/types/request', 'Unknown'), {
      action: 'report',
      reason: 'untracked',
    });
    assert.deepEqual(map56.resolve('@warp-drive/core/types/request', '*'), { action: 'keep' });
  });

  test('the source token stays when only rules 6 to 8 rank another home first', () => {
    const map59 = fixtureMap('5.9', '5.9');
    assert.deepEqual(map59.resolve('@warp-drive/react', 'getRequestState'), { action: 'keep' });
    assert.deepEqual(map59.resolve('@warp-drive/ember', 'getRequestState'), { action: 'keep' });
    assert.deepEqual(map59.resolve('@warp-drive/core/store', 'CachePolicy'), {
      action: 'rewrite',
      to: { module: '@warp-drive/core/store', export: 'DefaultCachePolicy' },
    });
  });

  test('preferences.tieBreak prefers any module of its packages', () => {
    assert.deepEqual(fixtureMap('5.6', '5.9').resolve('@warp-drive/core/store/-private', 'getPromiseState'), {
      action: 'rewrite',
      to: { module: '@warp-drive/ember/reactive', export: 'getPromiseState' },
    });
  });

  test('preferences.ignorePackages: their modules keep every import and leave the residue', () => {
    const ignoring = fixtureMap('5.6', '5.9');
    for (const name of ['UmbrellaOnly', 'Store', 'Nope', '*']) {
      assert.deepEqual(ignoring.resolve('warp-drive/core', name), { action: 'keep' }, name);
    }
    assert.equal(
      ignoring.residue.some((t) => t.module === 'warp-drive/core'),
      false
    );

    const data = fixtureData();
    const tracking = buildMap({
      ...data,
      preferences: { ...data.preferences, ignorePackages: [] },
      from: '5.6',
      to: '5.9',
    });
    assert.deepEqual(tracking.resolve('warp-drive/core', 'UmbrellaOnly'), { action: 'report', reason: 'removed' });
    assert.deepEqual(tracking.resolve('warp-drive/core', 'Store'), {
      action: 'rewrite',
      to: { module: '@warp-drive/core', export: 'Store' },
    });
    assert.deepEqual(
      tracking.residue.filter((t) => t.module === 'warp-drive/core').map((t) => t.export),
      ['UmbrellaOnly']
    );
  });
});

describe('ship', () => {
  /** Runs `fn` with console.log captured; returns its result and the printed lines. */
  async function captured(t, fn) {
    const lines = [];
    t.mock.method(console, 'log', (line) => lines.push(String(line)));
    const result = await fn();
    t.mock.restoreAll();
    return { result, lines };
  }

  /** A writable copy of the fixture data and an empty shipped directory. */
  function setup(t) {
    const dataRoot = tempDir(t, 'ship-data-');
    cpSync(FIXTURE, dataRoot, { recursive: true });
    return { dataRoot, shippedRoot: tempDir(t, 'ship-out-') };
  }

  test('is a command module', () => {
    assert.equal(shipCommand.name, 'ship');
    assert.match(shipCommand.describe, /^ship \[--check\]/);
    assert.equal(typeof shipCommand.run, 'function');
  });

  test('writes the data directory, then --check finds no drift', async (t) => {
    const { dataRoot, shippedRoot } = setup(t);
    const write = await captured(t, () => shipCommand.run([], { dataRoot, shippedRoot }));
    assert.equal(write.result, 0);
    assert.match(write.lines.at(-1), /^ship: 9 artifacts, 9 written$/);
    const files = [
      'decisions/4.12.8.json',
      'diffs/4.12.8-5.0.1.json',
      'diffs/5.0.1-5.6.0.json',
      'diffs/5.6.0-5.9.1.json',
      'diffs/5.9.1-head.json',
      'messages.json',
      'preferences.json',
      'releases.json',
      'surface.4.12.8.json',
    ];
    assert.deepEqual(
      [...readdirSync(shippedRoot, { recursive: true })].filter((f) => f.endsWith('.json')).sort(),
      files
    );
    assert.equal(
      readFileSync(path.join(shippedRoot, 'surface.4.12.8.json'), 'utf8'),
      canonical(read('surfaces/4.12.8.json')),
      'written as canonical JSON, whatever the format of the source'
    );
    assert.equal(readFileSync(path.join(shippedRoot, 'messages.json'), 'utf8'), canonical(MESSAGES));

    const check = await captured(t, () => shipCommand.run(['--check'], { dataRoot, shippedRoot }));
    assert.equal(check.result, 0);
    assert.deepEqual(check.lines, ['ship: 9 artifacts, 0 drifted']);
  });

  test('--check reports a changed source and writes nothing', async (t) => {
    const { dataRoot, shippedRoot } = setup(t);
    await captured(t, () => shipCommand.run([], { dataRoot, shippedRoot }));
    const file = path.join(dataRoot, 'decisions', '4.12.8.json');
    const decisions = JSON.parse(readFileSync(file, 'utf8'));
    decisions.entries[0].reviewed = true;
    writeFileSync(file, canonical(decisions));
    const before = readFileSync(path.join(shippedRoot, 'decisions', '4.12.8.json'), 'utf8');

    const check = await captured(t, () => shipCommand.run(['--check'], { dataRoot, shippedRoot }));
    assert.equal(check.result, 1);
    assert.match(check.lines[0], /^ship: would change .*decisions\/4\.12\.8\.json \(\d+ -> \d+ lines\)$/);
    assert.equal(readFileSync(path.join(shippedRoot, 'decisions', '4.12.8.json'), 'utf8'), before);
  });

  test('removes shipped data whose source is gone, and only data', async (t) => {
    const { dataRoot, shippedRoot } = setup(t);
    await captured(t, () => shipCommand.run([], { dataRoot, shippedRoot }));
    rmSync(path.join(dataRoot, 'decisions', '4.12.8.json'));
    writeFileSync(path.join(shippedRoot, '5.5.json'), '{}\n');
    writeFileSync(path.join(shippedRoot, 'index.js'), 'module.exports = {};\n');

    const check = await captured(t, () => shipCommand.run(['--check'], { dataRoot, shippedRoot }));
    assert.equal(check.result, 1);
    assert.deepEqual(
      check.lines.filter((l) => l.includes('would remove')).map((l) => path.basename(l)),
      ['5.5.json', '4.12.8.json']
    );
    assert.equal(existsSync(path.join(shippedRoot, '5.5.json')), true);

    const write = await captured(t, () => shipCommand.run([], { dataRoot, shippedRoot }));
    assert.equal(write.result, 0);
    assert.equal(existsSync(path.join(shippedRoot, '5.5.json')), false);
    assert.equal(existsSync(path.join(shippedRoot, 'decisions', '4.12.8.json')), false);
    assert.equal(existsSync(path.join(shippedRoot, 'index.js')), true);
  });

  test('a stale decision fails --check', async (t) => {
    const { dataRoot, shippedRoot } = setup(t);
    const file = path.join(dataRoot, 'decisions', '4.12.8.json');
    const decisions = JSON.parse(readFileSync(file, 'utf8'));
    decisions.entries.find((e) => e.choice?.export === 'LiveArray').choice.export = 'NoSuchArray';
    writeFileSync(file, canonical(decisions));

    const write = await captured(t, () => shipCommand.run([], { dataRoot, shippedRoot }));
    assert.equal(write.result, 0, 'writing still ships; the reader skips the stale entry');
    const check = await captured(t, () => shipCommand.run(['--check'], { dataRoot, shippedRoot }));
    assert.equal(check.result, 1);
    assert.deepEqual(check.lines, [
      'ship: 9 artifacts, 0 drifted',
      'ship: stale decision in decisions/4.12.8.json: packages/store/src/-private/record-arrays/identifier-array.ts#default (@ember-data/store/-private IdentifierArray): choice-not-in-to',
    ]);
  });

  test('refuses diffs that do not rebuild a surface, a broken chain and a missing baseline', (t) => {
    const { dataRoot, shippedRoot } = setup(t);
    const file = path.join(dataRoot, 'diffs', '5.6.0-5.9.1.json');
    const diff = JSON.parse(readFileSync(file, 'utf8'));
    delete diff.exports['@warp-drive/core/store'];
    writeFileSync(file, canonical(diff));
    assert.throws(
      () => ship({ dataRoot, shippedRoot }),
      /the diffs up to 5\.9\.1 do not rebuild surfaces\/5\.9\.1\.json/
    );

    rmSync(file);
    assert.throws(() => ship({ dataRoot, shippedRoot }), /missing diffs\/5\.6\.0-5\.9\.1\.json/);

    rmSync(path.join(dataRoot, 'surfaces', '4.12.8.json'));
    assert.throws(
      () => ship({ dataRoot, shippedRoot }),
      /missing surfaces\/4\.12\.8\.json \(cli\.mjs surface 4\.12\.8\)/
    );
    assert.deepEqual(readdirSync(shippedRoot), [], 'nothing is written');
  });

  test('takes the context the CLI passes, and throws on usage errors and missing inputs', async (t) => {
    const { dataRoot, shippedRoot } = setup(t);
    const write = await captured(t, () => shipCommand.run([], { dataRoot, cwd: dataRoot, shippedRoot }));
    assert.equal(write.result, 0);
    await assert.rejects(() => shipCommand.run(['--force'], { dataRoot, shippedRoot }), /Unknown option '--force'/);
    await assert.rejects(() => shipCommand.run(['5.9.1'], { dataRoot, shippedRoot }), /Unexpected argument '5\.9\.1'/);
    const empty = tempDir(t, 'ship-empty-');
    await assert.rejects(() => shipCommand.run([], { dataRoot: empty, shippedRoot }), /ship: missing releases\.json/);
  });

  // The plugin's fixture is this fixture as ship writes it, formatted by oxfmt. To refresh it, run
  // ship({ dataRoot: FIXTURE, shippedRoot: PLUGIN_FIXTURE }), then `pnpm exec oxfmt` on it.
  test("keeps the plugin's test fixture in sync with this fixture", (t) => {
    const shippedRoot = tempDir(t, 'ship-plugin-');
    t.mock.method(console, 'log', () => {});
    ship({ dataRoot: FIXTURE, shippedRoot });
    t.mock.restoreAll();
    /** @param {string} root */
    const files = (root) =>
      [...readdirSync(root, { recursive: true })].filter((f) => String(f).endsWith('.json')).sort();
    assert.deepEqual(files(PLUGIN_FIXTURE), files(shippedRoot));
    for (const file of files(shippedRoot)) {
      const parse = (/** @type {string} */ root) => JSON.parse(readFileSync(path.join(root, String(file)), 'utf8'));
      assert.deepEqual(parse(PLUGIN_FIXTURE), parse(shippedRoot), `${file} differs from what ship writes`);
    }
  });
});
