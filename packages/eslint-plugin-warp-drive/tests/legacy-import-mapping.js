'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const mapping = require('../src/legacy-import-mapping/index.js');

const { HEAD_VERSION, NO_DATA, listReleases, loadMap } = mapping;
const FIXTURE = path.join(__dirname, 'fixtures', 'legacy-import-mapping');
const SHIPPED = path.join(__dirname, '..', 'src', 'legacy-import-mapping');

/** A temporary directory, removed after the enclosing `describe`. */
function tempDir(prefix) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return dir;
}

/** A copy of the fixture data that a test may change. */
function copyFixture(prefix) {
  const dir = tempDir(prefix);
  fs.cpSync(FIXTURE, dir, { recursive: true });
  return dir;
}

/** Runs `fn` with `cwd` as the working directory. */
function inDirectory(cwd, fn) {
  const previous = process.cwd();
  process.chdir(cwd);
  try {
    return fn();
  } finally {
    process.chdir(previous);
  }
}

/** A project directory whose node_modules has `@warp-drive/core` at `version`, or nothing. */
function project(root, name, version, packageJson = {}) {
  const dir = path.join(root, name);
  fs.mkdirSync(dir, { recursive: true });
  if (version) {
    const core = path.join(dir, 'node_modules', '@warp-drive', 'core');
    fs.mkdirSync(core, { recursive: true });
    fs.writeFileSync(
      path.join(core, 'package.json'),
      JSON.stringify({ name: '@warp-drive/core', version, ...packageJson })
    );
  }
  return dir;
}

describe('legacy-import-mapping', () => {
  describe('versions', () => {
    it('lists the shipped releases, then head', () => {
      assert.deepStrictEqual(listReleases({ dataDir: FIXTURE }), ['4.12.8', '5.0.1', '5.6.0', '5.9.1', 'head']);
    });

    it('defaults from to the baseline', () => {
      assert.strictEqual(loadMap({ dataDir: FIXTURE, to: '5.9' }).from, '4.12.8');
    });

    it('accepts a full version, a minor, a patch of a minor, a v-tag and head', () => {
      const map = loadMap({ dataDir: FIXTURE, from: '4.12.8', to: '5.9.1' });
      assert.strictEqual(loadMap({ dataDir: FIXTURE, from: '4.12', to: '5.9' }), map, 'maps are cached per (from, to)');
      assert.strictEqual(loadMap({ dataDir: FIXTURE, from: 'v4.12.0', to: '5.9.0' }), map);
      assert.strictEqual(loadMap({ dataDir: FIXTURE, to: 'head' }).to, 'head');
      assert.strictEqual(loadMap({ dataDir: FIXTURE, to: HEAD_VERSION }).to, 'head');
    });

    it('reads a minor between two releases as the older one', () => {
      assert.strictEqual(loadMap({ dataDir: FIXTURE, from: '5.3', to: '5.7' }).from, '5.0.1');
      assert.strictEqual(loadMap({ dataDir: FIXTURE, from: '5.3', to: '5.7' }).to, '5.6.0');
    });

    it('rejects versions the data does not cover', () => {
      assert.throws(
        () => loadMap({ dataDir: FIXTURE, from: '4.6' }),
        /no data for 4\.6; known: 4\.12, 5\.0, 5\.6, 5\.9, \d+\.\d+ \(head\)/
      );
      assert.throws(() => loadMap({ dataDir: FIXTURE, to: '9.0' }), /no data for 9\.0/);
      assert.throws(() => loadMap({ dataDir: FIXTURE, to: 'latest' }), /"latest" is not a version/);
      assert.throws(
        () => loadMap({ dataDir: FIXTURE, from: '5.9', to: '5.0' }),
        /from 5\.9\.1 is newer than to 5\.0\.1/
      );
    });

    it('rejects head when no diff reaches it', () => {
      const dir = copyFixture('mapping-no-head-');
      fs.rmSync(path.join(dir, 'diffs', '5.9.1-head.json'));
      assert.deepStrictEqual(listReleases({ dataDir: dir }), ['4.12.8', '5.0.1', '5.6.0', '5.9.1']);
      assert.throws(() => loadMap({ dataDir: dir, to: 'head' }), /no data for "head"/);
    });

    it('fails with a code a caller can test when there is no data', () => {
      const dir = tempDir('mapping-empty-');
      assert.throws(
        () => loadMap({ dataDir: dir }),
        (error) => error.code === NO_DATA && /No legacy import mapping data in /.test(error.message)
      );
    });
  });

  describe('the default to', () => {
    const root = tempDir('mapping-projects-');
    const toIn = (dir, options = {}) => inDirectory(dir, () => loadMap({ dataDir: FIXTURE, ...options }).to);

    it('is the release of the installed @warp-drive/core', () => {
      assert.strictEqual(toIn(project(root, 'on-5.6', '5.6.3')), '5.6.0');
      assert.strictEqual(toIn(project(root, 'on-5.3', '5.3.0')), '5.0.1');
      assert.strictEqual(toIn(project(root, 'on-head', HEAD_VERSION)), 'head');
    });

    it('finds @warp-drive/core whose exports map hides its package.json', () => {
      const dir = project(root, 'exports-map', '5.9.0', { exports: { '.': './dist/index.js', './*': './dist/*.js' } });
      assert.strictEqual(toIn(dir), '5.9.1');
    });

    it('is the newest release when @warp-drive/core is not installed or not covered', () => {
      assert.strictEqual(toIn(project(root, 'nothing', null)), '5.9.1');
      assert.strictEqual(toIn(project(root, 'too-new', '9.1.0')), '5.9.1');
    });

    it('is from when the installed release is older than from', () => {
      assert.strictEqual(toIn(project(root, 'older', '5.6.0'), { from: '5.9' }), '5.9.1');
    });
  });

  describe('resolve', () => {
    let map;
    before(() => {
      map = loadMap({ dataDir: FIXTURE, from: '4.12', to: '5.9' });
    });

    it('rewrites a moved export', () => {
      assert.deepStrictEqual(map.resolve('@ember-data/store', 'default', { typeOnly: false }), {
        action: 'rewrite',
        to: { module: '@warp-drive/core', export: 'Store' },
      });
    });

    it('marks a rewrite into a private module', () => {
      assert.deepStrictEqual(map.resolve('@ember-data/store/-private', 'coerceId'), {
        action: 'rewrite',
        to: { module: '@warp-drive/core/store/-private', export: 'coerceId' },
        reason: 'private-target',
      });
    });

    it('applies a judged decision for a declaration the diffs could not follow', () => {
      assert.deepStrictEqual(map.resolve('@ember-data/store', 'CacheHandler'), {
        action: 'rewrite',
        to: { module: '@warp-drive/core', export: 'CacheHandler' },
      });
    });

    it('reports a judged removal with its PR, its shim and the links', () => {
      const decision = map.resolve('@ember-data/adapter/error', 'errorsArrayToHash');
      assert.strictEqual(decision.action, 'report');
      assert.strictEqual(decision.reason, 'removed');
      assert.strictEqual(decision.removedIn, '#8550');
      assert.match(decision.shim, /^export function errorsArrayToHash\(errors\) \{/);
      assert.deepStrictEqual(
        decision.links.map((link) => link.url),
        [
          'https://warp-drive.io/upgrading/v5/',
          'https://warp-drive.io/api/',
          'https://request-service-cheat-sheet.netlify.app',
        ]
      );
    });

    it('reports an unresolved removal without a PR or a shim', () => {
      const decision = map.resolve('@ember-data/store', 'normalizeModelName');
      assert.strictEqual(decision.reason, 'removed');
      assert.strictEqual(decision.removedIn, undefined);
      assert.strictEqual(decision.shim, undefined);
    });

    it('reports a name the from release did not export', () => {
      assert.deepStrictEqual(map.resolve('@ember-data/store', 'Nope'), { action: 'report', reason: 'untracked' });
    });

    it('reports a value import of a value that is only a type now, and rewrites a type import of it', () => {
      assert.deepStrictEqual(map.resolve('@ember-data/model/-private', 'ManyArray', { typeOnly: false }), {
        action: 'report',
        reason: 'type-only',
        to: { module: '@warp-drive/legacy/model', export: 'ManyArray' },
      });
      assert.deepStrictEqual(map.resolve('@ember-data/model/-private', 'ManyArray', { typeOnly: true }), {
        action: 'rewrite',
        to: { module: '@warp-drive/legacy/model', export: 'ManyArray' },
      });
    });

    it('reports a module preferences.json names, for every import of it', () => {
      for (const name of ['default', 'Anything', '*']) {
        const decision = map.resolve('ember-data/store', name);
        assert.strictEqual(decision.reason, 'side-effect');
        assert.deepStrictEqual(decision.links, [
          { title: 'In-place upgrade guide', url: 'https://warp-drive.io/upgrading/v5/' },
        ]);
      }
    });

    it('keeps modules the from release did not have and exports that did not move', () => {
      assert.deepStrictEqual(map.resolve('lodash', 'debounce'), { action: 'keep' });
      assert.deepStrictEqual(map.resolve('@warp-drive/core', 'Store'), { action: 'keep' });
      assert.deepStrictEqual(
        loadMap({ dataDir: FIXTURE, from: '5.9', to: '5.9' }).resolve('@warp-drive/core', 'Store'),
        {
          action: 'keep',
        }
      );
    });

    it('returns frozen decisions', () => {
      const decision = map.resolve('@ember-data/store', 'default');
      assert.ok(Object.isFrozen(decision) && Object.isFrozen(decision.to));
    });
  });

  describe('stale decisions', () => {
    const dir = copyFixture('mapping-stale-');
    let decisions;
    let map;
    before(() => {
      const file = path.join(dir, 'decisions', '4.12.8.json');
      decisions = JSON.parse(fs.readFileSync(file, 'utf8'));
      const identifierArray = decisions.entries.find((entry) => entry.source.export === 'IdentifierArray');
      identifierArray.choice = { module: '@warp-drive/core/store/-private', export: 'NoSuchArray' };
      decisions.entries.push(
        { decl: 'packages/store/src/-private/gone.ts#Gone', source: null, choice: null },
        { ...decisions.entries[0] }
      );
      fs.writeFileSync(file, JSON.stringify(decisions));
      map = loadMap({ dataDir: dir, from: '4.12', to: '5.9' });
    });

    it('lists every entry it could not apply, with the reason', () => {
      assert.deepStrictEqual(
        map.stale.map(({ decl, reason }) => [decl, reason]),
        [
          ['packages/store/src/-private/record-arrays/identifier-array.ts#default', 'choice-not-in-to'],
          ['packages/store/src/-private/gone.ts#Gone', 'decl-not-in-from'],
          [decisions.entries[0].decl, 'duplicate'],
        ]
      );
    });

    it('treats the token of a stale decision as unresolved and still applies the others', () => {
      assert.deepStrictEqual(map.resolve('@ember-data/store/-private', 'IdentifierArray'), {
        action: 'report',
        reason: 'removed',
        links: map.resolve('@ember-data/store', 'normalizeModelName').links,
      });
      assert.strictEqual(map.resolve('@ember-data/adapter/error', 'errorsArrayToHash').removedIn, '#8550');
      assert.strictEqual(map.resolve('@ember-data/store', 'CacheHandler').action, 'rewrite');
    });

    it('finds none in the fixture data', () => {
      assert.deepStrictEqual(loadMap({ dataDir: FIXTURE, from: '4.12', to: '5.9' }).stale, []);
    });
  });

  describe('the data this plugin ships', () => {
    const shipped = fs.existsSync(path.join(SHIPPED, 'releases.json'));
    (shipped ? it : it.skip)('loads every (from, to) pair without stale decisions', () => {
      const versions = listReleases();
      for (const [i, from] of versions.entries()) {
        for (const to of versions.slice(i)) {
          const map = loadMap({ from, to });
          assert.deepStrictEqual(map.stale, [], `stale decisions for ${from} -> ${to}`);
          assert.deepStrictEqual(map.resolve('lodash', 'debounce'), { action: 'keep' });
        }
      }
    });
  });
});
