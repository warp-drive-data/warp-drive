import path from 'node:path';

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
  for (const t of from.tokens) {
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
  const moduleByFile = new Map([...to.modules].map(([module, { file }]) => [file, module]));

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
    const parsed = to.modules.get(module);
    if (!parsed) return null;
    const { file, named, stars, forward } = parsed;
    const own = named.get(name);

    if (!legacy.has(module)) {
      if (name === '*') return token(module, '*', false);
      return own ? token(module, name, own.typeOnly) : null;
    }

    if (name === '*') {
      const next = moduleOf(forward, file);
      return next ? resolve(next, '*', depth + 1) : null;
    }

    if (own?.kind === 'reexport') {
      const next = moduleOf(own.module, file);
      const found = next && resolve(next, own.name, depth + 1);
      if (found) return found;
    } else if (!own) {
      for (const star of stars) {
        const next = moduleOf(star, file);
        const found = next && resolve(next, name, depth + 1);
        if (found) return found;
      }
    }
    return own ? token(module, name, own.typeOnly) : null;
  }

  return resolve;
}
