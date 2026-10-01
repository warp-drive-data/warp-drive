/**
 * Writes the data directory of `eslint-plugin-warp-drive`'s legacy import mapping (CONTRACT.md,
 * area D): `releases.json`, the baseline surface as `surface.<baseline>.json`, every
 * `diffs/*.json` and `decisions/*.json`, `preferences.json`, and `messages.json` with the links
 * the rule prints. Before writing, it checks what the reader will rely on: the diffs chain from
 * the baseline through every release, each rebuilt surface equals `surfaces/<version>.json`
 * where that file exists, and every judged decision still applies.
 */
import { existsSync, readdirSync, rmSync } from 'node:fs';
import path from 'node:path';

import { canonical, DATA_ROOT, readJson, REPO_ROOT, report, SHIPPED_ROOT, writeArtifact } from './artifacts.mjs';
import { createDataset, staleDecisions, surfaceAt } from './map.mjs';

/** The links a `side-effect` or `removed` report prints, by reason. */
export const MESSAGES = Object.freeze({
  schema: 1,
  kind: 'messages',
  links: {
    'api-docs': { title: 'API docs', url: 'https://warp-drive.io/api/' },
    'request-service-cheat-sheet': {
      title: 'Request service cheat sheet',
      url: 'https://request-service-cheat-sheet.netlify.app',
    },
    'upgrade-guide': { title: 'In-place upgrade guide', url: 'https://warp-drive.io/upgrading/v5/' },
  },
  reasons: {
    removed: ['upgrade-guide', 'api-docs', 'request-service-cheat-sheet'],
    'side-effect': ['upgrade-guide'],
  },
});

/**
 * The `*.json` files of a directory, sorted by name; none when it does not exist.
 * @param {string} dir
 * @returns {{ name: string, value: any }[]}
 */
function jsonFiles(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => name.endsWith('.json'))
    .sort()
    .map((name) => ({ name, value: readJson(path.join(dir, name)) }));
}

/**
 * Every data file ship owns in `shippedRoot`, relative to it: the JSON files at its top level
 * and in `diffs/` and `decisions/`. The reader's own code is not JSON and is never touched.
 * @param {string} shippedRoot
 * @returns {string[]}
 */
function shippedDataFiles(shippedRoot) {
  return [
    ...jsonFiles(shippedRoot).map(({ name }) => name),
    ...jsonFiles(path.join(shippedRoot, 'diffs')).map(({ name }) => `diffs/${name}`),
    ...jsonFiles(path.join(shippedRoot, 'decisions')).map(({ name }) => `decisions/${name}`),
  ];
}

/**
 * Reads what ship copies from the pipeline's data directory. Throws, naming every missing
 * input and the command that writes it.
 * @param {string} [dataRoot]
 */
export function readSources(dataRoot = DATA_ROOT) {
  /** @param {{ file: string, by: string }[]} inputs */
  const requireInputs = (inputs) => {
    const missing = inputs.filter(({ file }) => !existsSync(path.join(dataRoot, file)));
    if (missing.length) {
      throw new Error(`ship: missing ${missing.map(({ file, by }) => `${file} (${by})`).join(', ')} in ${dataRoot}`);
    }
  };
  requireInputs([{ file: 'releases.json', by: 'hand; see CONTRACT.md' }]);
  const releases = readJson(path.join(dataRoot, 'releases.json'));
  requireInputs([
    { file: `surfaces/${releases.baseline}.json`, by: `cli.mjs surface ${releases.baseline}` },
    { file: 'preferences.json', by: 'hand; see CONTRACT.md' },
  ]);
  const diffs = jsonFiles(path.join(dataRoot, 'diffs'));
  const decisions = jsonFiles(path.join(dataRoot, 'decisions'));
  for (const { name, value } of diffs) {
    if (name !== `${value.from}-${value.to}.json`)
      throw new Error(`ship: diffs/${name} holds ${value.from}-${value.to}`);
  }
  for (const { name, value } of decisions) {
    if (name !== `${value.from}.json`) throw new Error(`ship: decisions/${name} holds decisions for ${value.from}`);
  }
  return {
    releases,
    baseline: readJson(path.join(dataRoot, 'surfaces', `${releases.baseline}.json`)),
    diffs,
    decisions,
    preferences: readJson(path.join(dataRoot, 'preferences.json')),
  };
}

/**
 * Checks the sources the way the reader will use them: rebuilds every version from the baseline
 * and the diffs, compares each with `surfaces/<version>.json` when it exists, and lists the
 * judged decisions that no longer apply. Throws when the data cannot be shipped.
 * @param {ReturnType<typeof readSources>} sources
 * @param {string} dataRoot
 */
function validate(sources, dataRoot) {
  const dataset = createDataset({
    releases: sources.releases,
    surfaces: [sources.baseline],
    diffs: sources.diffs.map(({ value }) => value),
    decisions: sources.decisions.map(({ value }) => value),
    preferences: sources.preferences,
    messages: /** @type {any} */ (MESSAGES),
  });
  const problems = [];
  for (const version of dataset.versions) {
    let rebuilt;
    try {
      rebuilt = surfaceAt(dataset, version);
    } catch (error) {
      problems.push(/** @type {Error} */ (error).message);
      break;
    }
    const file = path.join(dataRoot, 'surfaces', `${version}.json`);
    if (existsSync(file) && canonical(rebuilt.modules) !== canonical(readJson(file).modules)) {
      problems.push(`the diffs up to ${version} do not rebuild surfaces/${version}.json`);
    }
  }
  if (problems.length) throw new Error(`ship: ${problems.join('; ')}`);
  return sources.decisions.flatMap(({ value }) =>
    staleDecisions(dataset, value).map((stale) => ({ ...stale, file: `decisions/${value.from}.json` }))
  );
}

/**
 * Writes (or, with `check`, compares) the plugin's data directory and removes the data files
 * whose source is gone. A stale decision fails `check`.
 * @param {{ check?: boolean, dataRoot?: string, shippedRoot?: string }} [options]
 * @returns {{ code: number, results: ReturnType<typeof writeArtifact>[], removed: string[], stale: ReturnType<typeof validate> }}
 */
export function ship({ check = false, dataRoot = DATA_ROOT, shippedRoot = SHIPPED_ROOT } = {}) {
  const sources = readSources(dataRoot);
  const stale = validate(sources, dataRoot);

  /** @type {[string, unknown][]} */
  const outputs = [
    ['releases.json', sources.releases],
    [`surface.${sources.releases.baseline}.json`, sources.baseline],
    ...sources.diffs.map(({ name, value }) => /** @type {[string, unknown]} */ ([`diffs/${name}`, value])),
    ...sources.decisions.map(({ name, value }) => /** @type {[string, unknown]} */ ([`decisions/${name}`, value])),
    ['preferences.json', sources.preferences],
    ['messages.json', MESSAGES],
  ];
  const results = outputs.map(([file, value]) => writeArtifact(path.join(shippedRoot, file), value, { check }));

  const wanted = new Set(outputs.map(([file]) => file));
  const removed = shippedDataFiles(shippedRoot).filter((file) => !wanted.has(file));
  for (const file of removed) {
    if (!check) rmSync(path.join(shippedRoot, file));
    console.log(
      `ship: ${check ? 'would remove' : 'removed'} ${path.relative(REPO_ROOT, path.join(shippedRoot, file))}`
    );
  }

  let code = report(results, { check, command: 'ship' });
  if (check && removed.length) code = 1;
  for (const entry of stale) {
    const source = entry.source ? ` (${entry.source.module} ${entry.source.export})` : '';
    console.log(`ship: stale decision in ${entry.file}: ${entry.decl}${source}: ${entry.reason}`);
  }
  if (check && stale.length) code = 1;
  return { code, results, removed, stale };
}
