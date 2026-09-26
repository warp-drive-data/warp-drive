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
 * @returns {Promise<import('./artifacts.mjs').CheckResult[]>}
 */
export async function update(opts) {
  const released = releasedVersions();
  const latest = released[released.length - 1];
  const tree = workingTree();
  if (compareMinors(tree.version, latest) <= 0) {
    throw new Error(
      `root package.json is ${tree.version} but snapshots/${latest}.json exists; bump the version, or run \`cli.mjs release ${tree.version}\` if the tag is out`
    );
  }
  refuseStrayOverrides(new Set([...consecutive(released), [latest, tree.version]].map(([a, b]) => `${a}-${b}`)));

  const head = await surfaceOf(tree, loadSnapshot(BASELINE));
  const live = deriveStep(loadSnapshot(latest), head, loadOverrides(latest, tree.version));
  const chain = consecutive(released).map(([a, b]) => loadStep(a, b));

  const desired = new Map([[pathOf.step(latest, tree.version), canonical(live)]]);
  const full = released.map((_, i) => mergeSteps([...chain.slice(i), live], head));
  full.forEach((map, i) => {
    desired.set(pathOf.shipped(map.from), canonical(i === 0 ? map : provenDelta(full[i - 1], map)));
  });
  desired.set(pathOf.versions(), canonical(released));
  return sync(desired, { check: opts.check, managed: [layout.shipped] });
}

/**
 * @param {{ check: boolean }} opts
 * @returns {Promise<import('./artifacts.mjs').CheckResult[]>}
 */
export async function archive(opts) {
  const released = releasedVersions();
  const baseline = loadSnapshot(BASELINE);
  const tree = workingTree();
  refuseStrayOverrides(
    new Set([...consecutive(released), [released[released.length - 1], tree.version]].map(([a, b]) => `${a}-${b}`))
  );

  /** @type {Map<string, import('./surface.mjs').Surface>} */
  const surfaces = new Map();
  for (const version of released) {
    surfaces.set(version, await surfaceOf(await taggedTree(version), version === BASELINE ? null : baseline));
  }
  surfaces.set(tree.version, await surfaceOf(tree, baseline));

  const desired = new Map();
  for (const version of released) desired.set(pathOf.snapshot(version), canonical(snapshotOf(surfaces.get(version))));
  for (const [a, b] of [...consecutive(released), [released[released.length - 1], tree.version]]) {
    const step = deriveStep(snapshotOf(surfaces.get(a)), surfaces.get(b), loadOverrides(a, b));
    desired.set(pathOf.step(a, b), canonical(step));
  }
  return sync(desired, { check: opts.check, managed: [layout.snapshots, layout.steps] });
}

/**
 * @param {import('./token.mjs').Minor} minor
 * @param {{ check: boolean }} opts
 * @returns {Promise<import('./artifacts.mjs').CheckResult[]>}
 */
export async function release(minor, opts) {
  const released = releasedVersions();
  const latest = released[released.length - 1];
  const prev = latest === minor ? released[released.length - 2] : latest;
  if (latest !== minor && compareMinors(minor, latest) <= 0) {
    throw new Error(`${minor} is not newer than the latest released minor ${latest}`);
  }
  const tree = workingTree();
  if (compareMinors(tree.version, minor) <= 0) {
    throw new Error(`root package.json is still ${tree.version}; bump it past ${minor} before releasing`);
  }
  const surface = await surfaceOf(await taggedTree(minor), loadSnapshot(BASELINE));
  const step = deriveStep(loadSnapshot(prev), surface, loadOverrides(prev, minor));
  const results = sync(
    new Map([
      [pathOf.snapshot(minor), canonical(snapshotOf(surface))],
      [pathOf.step(prev, minor), canonical(step)],
    ]),
    { check: opts.check, managed: [] }
  );
  return [...results, ...(await update(opts))];
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
 * @param {import('./token.mjs').Minor[]} versions  sorted
 * @returns {[import('./token.mjs').Minor, import('./token.mjs').Minor][]}
 */
function consecutive(versions) {
  return versions.slice(1).map((v, i) => [versions[i], v]);
}

/** @param {Set<string>} stepNames */
function refuseStrayOverrides(stepNames) {
  const stray = overridePairs().filter(({ from, to }) => !stepNames.has(`${from}-${to}`));
  if (stray.length) {
    throw new Error(
      `overrides name pairs that are not steps: ${stray.map(({ from, to }) => `${from}-${to}`).join(', ')}`
    );
  }
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

  const results = await commands[command]();
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
