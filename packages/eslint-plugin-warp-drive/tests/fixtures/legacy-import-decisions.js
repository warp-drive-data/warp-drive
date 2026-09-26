'use strict';

// Run with `node tests/fixtures/legacy-import-decisions.js` to rewrite the fixture after the maps change.

const fs = require('fs');
const path = require('path');

const { applyDelta } = require('../../src/legacy-import-mapping/delta.js');
const { listFromVersions, loadMap } = require('../../src/legacy-import-mapping/index.js');

const MAPS = path.join(__dirname, '../../src/legacy-import-mapping');
const FIXTURE = path.join(__dirname, 'legacy-import-decisions.json');
const UNTRACKED = 'NameNoReleaseExported';
const FOREIGN = ['lodash', 'ember-source', '@glimmer/component', '@warp-drive/not-a-module'];

/** Every `module::export` key of every shipped full map, keyed by from-version. */
function keysByVersion() {
  const result = new Map();
  let full;
  for (const version of listFromVersions()) {
    const file = JSON.parse(fs.readFileSync(path.join(MAPS, `${version}.json`), 'utf8'));
    full = full ? applyDelta(full, file) : file;
    result.set(
      version,
      full.entries.map((entry) => [entry.module, entry.export])
    );
  }
  return result;
}

/** @param {import('../../src/legacy-import-mapping').Decision} decision */
function encode(decision) {
  if (decision.action === 'rewrite') return `rewrite ${decision.to.module}::${decision.to.export}`;
  if (decision.action === 'report') return `report ${decision.reason}`;
  return 'keep';
}

/**
 * One string when value and type imports get the same decision, else `[value, type]`.
 * @returns {Record<string, Record<string, Record<string, string | [string, string]>>>}
 */
function decisions() {
  const table = {};
  for (const [version, keys] of keysByVersion()) {
    const map = loadMap(version);
    const byModule = {};
    const cases = [...keys, ...[...new Set(keys.map(([module]) => module))].map((m) => [m, UNTRACKED])];
    for (const module of FOREIGN) cases.push([module, 'default'], [module, UNTRACKED], [module, '*']);
    for (const [module, name] of cases) {
      const value = encode(map.resolve(module, name, { typeOnly: false }));
      const type = encode(map.resolve(module, name, { typeOnly: true }));
      (byModule[module] ||= {})[name] = value === type ? value : [value, type];
    }
    table[version] = byModule;
  }
  return table;
}

if (require.main === module) {
  fs.writeFileSync(FIXTURE, JSON.stringify(decisions(), null, 2) + '\n');
}

module.exports = { FIXTURE, decisions, keysByVersion };
