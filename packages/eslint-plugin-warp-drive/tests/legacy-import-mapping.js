'use strict';

const assert = require('assert');
const fs = require('fs');
const { isDeepStrictEqual } = require('util');

const { listFromVersions, loadMap } = require('../src/legacy-import-mapping/index.js');
const { FIXTURE, keysByVersion } = require('./fixtures/legacy-import-decisions.js');

const REGENERATE =
  'if the change is intended, run `node tests/fixtures/legacy-import-decisions.js` and review the diff';

function decode(text) {
  const [action, target] = text.split(' ');
  if (action === 'rewrite') {
    const at = target.indexOf('::');
    return { action, to: { module: target.slice(0, at), export: target.slice(at + 2) } };
  }
  if (action === 'report') return { action, reason: target };
  return { action };
}

describe('legacy-import-mapping resolve', () => {
  const fixture = JSON.parse(fs.readFileSync(FIXTURE, 'utf8'));

  it('has a decision table for every shipped from-version', () => {
    assert.deepStrictEqual(Object.keys(fixture), listFromVersions(), REGENERATE);
  });

  for (const [version, keys] of keysByVersion()) {
    it(`covers every key of the ${version} map`, () => {
      const table = fixture[version] || {};
      const missing = keys.filter(([module, name]) => !(table[module] && name in table[module]));
      assert.deepStrictEqual(missing, [], REGENERATE);
    });

    it(`reproduces every recorded decision from ${version}`, () => {
      const map = loadMap(version);
      const mismatches = [];
      for (const [module, names] of Object.entries(fixture[version] || {})) {
        for (const [name, recorded] of Object.entries(names)) {
          const [value, type] = Array.isArray(recorded) ? recorded : [recorded, recorded];
          for (const [typeOnly, want] of [
            [false, value],
            [true, type],
          ]) {
            const got = map.resolve(module, name, { typeOnly });
            if (!isDeepStrictEqual(got, decode(want))) mismatches.push({ module, name, typeOnly, want, got });
          }
        }
      }
      assert.deepStrictEqual(mismatches, [], REGENERATE);
    });
  }
});
