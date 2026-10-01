'use strict';

/**
 * The stages and the ranking of the public exports mapping
 * (`scripts/public-exports-mapping/CONTRACT.md`, "Stages and ranking"). This file is the one
 * implementation: the plugin's reader (`./index.js`) requires it, and
 * `scripts/public-exports-mapping/map.mjs` loads it through `createRequire`.
 *
 * Everything here works on JSON that is already parsed. Nothing reads files, calls the network
 * or depends on another package.
 */

/**
 * @typedef {{ kind: 'value' | 'type', decl: string, deprecated?: true }} ExportRecord
 * @typedef {{ package: string, entry?: string, forward: string | null, exports: Record<string, ExportRecord> }} ModuleRecord
 * @typedef {{ schema: 1, kind: 'surface', version: string, tag?: string | null, packages?: Record<string, unknown>, modules: Record<string, ModuleRecord> }} Surface
 * @typedef {{ added: Record<string, any>, removed: string[], changed: Record<string, Record<string, unknown>> }} RecordChanges
 * @typedef {{ schema: 1, kind: 'diff', from: string, to: string, packages?: RecordChanges, modules: RecordChanges, exports: Record<string, RecordChanges>, declarations: Record<string, string | null> }} Diff
 * @typedef {{ module: string, export: string }} Target
 * @typedef {{ decl: string, source?: Target, choice: Target | null, removedIn?: string, shim?: string }} DecisionEntry
 * @typedef {{ schema: 1, kind: 'decisions', from: string, to: string, entries: DecisionEntry[] }} DecisionsFile
 * @typedef {{ schema: 1, audience?: string, tieBreak?: string[], report?: Record<string, string> }} Preferences
 * @typedef {{ title: string, url: string }} Link
 * @typedef {{ schema: 1, kind: 'messages', links: Record<string, Link>, reasons: Record<string, string[]> }} Messages
 * @typedef {{ schema: 1, baseline: string, releases: string[] }} Releases
 * @typedef {{ module: string, export: string, kind: 'value' | 'type', decl: string, deprecated: boolean, package: string }} Token
 * @typedef {{ action: 'keep' }
 *   | { action: 'rewrite', to: Target, reason?: 'private-target' }
 *   | { action: 'report', reason: string, to?: Target, removedIn?: string, shim?: string, links?: Link[] }} Decision
 * @typedef {{ decl: string, source: Target | null, choice: Target | null, reason: 'decl-not-in-from' | 'choice-not-in-to' | 'unknown-to' | 'duplicate' }} StaleDecision
 */

/** Reasons a `preferences.report` entry or the decision procedure can report. */
const REPORT_REASONS = Object.freeze(['removed', 'untracked', 'type-only', 'side-effect']);

const KEEP = Object.freeze({ action: 'keep' });

// ---------------------------------------------------------------------------------------------
// Modules and packages
// ---------------------------------------------------------------------------------------------

/**
 * The package a bare module specifier belongs to: the scope and name for a scoped package, else
 * the first segment.
 * @param {string} module
 * @returns {string}
 */
function packageOf(module) {
  const segments = module.split('/');
  return module.startsWith('@') ? segments.slice(0, 2).join('/') : segments[0];
}

/**
 * A module is public unless any path segment is `-private` or starts with `-`.
 * @param {string} module
 */
function isPublicModule(module) {
  return !module.split('/').some((segment) => segment.startsWith('-'));
}

/**
 * The old contract is the `ember-data` package and every `@ember-data/*` package.
 * @param {string} pkg
 */
function isOldContract(pkg) {
  return pkg === 'ember-data' || pkg.startsWith('@ember-data/');
}

/**
 * Path segments below the package: `@warp-drive/core` has none, `@warp-drive/core/store/-private`
 * has two. A scope is part of the package name, not a path segment.
 * @param {string} module
 * @param {string} [pkg]
 */
function pathSegments(module, pkg = packageOf(module)) {
  const base = module === pkg || module.startsWith(`${pkg}/`) ? pkg : packageOf(module);
  return module === base ? 0 : module.slice(base.length + 1).split('/').length;
}

// ---------------------------------------------------------------------------------------------
// Versions
// ---------------------------------------------------------------------------------------------

const VERSION = /^v?(\d+)\.(\d+)(?:\.\d+)?(?:[-+].*)?$/;

/**
 * `major.minor` of a version string (`5.10.0-alpha.13` is `5.10`), or `null` when it is not one.
 * @param {string} version
 * @returns {string | null}
 */
function minorOf(version) {
  const match = VERSION.exec(String(version));
  return match ? `${Number(match[1])}.${Number(match[2])}` : null;
}

/**
 * @param {string} a  a `major.minor`
 * @param {string} b  a `major.minor`
 */
function compareMinors(a, b) {
  const [aMajor, aMinor] = a.split('.').map(Number);
  const [bMajor, bMinor] = b.split('.').map(Number);
  return aMajor - bMajor || aMinor - bMinor;
}

// ---------------------------------------------------------------------------------------------
// Diffs
// ---------------------------------------------------------------------------------------------

/**
 * Attributes a record always carries. In a `changed` entry `null` means "absent in `b`" unless
 * the attribute is one of these, where `null` is the value itself (a module's `forward`).
 */
const ALWAYS = {
  package: new Set(['dir', 'modules']),
  module: new Set(['package', 'entry', 'forward']),
  export: new Set(['kind', 'decl']),
};

/**
 * @template T
 * @param {T} value
 * @returns {T}
 */
function clone(value) {
  return value === undefined ? value : JSON.parse(JSON.stringify(value));
}

/**
 * Applies one section of a diff to a map of records, in place.
 * @param {Record<string, any>} records
 * @param {RecordChanges | undefined} changes
 * @param {'package' | 'module' | 'export'} what
 * @param {string} where  for error messages
 */
function applyChanges(records, changes, what, where) {
  if (!changes) return;
  for (const name of changes.removed || []) {
    if (!Object.hasOwn(records, name)) throw new Error(`${where}: cannot remove ${what} ${name}, it does not exist`);
    delete records[name];
  }
  for (const [name, record] of Object.entries(changes.added || {})) {
    if (Object.hasOwn(records, name)) throw new Error(`${where}: cannot add ${what} ${name}, it exists`);
    records[name] = clone(record);
    if (what === 'module' && !records[name].exports) records[name].exports = {};
  }
  for (const [name, changed] of Object.entries(changes.changed || {})) {
    if (!Object.hasOwn(records, name)) throw new Error(`${where}: cannot change ${what} ${name}, it does not exist`);
    for (const [key, value] of Object.entries(changed)) {
      if (value === null && !ALWAYS[what].has(key)) delete records[name][key];
      else records[name][key] = clone(value);
    }
  }
}

/**
 * Rebuilds surface `b` from surface `a` and the diff from `a` to `b`. A diff is complete, so the
 * result equals `surfaces/<b>.json`. Throws when the diff does not apply.
 * @param {Surface} surface
 * @param {Diff} diff
 * @returns {Surface}
 */
function applyDiff(surface, diff) {
  const where = `diff ${diff.from}-${diff.to}`;
  if (diff.kind !== 'diff' || diff.from !== surface.version) {
    throw new Error(`${where}: does not apply to surface ${surface.version}`);
  }
  const next = clone(surface);
  next.version = diff.to;
  next.tag = diff.to === 'head' ? null : `v${diff.to}`;
  if (diff.packages) applyChanges((next.packages = next.packages || {}), diff.packages, 'package', where);
  applyChanges(next.modules, diff.modules, 'module', where);
  for (const [module, changes] of Object.entries(diff.exports || {})) {
    if (!Object.hasOwn(next.modules, module)) throw new Error(`${where}: exports of ${module}, a module it lacks`);
    applyChanges(next.modules[module].exports, changes, 'export', `${where} ${module}`);
  }
  return next;
}

// ---------------------------------------------------------------------------------------------
// Ranking
// ---------------------------------------------------------------------------------------------

/**
 * @param {string} a
 * @param {string} b
 */
function compareText(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}

/**
 * @param {string} module
 * @param {Preferences} preferences
 */
function tieBreakRank(module, preferences) {
  const list = (preferences && preferences.tieBreak) || [];
  const index = list.indexOf(module);
  return index === -1 ? list.length : index;
}

/**
 * The ranking rules, in order; the first that separates two candidates wins. `source` is the
 * token being mapped.
 * @type {ReadonlyArray<{ rule: number, name: string, compare: (a: Token, b: Token, source: Target, preferences: Preferences) => number }>}
 */
const RANKING = Object.freeze([
  { rule: 1, name: 'public', compare: (a, b) => Number(!isPublicModule(a.module)) - Number(!isPublicModule(b.module)) },
  { rule: 2, name: 'modern', compare: (a, b) => Number(isOldContract(a.package)) - Number(isOldContract(b.package)) },
  {
    rule: 3,
    name: 'fewer-segments',
    compare: (a, b) => pathSegments(a.module, a.package) - pathSegments(b.module, b.package),
  },
  { rule: 4, name: 'not-deprecated', compare: (a, b) => Number(a.deprecated) - Number(b.deprecated) },
  { rule: 5, name: 'value', compare: (a, b) => Number(a.kind !== 'value') - Number(b.kind !== 'value') },
  {
    rule: 6,
    name: 'same-name',
    compare: (a, b, source) => Number(a.export !== source.export) - Number(b.export !== source.export),
  },
  {
    rule: 7,
    name: 'tie-break',
    compare: (a, b, source, preferences) => tieBreakRank(a.module, preferences) - tieBreakRank(b.module, preferences),
  },
  {
    rule: 8,
    name: 'alphabetical',
    compare: (a, b) => compareText(a.module, b.module) || compareText(a.export, b.export),
  },
]);

/**
 * The first ranking rule that separates `a` and `b`, or `null` for the same token.
 * @param {Token} a
 * @param {Token} b
 * @param {Target} source
 * @param {Preferences} preferences
 * @returns {{ rule: number, name: string, order: number } | null}
 */
function separatingRule(a, b, source, preferences) {
  for (const { rule, name, compare } of RANKING) {
    const order = compare(a, b, source, preferences);
    if (order !== 0) return { rule, name, order: Math.sign(order) };
  }
  return null;
}

/**
 * Negative when `a` ranks before `b`.
 * @param {Token} a
 * @param {Token} b
 * @param {Target} source
 * @param {Preferences} preferences
 */
function compareCandidates(a, b, source, preferences) {
  const separated = separatingRule(a, b, source, preferences);
  return separated ? separated.order : 0;
}

/**
 * The candidates, best home first.
 * @param {Token[]} candidates
 * @param {Target} source
 * @param {Preferences} preferences
 * @returns {Token[]}
 */
function rankCandidates(candidates, source, preferences) {
  return [...candidates].sort((a, b) => compareCandidates(a, b, source, preferences));
}

// ---------------------------------------------------------------------------------------------
// Data sets
// ---------------------------------------------------------------------------------------------

/**
 * @param {any} files  an array of parsed files, or an object whose values are parsed files
 * @param {(file: any) => string} keyOf
 * @param {string} what
 * @returns {Map<string, any>}
 */
function indexFiles(files, keyOf, what) {
  /** @type {Map<string, any>} */
  const index = new Map();
  if (!files) return index;
  for (const file of Array.isArray(files) ? files : Object.values(files)) {
    const key = keyOf(file);
    if (index.has(key)) throw new Error(`two ${what} files for ${key}`);
    index.set(key, file);
  }
  return index;
}

/**
 * @param {Preferences | undefined} preferences
 * @returns {Preferences}
 */
function checkPreferences(preferences) {
  const result = preferences || { schema: 1 };
  for (const [module, reason] of Object.entries(result.report || {})) {
    if (!REPORT_REASONS.includes(reason)) {
      throw new Error(`preferences.json reports ${module} as "${reason}"; known reasons: ${REPORT_REASONS.join(', ')}`);
    }
  }
  return result;
}

/**
 * Everything a map needs, indexed once and shared by every map built from it.
 * @param {{
 *   releases: Releases,
 *   surfaces: Surface[] | Record<string, Surface>,
 *   diffs?: Diff[] | Record<string, Diff>,
 *   decisions?: DecisionsFile[] | Record<string, DecisionsFile>,
 *   preferences?: Preferences,
 *   messages?: Messages,
 *   headVersion?: string,
 * }} data  `surfaces` needs the baseline; later ones are rebuilt from the diffs when missing.
 *   `headVersion` is the version `head` stands for, so that its minor can be named.
 */
function createDataset(data) {
  const { releases } = data;
  if (!releases || !Array.isArray(releases.releases) || !releases.releases.includes(releases.baseline)) {
    throw new Error('releases.json must list the baseline among its releases');
  }
  const diffs = indexFiles(data.diffs, (diff) => `${diff.from}-${diff.to}`, 'diff');
  const surfaces = indexFiles(data.surfaces, (surface) => surface.version, 'surface');
  const versions = releases.releases.slice(releases.releases.indexOf(releases.baseline));
  const last = versions[versions.length - 1];
  if (diffs.has(`${last}-head`) || surfaces.has('head')) versions.push('head');
  return {
    releases,
    versions,
    surfaces,
    diffs,
    decisions: indexFiles(data.decisions, (file) => file.from, 'decisions'),
    preferences: checkPreferences(data.preferences),
    messages: data.messages,
    headMinor: data.headVersion ? minorOf(data.headVersion) : null,
    /** @type {Map<string, Surface>} */
    rebuilt: new Map(),
    /** @type {WeakMap<Surface, Map<string, Token[]>>} */
    indexes: new WeakMap(),
  };
}

/** @typedef {ReturnType<typeof createDataset>} Dataset */

/**
 * The version key a `from` or `to` option names: `head`, a release, or a `major.minor` (any patch
 * or prerelease of it). A minor between two releases means the older one, because a release is
 * listed only when it moved or removed an export. Throws for a version before the baseline,
 * after the newest version the data covers, or not a version at all.
 * @param {Dataset} dataset
 * @param {string} input
 * @returns {string}
 */
function resolveVersion(dataset, input) {
  const { versions, headMinor } = dataset;
  const releases = versions.filter((version) => version !== 'head');
  const hasHead = versions.includes('head');
  const shipped = `known: ${releases.map(minorOf).join(', ')}${hasHead && headMinor ? `, ${headMinor} (head)` : ''}`;
  if (input === 'head') {
    if (hasHead) return 'head';
    throw new Error(`no data for "head"; ${shipped}`);
  }
  if (releases.includes(input)) return input;
  const minor = minorOf(input);
  if (!minor) throw new Error(`"${input}" is not a version; ${shipped}`);
  const same = releases.find((version) => minorOf(version) === minor);
  if (same) return same;
  if (hasHead && headMinor === minor) return 'head';
  const newest = hasHead && headMinor ? headMinor : /** @type {string} */ (minorOf(releases[releases.length - 1]));
  const below = releases.filter((version) => compareMinors(/** @type {string} */ (minorOf(version)), minor) < 0);
  if (!below.length || compareMinors(minor, newest) > 0) throw new Error(`no data for ${input}; ${shipped}`);
  return below[below.length - 1];
}

/**
 * @param {Dataset} dataset
 * @param {string} from
 * @param {string} to
 * @returns {Diff[]}
 */
function diffsBetween(dataset, from, to) {
  const start = dataset.versions.indexOf(from);
  const end = dataset.versions.indexOf(to);
  if (start === -1 || end === -1) throw new Error(`unknown version ${start === -1 ? from : to}`);
  /** @type {Diff[]} */
  const result = [];
  for (let i = start; i < end; i++) {
    const key = `${dataset.versions[i]}-${dataset.versions[i + 1]}`;
    const diff = dataset.diffs.get(key);
    if (!diff) throw new Error(`missing diffs/${key}.json`);
    result.push(diff);
  }
  return result;
}

/**
 * The surface of `version`: the given one, else rebuilt from the one before it.
 * @param {Dataset} dataset
 * @param {string} version
 * @returns {Surface}
 */
function surfaceAt(dataset, version) {
  const given = dataset.surfaces.get(version);
  if (given) return given;
  const cached = dataset.rebuilt.get(version);
  if (cached) return cached;
  const index = dataset.versions.indexOf(version);
  if (index <= 0) throw new Error(`no surface for ${version}`);
  const previous = dataset.versions[index - 1];
  const surface = applyDiff(surfaceAt(dataset, previous), diffsBetween(dataset, previous, version)[0]);
  dataset.rebuilt.set(version, surface);
  return surface;
}

/**
 * Stage 1: follows declaration `decl` of surface `from` through the `declarations` of every
 * diff up to `to`, pair by pair. An id a diff does not list keeps its id. When a pair maps the id
 * to `null`, the id is looked up verbatim in the surfaces of the later versions up to `to`, in
 * order, and the chain resumes from the first that declares it: 4.12 carried backports that
 * 5.0.1 lacks and a later 5.x declares again under the same id. Only when none does is the
 * result `null`.
 * @param {Dataset} dataset
 * @param {string} decl
 * @param {string} from
 * @param {string} to
 * @returns {string | null}
 */
function followDeclaration(dataset, decl, from, to) {
  const { versions } = dataset;
  const end = versions.indexOf(to);
  let index = versions.indexOf(from);
  if (index === -1 || end === -1) throw new Error(`unknown version ${index === -1 ? from : to}`);
  let current = decl;
  while (index < end) {
    const [diff] = diffsBetween(dataset, versions[index], versions[index + 1]);
    const declarations = diff.declarations || {};
    const next = Object.hasOwn(declarations, current) ? declarations[current] : current;
    if (next !== null) {
      current = next;
      index++;
      continue;
    }
    let resumed = -1;
    for (let later = index + 1; later <= end; later++) {
      if (tokensByDecl(dataset, surfaceAt(dataset, versions[later])).has(current)) {
        resumed = later;
        break;
      }
    }
    if (resumed === -1) return null;
    index = resumed;
  }
  return current;
}

/**
 * Every token of a surface, by declaration id.
 * @param {Dataset} dataset
 * @param {Surface} surface
 * @returns {Map<string, Token[]>}
 */
function tokensByDecl(dataset, surface) {
  let index = dataset.indexes.get(surface);
  if (!index) {
    index = new Map();
    for (const [module, record] of Object.entries(surface.modules)) {
      const pkg = record.package || packageOf(module);
      for (const [name, exported] of Object.entries(record.exports || {})) {
        /** @type {Token} */
        const token = {
          module,
          export: name,
          kind: exported.kind,
          decl: exported.decl,
          deprecated: exported.deprecated === true,
          package: pkg,
        };
        const list = index.get(exported.decl);
        if (list) list.push(token);
        else index.set(exported.decl, [token]);
      }
    }
    dataset.indexes.set(surface, index);
  }
  return index;
}

/**
 * @param {Surface} surface
 * @param {Target} target
 */
function exportOf(surface, target) {
  const record = surface.modules[target.module];
  return record && Object.hasOwn(record.exports, target.export) ? record.exports[target.export] : undefined;
}

/**
 * The entries of `decisions/<from>.json` that cannot be applied: a `decl` the `from` surface does
 * not declare, a `choice` the `to` surface does not export, a `to` the data does not cover, or a
 * second entry for one `decl`.
 * @param {Dataset} dataset
 * @param {DecisionsFile} file
 * @returns {StaleDecision[]}
 */
function staleDecisions(dataset, file) {
  const fromDecls = tokensByDecl(dataset, surfaceAt(dataset, file.from));
  /** @type {Surface | null} */
  let toSurface;
  try {
    toSurface = dataset.versions.includes(file.to) ? surfaceAt(dataset, file.to) : null;
  } catch {
    toSurface = null;
  }
  /** @type {StaleDecision[]} */
  const stale = [];
  const seen = new Set();
  for (const entry of file.entries || []) {
    const base = { decl: entry.decl, source: entry.source || null, choice: entry.choice || null };
    if (seen.has(entry.decl)) stale.push({ ...base, reason: 'duplicate' });
    else if (!fromDecls.has(entry.decl)) stale.push({ ...base, reason: 'decl-not-in-from' });
    else if (entry.choice && !toSurface) stale.push({ ...base, reason: 'unknown-to' });
    else if (entry.choice && toSurface && !exportOf(toSurface, entry.choice)) {
      stale.push({ ...base, reason: 'choice-not-in-to' });
    }
    seen.add(entry.decl);
  }
  return stale;
}

// ---------------------------------------------------------------------------------------------
// Maps
// ---------------------------------------------------------------------------------------------

/**
 * @param {Decision} decision
 * @returns {Decision}
 */
function freeze(decision) {
  if ('to' in decision && decision.to) Object.freeze(decision.to);
  if ('links' in decision && decision.links) Object.freeze(decision.links);
  return Object.freeze(decision);
}

/**
 * The map from release `from` to release `to`: for every import written against `from`, what to
 * do with it so that it works against `to`.
 * @param {Dataset} dataset
 * @param {{ from: string, to: string }} pair  version keys, as `resolveVersion` returns them
 */
function createMap(dataset, { from, to }) {
  const fromIndex = dataset.versions.indexOf(from);
  const toIndex = dataset.versions.indexOf(to);
  if (fromIndex === -1) throw new Error(`unknown from-version ${from}`);
  if (toIndex === -1) throw new Error(`unknown to-version ${to}`);
  if (fromIndex > toIndex) throw new Error(`from ${from} is newer than to ${to}`);

  const { preferences } = dataset;
  const reported = preferences.report || {};
  const fromSurface = surfaceAt(dataset, from);
  const toSurface = surfaceAt(dataset, to);
  const toTokens = tokensByDecl(dataset, toSurface);
  const decisionsFile = dataset.decisions.get(from);

  /** @type {Map<string, string | null>} */
  const followed = new Map();
  /** @param {string} decl */
  function follow(decl) {
    if (!followed.has(decl)) followed.set(decl, followDeclaration(dataset, decl, from, to));
    return /** @type {string | null} */ (followed.get(decl));
  }

  /** @type {StaleDecision[] | undefined} */
  let stale;
  /** @type {Map<string, DecisionEntry> | undefined} */
  let decisionByDecl;
  function decisionIndex() {
    if (!decisionByDecl) {
      decisionByDecl = new Map();
      if (decisionsFile) {
        stale = staleDecisions(dataset, decisionsFile);
        const unusable = new Set(stale.filter((s) => s.reason !== 'duplicate').map((s) => s.decl));
        for (const entry of decisionsFile.entries || []) {
          if (!unusable.has(entry.decl) && !decisionByDecl.has(entry.decl)) decisionByDecl.set(entry.decl, entry);
        }
      } else {
        stale = [];
      }
    }
    return decisionByDecl;
  }

  /** @type {Map<string, string[]> | undefined} */
  let backwards;
  /**
   * The declarations of the `to` surface that continue as `decl` in a later version.
   * @param {string} decl  an id in the surface of `later`
   * @param {string} later
   */
  function predecessorsOf(decl, later) {
    if (!backwards) {
      backwards = new Map();
      for (const id of toTokens.keys()) {
        const next = followDeclaration(dataset, id, to, later);
        if (next === null) continue;
        const list = backwards.get(next);
        if (list) list.push(id);
        else backwards.set(next, [id]);
      }
    }
    return backwards.get(decl) || [];
  }

  /**
   * Stage 3: the candidates a judged decision gives for `entry.decl` in the `to` surface. The
   * choice names a token of the decision's own `to`; for a map with another `to`, the choice's
   * declaration is followed forward or backward through the diffs, and the choice itself is
   * preferred when it is among the result.
   * @param {DecisionEntry} entry
   * @param {Target} source
   * @returns {Token[]}
   */
  function decisionCandidates(entry, source) {
    const choice = /** @type {Target} */ (entry.choice);
    const decidedTo = /** @type {DecisionsFile} */ (decisionsFile).to;
    if (decidedTo === to) {
      const exported = /** @type {ExportRecord} */ (exportOf(toSurface, choice));
      const pkg = toSurface.modules[choice.module].package || packageOf(choice.module);
      return [
        { ...choice, kind: exported.kind, decl: exported.decl, deprecated: exported.deprecated === true, package: pkg },
      ];
    }
    const decided = /** @type {ExportRecord} */ (exportOf(surfaceAt(dataset, decidedTo), choice));
    /** @type {string[]} */
    let decls;
    if (dataset.versions.indexOf(decidedTo) < toIndex) {
      const next = followDeclaration(dataset, decided.decl, decidedTo, to);
      decls = next === null ? [] : [next];
    } else {
      decls = predecessorsOf(decided.decl, decidedTo);
    }
    const candidates = decls.flatMap((decl) => toTokens.get(decl) || []);
    const exact = candidates.find((token) => token.module === choice.module && token.export === choice.export);
    const rest = rankCandidates(
      candidates.filter((token) => token !== exact),
      source,
      preferences
    );
    return exact ? [exact, ...rest] : rest;
  }

  /**
   * @typedef {{ via: 'declarations' | 'decision' | null, target: string | null, candidates: Token[], entry?: DecisionEntry }} Resolution
   * @type {Map<string, Resolution>}
   */
  const resolutions = new Map();
  /**
   * Stages 1 to 4 for one token of the `from` surface.
   * @param {string} module
   * @param {string} name
   * @returns {Resolution}
   */
  function resolveToken(module, name) {
    const key = `${module}\0${name}`;
    let resolution = resolutions.get(key);
    if (resolution) return resolution;
    const source = { module, export: name };
    const { decl } = fromSurface.modules[module].exports[name];
    const target = follow(decl);
    const found = target === null ? [] : toTokens.get(target) || [];
    if (found.length) {
      resolution = { via: 'declarations', target, candidates: rankCandidates(found, source, preferences) };
    } else {
      const entry = decisionIndex().get(decl);
      if (entry && entry.choice === null) resolution = { via: 'decision', target, candidates: [], entry };
      else if (entry) {
        const candidates = decisionCandidates(entry, source);
        resolution = candidates.length
          ? { via: 'decision', target, candidates, entry }
          : { via: null, target, candidates: [] };
      } else {
        resolution = { via: null, target, candidates: [] };
      }
    }
    resolutions.set(key, resolution);
    return resolution;
  }

  /**
   * @param {string} reason
   * @returns {Link[] | undefined}
   */
  function linksFor(reason) {
    const { messages } = dataset;
    const ids = messages && messages.reasons && messages.reasons[reason];
    if (!ids || !ids.length) return undefined;
    return ids.map((id) => {
      const link = messages.links[id];
      if (!link) throw new Error(`messages.json names an unknown link "${id}" for ${reason}`);
      return Object.freeze({ title: link.title, url: link.url });
    });
  }

  /**
   * @param {string} reason
   * @param {{ to?: Target, removedIn?: string, shim?: string }} [extra]
   * @returns {Decision}
   */
  function report(reason, extra = {}) {
    /** @type {any} */
    const decision = { action: 'report', reason };
    if (extra.to) decision.to = { module: extra.to.module, export: extra.to.export };
    if (extra.removedIn) decision.removedIn = extra.removedIn;
    if (extra.shim) decision.shim = extra.shim;
    const links = linksFor(reason);
    if (links) decision.links = links;
    return freeze(decision);
  }

  /**
   * @param {Target} target
   * @returns {Decision}
   */
  function rewrite(target) {
    /** @type {any} */
    const decision = { action: 'rewrite', to: { module: target.module, export: target.export } };
    if (!isPublicModule(target.module)) decision.reason = 'private-target';
    return freeze(decision);
  }

  /**
   * The decision for one named or default import (CONTRACT.md, the decision for an import).
   * @param {string} module
   * @param {string} name
   * @param {boolean} typeOnly
   * @returns {Decision}
   */
  function decideName(module, name, typeOnly) {
    const record = fromSurface.modules[module];
    const exported = Object.hasOwn(record.exports, name) ? record.exports[name] : undefined;
    if (!exported) {
      const forward = toSurface.modules[module] && toSurface.modules[module].forward;
      return forward ? rewrite({ module: forward, export: name }) : report('untracked');
    }
    const { candidates, entry } = resolveToken(module, name);
    if (!candidates.length) {
      return report('removed', entry ? { removedIn: entry.removedIn, shim: entry.shim } : {});
    }
    const [winner] = candidates;
    if (winner.module === module && winner.export === name) return KEEP;
    // A value import of something that was a value and is only a type now would break at runtime.
    if (!typeOnly && exported.kind === 'value' && winner.kind === 'type') return report('type-only', { to: winner });
    return rewrite(winner);
  }

  /**
   * A namespace import, or a side-effect import, depends on the module as a whole. It follows
   * the module's `forward` at `to`, or a move that takes every export of the module to one
   * other module under the same names; else it stays when the module still exists.
   * @param {string} module
   * @param {boolean} typeOnly
   * @returns {Decision}
   */
  function decideModule(module, typeOnly) {
    const after = toSurface.modules[module];
    if (after && after.forward) return rewrite({ module: after.forward, export: '*' });
    const names = Object.keys(fromSurface.modules[module].exports);
    /** @type {string | null} */
    let common = null;
    for (const name of names) {
      const decision = decideName(module, name, typeOnly);
      if (decision.action !== 'rewrite' || decision.to.export !== name) {
        common = null;
        break;
      }
      if (common !== null && common !== decision.to.module) {
        common = null;
        break;
      }
      common = decision.to.module;
    }
    if (common !== null) return rewrite({ module: common, export: '*' });
    return after ? KEEP : report('removed');
  }

  /** @type {Map<string, Decision>} */
  const decisions = new Map();
  /**
   * What to do with an import of `name` from `module`, written against `from`. `name` is an
   * export name, `default`, or `*` for a namespace or side-effect import.
   * @param {string} module
   * @param {string} name
   * @param {{ typeOnly?: boolean }} [options]
   * @returns {Decision}
   */
  function resolve(module, name, options) {
    const typeOnly = Boolean(options && options.typeOnly);
    const key = `${typeOnly ? 'type' : 'value'}\0${module}\0${name}`;
    let decision = decisions.get(key);
    if (!decision) {
      if (!Object.hasOwn(fromSurface.modules, module)) decision = KEEP;
      else if (Object.hasOwn(reported, module)) decision = report(reported[module]);
      else if (name === '*') decision = decideModule(module, typeOnly);
      else decision = decideName(module, name, typeOnly);
      decisions.set(key, decision);
    }
    return decision;
  }

  /**
   * @param {Token} token
   */
  function brief(token) {
    return { module: token.module, export: token.export, kind: token.kind };
  }

  /** @type {any[] | undefined} */
  let tokens;
  /** Every token of the `from` surface with its stages and its decision, by module and name. */
  function listTokens() {
    if (!tokens) {
      tokens = [];
      for (const module of Object.keys(fromSurface.modules).sort(compareText)) {
        const record = fromSurface.modules[module];
        for (const name of Object.keys(record.exports).sort(compareText)) {
          const { kind, decl } = record.exports[name];
          const resolution = resolveToken(module, name);
          const decision = resolve(module, name, { typeOnly: false });
          const typeOnlyDecision = resolve(module, name, { typeOnly: true });
          tokens.push({
            module,
            export: name,
            kind,
            decl,
            target: resolution.target,
            via: resolution.via,
            candidates: resolution.candidates.map(brief),
            decision,
            ...(JSON.stringify(typeOnlyDecision) === JSON.stringify(decision) ? {} : { typeOnlyDecision }),
          });
        }
      }
    }
    return tokens;
  }

  return {
    from,
    to,
    resolve,
    /** Entries of `decisions/<from>.json` that were not applied, and why. */
    get stale() {
      decisionIndex();
      return /** @type {StaleDecision[]} */ (stale);
    },
    /** Every token of the `from` surface with how it resolved and the decision for it. */
    get tokens() {
      return listTokens();
    },
    /**
     * Tokens that no declaration chain and no decision resolves, for the judge. Tokens of a
     * module `preferences.report` names are left out: they are reported whatever they map to.
     */
    get residue() {
      return listTokens()
        .filter((token) => token.via === null && !Object.hasOwn(reported, token.module))
        .map(({ module, export: name, kind, decl, target }) => ({ module, export: name, kind, decl, target }));
    },
  };
}

/**
 * `createDataset` and `createMap` in one call, for one `(from, to)`; `from` and `to` may be any
 * form `resolveVersion` accepts.
 * @param {Parameters<typeof createDataset>[0] & { from: string, to: string }} data
 */
function buildMap(data) {
  const dataset = createDataset(data);
  return createMap(dataset, { from: resolveVersion(dataset, data.from), to: resolveVersion(dataset, data.to) });
}

module.exports = {
  REPORT_REASONS,
  RANKING,
  applyDiff,
  buildMap,
  compareCandidates,
  createDataset,
  createMap,
  diffsBetween,
  followDeclaration,
  isOldContract,
  isPublicModule,
  minorOf,
  packageOf,
  pathSegments,
  rankCandidates,
  resolveVersion,
  separatingRule,
  staleDecisions,
  surfaceAt,
};
