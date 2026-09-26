#!/usr/bin/env node
import { createRequire } from 'node:module';
import path from 'node:path';
import { parseArgs } from 'node:util';

import {
  canonical,
  layout,
  loadOverrides,
  loadSnapshot,
  loadStep,
  overridePairs,
  pathOf,
  relative,
  releasedVersions,
  sync,
} from './artifacts.mjs';
import { diffMerged, mergeSteps } from './merge.mjs';
import { deriveStep } from './step.mjs';
import { BASELINE, snapshotOf, surfaceOf, taggedTree, workingTree } from './surface.mjs';
import { compareMinors, compareTokens } from './token.mjs';

const { applyDelta } = createRequire(import.meta.url)(path.join(layout.shipped, 'delta.js'));

/**
 * @param {{ check: boolean }} opts
 * @returns {import('./artifacts.mjs').CheckResult[]}
 */
export function update(opts) {
  const tree = workingTree();
  const pairs = stepPairs(releasedVersions(), tree.version);
  return sync(planHead(new Map(), pairs, tree), { check: opts.check, managed: [layout.steps, layout.shipped] });
}

/**
 * @param {{ check: boolean }} opts
 * @returns {import('./artifacts.mjs').CheckResult[]}
 */
export function archive(opts) {
  const released = releasedVersions();
  const tree = workingTree();
  const pairs = stepPairs(released, tree.version);
  const tagged = planTagged(released);
  return sync(new Map([...tagged, ...planHead(tagged, pairs, tree)]), {
    check: opts.check,
    managed: [layout.snapshots, layout.steps, layout.shipped],
  });
}

/**
 * Re-running for the latest released minor re-derives its snapshot and step from the tags.
 * @param {import('./token.mjs').Minor} minor
 * @param {{ check: boolean }} opts
 * @returns {import('./artifacts.mjs').CheckResult[]}
 */
export function release(minor, opts) {
  const released = releasedVersions();
  const latest = released[released.length - 1];
  if (minor !== latest && compareMinors(minor, latest) <= 0) {
    throw new Error(`${minor} is not newer than the latest released minor ${latest}`);
  }
  const versions = minor === latest ? released : [...released, minor];
  const tree = workingTree();
  const pairs = stepPairs(versions, tree.version);
  const tagged = planTagged(versions.slice(-2));
  // Only the two newest snapshots are planned, so snapshots/ is archive's to police.
  return sync(new Map([...tagged, ...planHead(tagged, pairs, tree)]), {
    check: opts.check,
    managed: [layout.steps, layout.shipped],
  });
}

/**
 * Snapshots of tagged releases and the steps between them.
 * @param {import('./token.mjs').Minor[]} versions  consecutive, oldest first
 * @returns {import('./artifacts.mjs').Plan}
 */
function planTagged(versions) {
  /** @type {import('./artifacts.mjs').Plan} */
  const plan = new Map();
  // A run that includes the baseline derives it first and hands this copy, not the committed one
  // it may be about to rewrite, to every later tree. One run then reaches the fixed point.
  let baseline = versions[0] === BASELINE ? null : loadSnapshot(BASELINE);
  let prev = null;
  for (const version of versions) {
    using tree = taggedTree(version);
    const surface = surfaceOf(tree, baseline);
    const snapshot = snapshotOf(surface);
    baseline ??= snapshot;
    if (prev)
      plan.set(pathOf.step(prev.version, version), deriveStep(prev, surface, loadOverrides(prev.version, version)));
    plan.set(pathOf.snapshot(version), snapshot);
    prev = snapshot;
  }
  return plan;
}

/**
 * The live step, every step folded into the shipped maps, the maps, and `versions.json`. Snapshots
 * and steps come from `tagged` when this run derived them and from disk otherwise, so
 * `release --check` folds the snapshot it would write.
 * @param {import('./artifacts.mjs').Plan} tagged
 * @param {[import('./token.mjs').Minor, import('./token.mjs').Minor][]} pairs  from `stepPairs`
 * @param {import('./surface.mjs').Tree} tree
 * @returns {import('./artifacts.mjs').Plan}
 */
function planHead(tagged, pairs, tree) {
  const snapshot = (v) => tagged.get(pathOf.snapshot(v)) ?? loadSnapshot(v);
  const [latest] = pairs[pairs.length - 1];
  const live = deriveStep(snapshot(latest), surfaceOf(tree, snapshot(BASELINE)), loadOverrides(latest, tree.version));
  const chain = [...pairs.slice(0, -1).map(([a, b]) => tagged.get(pathOf.step(a, b)) ?? loadStep(a, b)), live];

  /** @type {import('./artifacts.mjs').Plan} */
  const plan = new Map(chain.map((step) => [pathOf.step(step.from, step.to), step]));
  const full = chain.map((_, i) => mergeSteps(chain.slice(i)));
  full.forEach((map, i) => plan.set(pathOf.shipped(map.from), i === 0 ? map : provenDelta(full[i - 1], map)));
  plan.set(
    pathOf.versions(),
    pairs.map(([from]) => from)
  );
  return plan;
}

/**
 * @param {import('./merge.mjs').MergedMap} base
 * @param {import('./merge.mjs').MergedMap} current
 * @returns {import('./merge.mjs').MergedDelta}
 */
function provenDelta(base, current) {
  const delta = diffMerged(base, current);
  const rebuilt = applyDelta(base, delta);
  rebuilt.entries.sort(compareTokens);
  if (canonical(rebuilt) !== canonical(current)) {
    throw new Error(`the ${current.from} delta against ${base.from} does not rebuild the ${current.from} map`);
  }
  return delta;
}

/**
 * Every step, released pairs oldest first and the live pair last. Each step goes to the next minor,
 * so a working tree that skips one names the release that has to be promoted first.
 * @param {import('./token.mjs').Minor[]} released  sorted
 * @param {import('./token.mjs').Minor} head  the working tree's minor
 * @returns {[import('./token.mjs').Minor, import('./token.mjs').Minor][]}
 */
function stepPairs(released, head) {
  /** @type {[import('./token.mjs').Minor, import('./token.mjs').Minor][]} */
  const pairs = [...released.slice(1).map((v, i) => [released[i], v]), [released[released.length - 1], head]];
  for (const [a, b] of pairs) {
    const [major, minor] = a.split('.').map(Number);
    const next = `${major}.${minor + 1}`;
    if (b === next || b === `${major + 1}.0`) continue;
    throw new Error(
      compareMinors(b, a) <= 0
        ? `root package.json is ${b}, not past ${a}; bump the version`
        : `step ${a}-${b} skips ${next}; run \`cli.mjs release ${next}\` once v${next}.0 is tagged`
    );
  }
  const names = new Set(pairs.map(([a, b]) => `${a}-${b}`));
  const stray = overridePairs().filter(({ from, to }) => !names.has(`${from}-${to}`));
  if (stray.length) {
    throw new Error(
      `overrides name pairs that are not steps: ${stray.map(({ from, to }) => `${from}-${to}`).join(', ')}`
    );
  }
  return pairs;
}

async function main() {
  const { positionals, values } = parseArgs({
    allowPositionals: true,
    options: { check: { type: 'boolean', default: false } },
  });
  const [command, arg] = positionals;
  const commands = {
    update: () => update({ check: values.check }),
    archive: () => archive({ check: values.check }),
    release: () => {
      if (!/^\d+\.\d+$/.test(arg ?? '')) throw new Error('usage: cli.mjs release <major>.<minor> [--check]');
      return release(/** @type {import('./token.mjs').Minor} */ (arg), { check: values.check });
    },
  };
  if (!commands[command]) throw new Error('usage: cli.mjs <update|archive|release <minor>> [--check]');

  const results = commands[command]();
  const drifted = results.filter((r) => r.status !== 'clean');
  for (const result of drifted) {
    const label = values.check ? result.status : result.status === 'extra' ? 'removed' : 'wrote';
    process.stdout.write(`${label}: ${relative(result.path)}\n`);
    if (values.check && result.diff) process.stdout.write(result.diff);
  }
  const verb = values.check ? 'drifted' : 'written';
  process.stdout.write(`${command}: ${results.length} artifacts, ${drifted.length} ${verb}\n`);
  if (values.check && drifted.length) {
    process.stdout.write(
      `run \`node scripts/public-exports-mapping/cli.mjs ${positionals.join(' ')}\` and commit the result\n`
    );
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err.problems ? err.problems.map((p) => `${p.kind}: ${p.detail}`).join('\n') : err.message);
  process.exit(1);
});
