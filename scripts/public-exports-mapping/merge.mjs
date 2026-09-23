import { derived, manual, sourcesOf } from './step.mjs';
import { compareTokens, keyOf, sameToken, token } from './token.mjs';

/**
 * @typedef {object} Hop
 * @property {import('./token.mjs').Minor} at   the version the token landed in
 * @property {import('./token.mjs').Token | null} to
 * @property {string} [note]
 */

/**
 * @typedef {import('./step.mjs').StepEntry & { hops?: Hop[] }} MergedEntry
 */

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
 * @typedef {object} MergedProblem
 * @property {'target-missing' | 'residual-chain'} kind
 * @property {MergedEntry} entry
 * @property {string} detail
 */

export class MergedError extends Error {
  /** @param {MergedProblem[]} problems */
  constructor(problems) {
    super(`${problems.length} merged-map problem(s)`);
    this.problems = problems;
  }
}

/**
 * @param {import('./step.mjs').StepMap[]} steps  contiguous, oldest first, at least one
 * @param {import('./surface.mjs').Snapshot} endpoint  the last step's to-version
 * @returns {MergedMap}
 * @throws {Error | MergedError}
 */
export function mergeSteps(steps, endpoint) {
  if (steps.length === 0) throw new Error('mergeSteps needs at least one step');
  for (let i = 1; i < steps.length; i++) {
    if (steps[i - 1].to !== steps[i].from) {
      throw new Error(
        `step chain is not contiguous: ${steps[i - 1].from}-${steps[i - 1].to} then ${steps[i].from}-${steps[i].to}`
      );
    }
  }
  const last = steps[steps.length - 1];
  if (last.to !== endpoint.version) throw new Error(`chain ends at ${last.to} but the endpoint is ${endpoint.version}`);

  const indexes = steps.map((step) => new Map(step.entries.map((e) => [keyOf(e), e])));
  /** @type {MergedEntry[]} */
  const entries = [];

  for (const seed of steps[0].entries) {
    let cursor = token(seed.module, seed.export, seed.typeOnly);
    /** @type {Hop[]} */
    const changes = [];
    /** @type {import('./step.mjs').StepEntry | undefined} */
    let lastChange;
    for (let i = 0; i < steps.length && cursor !== null; i++) {
      const entry = indexes[i].get(keyOf(cursor));
      if (!entry) {
        throw new Error(
          `${steps[i].from}-${steps[i].to} has no entry for ${keyOf(cursor)} (reached from ${keyOf(seed)})`
        );
      }
      if (!sameToken(entry.to, cursor)) {
        changes.push(hop(steps[i].to, entry.to, entry.origin === 'manual' ? entry.note : undefined));
        lastChange = entry;
      }
      cursor = entry.to;
    }
    /** @type {MergedEntry} */
    const merged = lastChange?.origin === 'manual' ? manual(seed, cursor, lastChange.note) : derived(seed, cursor);
    if (changes.length > 1) merged.hops = changes;
    entries.push(merged);
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
  const problems = verifyMerged(map, endpoint);
  if (problems.length) throw new MergedError(problems);
  return map;
}

/**
 * @param {MergedMap} merged
 * @param {import('./surface.mjs').Snapshot} endpoint
 * @returns {MergedProblem[]}
 */
function verifyMerged(merged, endpoint) {
  const endpointKeys = new Set(sourcesOf(endpoint).map(keyOf));
  const movers = new Map();
  for (const e of merged.entries) {
    if (e.to && keyOf(e.to) !== keyOf(e)) movers.set(keyOf(e), e);
  }
  /** @type {MergedProblem[]} */
  const problems = [];
  for (const entry of merged.entries) {
    if (entry.to === null) continue;
    const target = keyOf(entry.to);
    if (!endpointKeys.has(target)) {
      problems.push({
        kind: 'target-missing',
        entry,
        detail: `${keyOf(entry)} lands on ${target}, which ${merged.to} does not export`,
      });
    }
    const mover = movers.get(target);
    if (mover && mover !== entry) {
      problems.push({
        kind: 'residual-chain',
        entry,
        detail: `${keyOf(entry)} lands on ${target}, which this map moves to ${keyOf(mover.to)}`,
      });
    }
  }
  return problems;
}

/**
 * @param {import('./token.mjs').Minor} at
 * @param {import('./token.mjs').Token | null} to
 * @param {string} [note]
 * @returns {Hop}
 */
function hop(at, to, note) {
  return note === undefined ? { at, to } : { at, to, note };
}
