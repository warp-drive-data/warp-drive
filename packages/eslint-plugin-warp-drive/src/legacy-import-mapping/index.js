'use strict';

const fs = require('fs');
const path = require('path');

/** @typedef {{ module: string, export: string, typeOnly: boolean }} Token */
/** @typedef {{ at: string, to: Token | null, note?: string }} Hop */

/**
 * What became of one token between the map's `from` release and its `to` release.
 * `hops` is present only when more than one release changed the token.
 *
 * Precedence when the data could be read two ways: removed, then legacy, then unchanged, then
 * moved. A token a legacy package declares and never moved is `legacy`, not `unchanged`.
 *
 * @typedef {{ outcome: 'moved', to: Token, note?: string, hops?: Hop[] }
 *        | { outcome: 'unchanged', to: Token }
 *        | { outcome: 'legacy', to: Token, hops?: Hop[] }
 *        | { outcome: 'removed', at: string, note?: string, hops?: Hop[] }} Relocation
 */

/**
 * The loaded map.
 *
 * `lookup(module, name)` answers for one imported name. `name` is a binding name or "default".
 * Null means the map says nothing about the token, which is the common case for an ordinary
 * import and the one a consumer must treat as silence.
 *
 * `moduleMove(module)` answers the module-level question from the file's "*" entry: where the
 * module itself went. It is the only sound basis for routing a name the map does not list
 * individually, and it never answers with a legacy target. Null when the module has no
 * wholesale destination (it enumerates its exports, or it split).
 *
 * `knows(module)` is true when the from-release exported anything from `module`, so a consumer
 * can tell "no entry because foreign" from "no entry because untracked".
 *
 * @typedef {object} ExportMap
 * @property {string} from
 * @property {string} to
 * @property {(module: string, name: string) => Relocation | null} lookup
 * @property {(module: string) => Token | null} moduleMove
 * @property {(module: string) => boolean} knows
 */

/** @type {Map<string, ExportMap>} */
const cache = new Map();

/**
 * From-releases this plugin ships a map for, oldest first. The oldest is every consumer's default.
 * @returns {string[]}
 */
function listFromVersions() {
  return require('./versions.json');
}

/**
 * Load the map from `from` to this plugin's own release.
 * @param {string} [from]  defaults to the oldest shipped release
 * @returns {ExportMap}
 * @throws {Error} naming the shipped versions when `from` is not one of them
 */
function loadMap(from = listFromVersions()[0]) {
  const versions = listFromVersions();
  if (!versions.includes(from)) {
    throw new Error(`unknown from-version "${from}"; shipped: ${versions.join(', ')}`);
  }
  const cached = cache.get(from);
  if (cached) return cached;

  const file = JSON.parse(fs.readFileSync(path.join(__dirname, `${from}.json`), 'utf8'));
  const byKey = new Map(file.entries.map((entry) => [`${entry.module}::${entry.export}`, entry]));
  const legacy = new Set(file.legacyModules);
  const known = new Set(file.entries.map((entry) => entry.module));

  /** @type {ExportMap} */
  const map = {
    from: file.from,
    to: file.to,
    lookup: (module, name) => relocationOf(byKey.get(`${module}::${name}`), legacy, file.to),
    moduleMove: (module) => {
      const star = byKey.get(`${module}::*`);
      return star && star.to && !legacy.has(star.to.module) ? star.to : null;
    },
    knows: (module) => known.has(module),
  };
  cache.set(from, map);
  return map;
}

/**
 * @param {object | undefined} entry
 * @param {Set<string>} legacy
 * @param {string} to  the map's to-version, the removal version when the entry has no hops
 * @returns {Relocation | null}
 */
function relocationOf(entry, legacy, to) {
  if (!entry) return null;
  const hops = entry.hops;
  if (entry.to === null) {
    const died = hops && hops.find((hop) => hop.to === null);
    return withOptional({ outcome: 'removed', at: died ? died.at : to }, { note: entry.note, hops });
  }
  if (legacy.has(entry.to.module)) return withOptional({ outcome: 'legacy', to: entry.to }, { hops });
  if (entry.to.module === entry.module && entry.to.export === entry.export && entry.to.typeOnly === entry.typeOnly) {
    return { outcome: 'unchanged', to: entry.to };
  }
  return withOptional({ outcome: 'moved', to: entry.to }, { note: entry.note, hops });
}

function withOptional(base, optional) {
  for (const [key, value] of Object.entries(optional)) {
    if (value !== undefined) base[key] = value;
  }
  return base;
}

module.exports = { listFromVersions, loadMap };
