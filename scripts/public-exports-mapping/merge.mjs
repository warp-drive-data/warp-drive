import { derived, ProblemsError } from './step.mjs';
import { compareTokens, keyOf, token } from './token.mjs';

/** @typedef {import('./step.mjs').DerivedEntry} MergedEntry */

/**
 * @typedef {object} MergedMap
 * @property {1} schema
 * @property {'merged'} kind
 * @property {import('./token.mjs').Minor} from
 * @property {import('./token.mjs').Minor[]} via
 * @property {import('./token.mjs').Minor} to
 * @property {string[]} legacyModules
 * @property {MergedEntry[]} entries
 */

/**
 * A shipped map stored against the full map of the previous from-release in `versions.json`.
 * @typedef {object} MergedDelta
 * @property {1} schema
 * @property {'merged-delta'} kind
 * @property {import('./token.mjs').Minor} from
 * @property {import('./token.mjs').Minor} base
 * @property {import('./token.mjs').Minor[]} via
 * @property {import('./token.mjs').Minor} to
 * @property {string[]} [legacyModules]  present only when it differs from the base's
 * @property {import('./token.mjs').TokenKey[]} remove  keys the base has and `from` lacks, sorted
 * @property {MergedEntry[]} set  entries new in `from` or different from the base's, in token order
 */

/**
 * @param {import('./step.mjs').StepMap[]} steps  contiguous, oldest first, at least one
 * @returns {MergedMap}
 * @throws {Error | ProblemsError}
 */
export function mergeSteps(steps) {
  const last = steps[steps.length - 1];
  const indexes = steps.map((step) => new Map(step.entries.map((e) => [keyOf(e), e])));
  /** @type {MergedEntry[]} */
  const entries = [];

  for (const seed of steps[0].entries) {
    /** @type {import('./token.mjs').Token | null} */
    let cursor = token(seed.module, seed.export, seed.typeOnly);
    for (let i = 0; i < steps.length && cursor !== null; i++) {
      const entry = indexes[i].get(keyOf(cursor));
      if (!entry) {
        throw new Error(
          `${steps[i].from}-${steps[i].to} has no entry for ${keyOf(cursor)} (reached from ${keyOf(seed)})`
        );
      }
      cursor = entry.to;
    }
    entries.push(derived(seed, cursor));
  }

  /** @type {MergedMap} */
  const map = {
    schema: 1,
    kind: 'merged',
    from: steps[0].from,
    via: steps.slice(0, -1).map((s) => s.to),
    to: last.to,
    legacyModules: last.legacyModules,
    entries: entries.sort(compareTokens),
  };
  const problems = residualChains(map);
  if (problems.length) throw new ProblemsError('merged-map problem(s)', problems);
  return map;
}

/**
 * @param {MergedMap} base  the full map of the previous from-release
 * @param {MergedMap} current
 * @returns {MergedDelta}
 */
export function diffMerged(base, current) {
  const before = new Map(base.entries.map((e) => [keyOf(e), JSON.stringify(e)]));
  const after = new Set(current.entries.map(keyOf));
  const sameLegacy = JSON.stringify(base.legacyModules) === JSON.stringify(current.legacyModules);
  return {
    schema: 1,
    kind: 'merged-delta',
    from: current.from,
    base: base.from,
    via: current.via,
    to: current.to,
    ...(sameLegacy ? {} : { legacyModules: current.legacyModules }),
    remove: [...before.keys()].filter((key) => !after.has(key)).sort(),
    set: current.entries.filter((e) => before.get(keyOf(e)) !== JSON.stringify(e)),
  };
}

/**
 * A target that the same map moves again would need a second lookup at lint time.
 * @param {MergedMap} merged
 * @returns {import('./step.mjs').Problem[]}
 */
function residualChains(merged) {
  const movers = new Map();
  for (const e of merged.entries) {
    if (e.to && keyOf(e.to) !== keyOf(e)) movers.set(keyOf(e), e);
  }
  /** @type {import('./step.mjs').Problem[]} */
  const problems = [];
  for (const entry of merged.entries) {
    if (entry.to === null) continue;
    const target = keyOf(entry.to);
    const mover = movers.get(target);
    if (mover && mover !== entry) {
      problems.push({
        kind: 'residual-chain',
        detail: `${keyOf(entry)} lands on ${target}, which this map moves to ${keyOf(mover.to)}`,
      });
    }
  }
  return problems;
}
