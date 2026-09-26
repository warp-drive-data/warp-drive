'use strict';

const keyOf = (entry) => `${entry.module}::${entry.export}`;

/**
 * Rebuild the full merged map of `delta.from` from the full map of the release before it.
 * @param {object} base   a full merged map for `delta.base`
 * @param {object} delta  a merged-delta file
 * @returns {object}      the full merged map for `delta.from`, entries in no particular order
 */
function applyDelta(base, delta) {
  const byKey = new Map(base.entries.map((entry) => [keyOf(entry), entry]));
  for (const key of delta.remove) byKey.delete(key);
  for (const entry of delta.set) byKey.set(keyOf(entry), entry);
  return {
    schema: 1,
    kind: 'merged',
    from: delta.from,
    via: delta.via,
    to: delta.to,
    legacyModules: delta.legacyModules ?? base.legacyModules,
    entries: [...byKey.values()],
  };
}

module.exports = { applyDelta };
