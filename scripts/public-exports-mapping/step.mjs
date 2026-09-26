import path from 'node:path';

import { parseModule } from './exports.mjs';
import { compareTokens, keyOf, sameToken, token } from './token.mjs';

const MAX_DEPTH = 8;

/**
 * @typedef {import('./token.mjs').Token & { to: import('./token.mjs').Token | null }} DerivedEntry
 */

/**
 * @typedef {DerivedEntry & { origin: 'manual', note: string }} ManualEntry
 */

/** @typedef {DerivedEntry | ManualEntry} StepEntry */

/**
 * @typedef {object} StepMap
 * @property {1} schema
 * @property {'step'} kind
 * @property {import('./token.mjs').Minor} from
 * @property {import('./token.mjs').Minor} to
 * @property {string[]} legacyModules
 * @property {StepEntry[]} entries
 */

/**
 * @typedef {object} Override
 * @property {string} module
 * @property {string} export
 * @property {{ module: string, export: string } | null} to
 * @property {string} note
 */

/**
 * @typedef {object} Overrides
 * @property {1} schema
 * @property {'overrides'} kind
 * @property {import('./token.mjs').Minor} from
 * @property {import('./token.mjs').Minor} to
 * @property {Override[]} entries
 */

/**
 * @typedef {object} Problem
 * @property {'unknown-source' | 'unknown-target' | 'duplicate' | 'redundant' | 'residual-chain'} kind
 * @property {string} detail
 */

export class ProblemsError extends Error {
  /**
   * @param {string} what
   * @param {Problem[]} problems
   */
  constructor(what, problems) {
    super(`${problems.length} ${what}`);
    this.problems = problems;
  }
}

/**
 * @param {import('./surface.mjs').Snapshot} from
 * @param {import('./surface.mjs').Surface} to
 * @param {Overrides | null} overrides
 * @returns {StepMap}
 * @throws {ProblemsError}
 */
export function deriveStep(from, to, overrides) {
  const resolve = createResolver(to);
  const toByKey = new Map(to.tokens.map((t) => [keyOf(t), t]));
  /** @type {Map<string, StepEntry>} */
  const byKey = new Map();
  for (const t of sourcesOf(from)) {
    byKey.set(keyOf(t), derived(t, resolve(t.module, t.export)));
  }

  /** @type {Problem[]} */
  const problems = [];
  const seen = new Set();
  for (const override of overrides?.entries ?? []) {
    const key = keyOf(override);
    const label = `${overrides.from}-${overrides.to}: ${key}`;
    if (seen.has(key)) {
      problems.push({ kind: 'duplicate', detail: `${label} is overridden twice` });
      continue;
    }
    seen.add(key);
    const current = byKey.get(key);
    if (!current) {
      problems.push({ kind: 'unknown-source', detail: `${label} is not a token of ${from.version}` });
      continue;
    }
    const target = override.to && toByKey.get(keyOf(override.to));
    if (override.to && !target) {
      problems.push({
        kind: 'unknown-target',
        detail: `${label} targets ${keyOf(override.to)}, not a token of ${to.version}`,
      });
      continue;
    }
    const resolved = target ? token(target.module, target.export, target.typeOnly) : null;
    if (sameToken(current.to, resolved)) {
      problems.push({
        kind: 'redundant',
        detail: `${label} is already derived from the shims; delete the override`,
      });
      continue;
    }
    byKey.set(key, manual(current, resolved, override.note));
  }
  if (problems.length) throw new ProblemsError('override(s) refused', problems);

  return {
    schema: 1,
    kind: 'step',
    from: from.version,
    to: to.version,
    legacyModules: to.legacyModules,
    entries: [...byKey.values()].sort(compareTokens),
  };
}

/**
 * @param {import('./surface.mjs').Snapshot} snapshot
 * @returns {import('./token.mjs').Token[]}
 */
export function sourcesOf(snapshot) {
  const starred = new Set(snapshot.tokens.filter((t) => t.export === '*').map((t) => t.module));
  const modules = new Set(snapshot.tokens.map((t) => t.module));
  const implicit = [...modules].filter((m) => !starred.has(m)).map((m) => token(m, '*', false));
  return [...snapshot.tokens, ...implicit];
}

/**
 * @param {import('./token.mjs').Token} source
 * @param {import('./token.mjs').Token | null} to
 * @returns {DerivedEntry}
 */
export function derived(source, to) {
  return { ...token(source.module, source.export, source.typeOnly), to };
}

/**
 * @param {import('./token.mjs').Token} source
 * @param {import('./token.mjs').Token | null} to
 * @param {string} note
 * @returns {ManualEntry}
 */
export function manual(source, to, note) {
  return { ...derived(source, to), origin: 'manual', note };
}

/**
 * @param {import('./surface.mjs').Surface} to
 * @returns {(module: string, name: string) => import('./token.mjs').Token | null}
 */
function createResolver(to) {
  const legacy = new Set(to.legacyModules);
  const tokensByModule = new Map();
  for (const t of to.tokens) {
    if (!tokensByModule.has(t.module)) tokensByModule.set(t.module, new Map());
    tokensByModule.get(t.module).set(t.export, t);
  }
  const moduleByFile = new Map([...to.fileOf].map(([module, file]) => [file, module]));
  const shims = new Map();

  function shimOf(filePath) {
    if (!shims.has(filePath)) shims.set(filePath, parseModule(filePath));
    return shims.get(filePath);
  }

  function moduleOf(specifier, fromFile) {
    if (!specifier) return null;
    if (!specifier.startsWith('.')) return specifier;
    const base = path.resolve(path.dirname(fromFile), specifier);
    for (const candidate of [`${base}.ts`, `${base}.js`, path.join(base, 'index.ts')]) {
      if (moduleByFile.has(candidate)) return moduleByFile.get(candidate);
    }
    return null;
  }

  function resolve(module, name, depth = 0) {
    if (depth > MAX_DEPTH) return null;
    const exports = tokensByModule.get(module);
    if (!exports) return null;

    if (!legacy.has(module)) {
      if (name === '*') return token(module, '*', false);
      const found = exports.get(name);
      return found ? token(found.module, found.export, found.typeOnly) : null;
    }

    const filePath = to.fileOf.get(module);
    const { named, stars } = shimOf(filePath);

    if (name === '*') {
      if (stars.length !== 1) return null;
      const next = moduleOf(stars[0].module, filePath);
      return next ? resolve(next, '*', depth + 1) : null;
    }

    const source = named.get(name);
    if (source?.kind === 'reexport') {
      const next = moduleOf(source.module, filePath);
      const found = next && resolve(next, source.name, depth + 1);
      if (found) return found;
    } else if (!source) {
      for (const star of stars) {
        const next = moduleOf(star.module, filePath);
        const found = next && resolve(next, name, depth + 1);
        if (found) return found;
      }
    }
    const own = exports.get(name);
    return own ? token(own.module, own.export, own.typeOnly) : null;
  }

  return resolve;
}
