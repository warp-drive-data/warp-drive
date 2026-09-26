'use strict';

const fs = require('fs');
const path = require('path');

const { applyDelta } = require('./delta.js');

const KEEP = Object.freeze({ action: 'keep' });

/** @type {Map<string, import('./index').ExportMap>} */
const cache = new Map();
/** @type {Map<string, any>} */
const fullMaps = new Map();

function listFromVersions() {
  return require('./versions.json');
}

function readMap(version) {
  return JSON.parse(fs.readFileSync(path.join(__dirname, `${version}.json`), 'utf8'));
}

function fullMapOf(version, versions) {
  if (!fullMaps.has(version)) {
    const i = versions.indexOf(version);
    const file = readMap(version);
    if (i === 0) {
      if (file.kind !== 'merged' || file.from !== version) {
        throw new Error(`${version}.json must be the full merged map from ${version}`);
      }
      fullMaps.set(version, file);
    } else {
      if (file.kind !== 'merged-delta' || file.from !== version || file.base !== versions[i - 1]) {
        throw new Error(`${version}.json must be a merged-delta from ${version} against ${versions[i - 1]}`);
      }
      fullMaps.set(version, applyDelta(fullMapOf(versions[i - 1], versions), file));
    }
  }
  return fullMaps.get(version);
}

function loadMap(from = listFromVersions()[0]) {
  const versions = listFromVersions();
  if (!versions.includes(from)) {
    throw new Error(`unknown from-version "${from}"; shipped: ${versions.join(', ')}`);
  }
  const cached = cache.get(from);
  if (cached) return cached;

  const file = fullMapOf(from, versions);
  const byKey = new Map(file.entries.map((entry) => [`${entry.module}::${entry.export}`, entry]));
  const legacy = new Set(file.legacyModules);
  const known = new Set(file.entries.map((entry) => entry.module));

  /** @type {import('./index').ExportMap['resolve']} */
  function resolve(module, name, { typeOnly }) {
    const entry = byKey.get(`${module}::${name}`);
    if (entry) {
      if (entry.to === null) return name === '*' ? KEEP : { action: 'report', reason: 'removed' };
      if (legacy.has(entry.to.module)) return { action: 'report', reason: 'legacy' };
      // A value import of a name that lost its value would break at runtime whether or not it moves.
      if (!typeOnly && !entry.typeOnly && entry.to.typeOnly) return { action: 'report', reason: 'type-only' };
      if (entry.to.module === module && entry.to.export === name) return KEEP;
      return { action: 'rewrite', to: { module: entry.to.module, export: entry.to.export } };
    }
    // A module-level move carries names the from-release never exported, but never onto a legacy module.
    const star = byKey.get(`${module}::*`);
    if (star && star.to && !legacy.has(star.to.module)) {
      if (star.to.module === module) return KEEP;
      return { action: 'rewrite', to: { module: star.to.module, export: name } };
    }
    return known.has(module) ? { action: 'report', reason: 'untracked' } : KEEP;
  }

  const map = { from: file.from, to: file.to, resolve };
  cache.set(from, map);
  return map;
}

module.exports = { listFromVersions, loadMap };
