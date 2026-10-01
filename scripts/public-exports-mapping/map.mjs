/**
 * The stages and the ranking (CONTRACT.md, "Stages and ranking"): the map for any `(from, to)`.
 *
 * The logic lives in `eslint-plugin-warp-drive`'s `legacy-import-mapping/map-core.js`, which the
 * plugin's reader requires as well, so the scripts and the lint rule share one implementation.
 * Everything here is pure: callers pass parsed JSON in and get plain data back.
 */
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

/** @type {typeof import('../../packages/eslint-plugin-warp-drive/src/legacy-import-mapping/map-core.js')} */
const core = require('../../packages/eslint-plugin-warp-drive/src/legacy-import-mapping/map-core.js');

export const {
  RANKING,
  REPORT_REASONS,
  applyDiff,
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
} = core;

/**
 * @typedef {import('../../packages/eslint-plugin-warp-drive/src/legacy-import-mapping/map-core.js').Decision} Decision
 * @typedef {{
 *   module: string, export: string, kind: 'value' | 'type', decl: string,
 *   target: string | null, via: 'declarations' | 'decision' | null,
 *   candidates: { module: string, export: string, kind: 'value' | 'type' }[],
 *   decision: Decision, typeOnlyDecision?: Decision,
 * }} TokenDecision
 */

/**
 * The map from `from` to `to`: for every token of the `from` surface, how it resolved (`via`
 * the declaration chain, a judged decision, or nothing), its ranked candidates in the `to`
 * surface and the decision for a value import of it (`typeOnlyDecision` when a type-only import
 * gets another one); `residue`, the tokens nothing resolves, for the judge; and `stale`, the
 * judged decisions that could not be applied. `resolve` answers for any import.
 *
 * `surfaces` needs at least the baseline surface; the others are rebuilt from `diffs` when they
 * are missing. `from` and `to` take a full version, a `major.minor` or `head`.
 * @param {{
 *   from: string, to: string,
 *   releases: { schema: 1, baseline: string, releases: string[] },
 *   surfaces: object[] | Record<string, object>,
 *   diffs: object[] | Record<string, object>,
 *   decisions?: object[] | Record<string, object>,
 *   preferences?: object,
 *   messages?: object,
 *   headVersion?: string,
 * }} data
 */
export function buildMap(data) {
  const map = core.buildMap(/** @type {any} */ (data));
  return {
    from: map.from,
    to: map.to,
    /** @type {TokenDecision[]} */
    tokens: map.tokens,
    residue: map.residue,
    stale: map.stale,
    resolve: map.resolve,
  };
}
