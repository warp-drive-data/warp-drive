'use strict';

/**
 * Reads the mapping data this directory ships (written by `scripts/public-exports-mapping` in the
 * warp-drive repository, which checks it in CI) and answers, for an import written against one
 * release, what to do with it so that it works against another. It rebuilds the `to` surface
 * by applying the shipped diffs to the shipped baseline surface, once per `(from, to)`, and never
 * calls the network or a model. The stages and the ranking live in `./map-core.js`.
 */

const fs = require('fs');
const { createRequire } = require('module');
const path = require('path');

const core = require('./map-core.js');

/** The version `head` stands for: this plugin is released in lockstep with `@warp-drive/core`. */
const HEAD_VERSION = require('../../package.json').version;

/** The `code` of the error `loadMap` throws when a data directory holds no mapping data. */
const NO_DATA = 'ERR_WARP_DRIVE_NO_IMPORT_MAPPING_DATA';

/** @type {Map<string, import('./map-core.js').Dataset>} */
const datasets = new Map();
/** @type {Map<string, ReturnType<typeof core.createMap>>} */
const maps = new Map();
/** @type {Map<string, string | null>} */
const installedVersions = new Map();

/**
 * @param {string} file
 * @returns {any}
 */
function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

/**
 * The parsed `*.json` files of a directory, by name; none when it does not exist.
 * @param {string} dir
 * @returns {any[]}
 */
function readJsonFiles(dir) {
  /** @type {string[]} */
  let names;
  try {
    names = fs.readdirSync(dir);
  } catch (error) {
    if (/** @type {NodeJS.ErrnoException} */ (error).code === 'ENOENT') return [];
    throw error;
  }
  return names
    .filter((name) => name.endsWith('.json'))
    .sort()
    .map((name) => readJson(path.join(dir, name)));
}

/**
 * @param {string} dataDir
 */
function datasetFor(dataDir) {
  const dir = path.resolve(dataDir);
  let dataset = datasets.get(dir);
  if (!dataset) {
    const releasesFile = path.join(dir, 'releases.json');
    if (!fs.existsSync(releasesFile)) {
      const error = new Error(
        `No legacy import mapping data in ${dir}: it has no releases.json. The plugin ships the data in src/legacy-import-mapping; a custom dataDir needs the same files.`
      );
      Object.assign(error, { code: NO_DATA });
      throw error;
    }
    const releases = readJson(releasesFile);
    const messagesFile = path.join(dir, 'messages.json');
    dataset = core.createDataset({
      releases,
      surfaces: [readJson(path.join(dir, `surface.${releases.baseline}.json`))],
      diffs: readJsonFiles(path.join(dir, 'diffs')),
      decisions: readJsonFiles(path.join(dir, 'decisions')),
      preferences: readJson(path.join(dir, 'preferences.json')),
      messages: fs.existsSync(messagesFile) ? readJson(messagesFile) : undefined,
      headVersion: HEAD_VERSION,
    });
    datasets.set(dir, dataset);
  }
  return dataset;
}

/**
 * The version of `@warp-drive/core` installed for the project in `cwd`, or `null`.
 *
 * `require.resolve('@warp-drive/core/package.json')` alone is not enough: the package's
 * `exports` map sends `./*` to `./dist/*.js`, so that request resolves to a file that does not
 * exist. When it fails, the package directory is looked up along Node's own lookup paths.
 * @param {string} cwd
 * @returns {string | null}
 */
function installedCoreVersion(cwd) {
  if (installedVersions.has(cwd)) return /** @type {string | null} */ (installedVersions.get(cwd));
  /** @type {string | null} */
  let version = null;
  try {
    version = readJson(require.resolve('@warp-drive/core/package.json', { paths: [cwd] })).version;
  } catch {
    const lookup = createRequire(path.join(cwd, 'package.json')).resolve.paths('@warp-drive/core') || [];
    for (const dir of lookup) {
      const file = path.join(dir, '@warp-drive', 'core', 'package.json');
      if (!fs.existsSync(file)) continue;
      version = readJson(file).version;
      break;
    }
  }
  installedVersions.set(cwd, version);
  return version;
}

/**
 * The installed `@warp-drive/core` version's release, else the newest release.
 * @param {import('./map-core.js').Dataset} dataset
 */
function defaultTo(dataset) {
  const installed = installedCoreVersion(process.cwd());
  if (installed) {
    try {
      return core.resolveVersion(dataset, installed);
    } catch {
      // an installed version the data does not cover falls back to the newest release
    }
  }
  const releases = dataset.versions.filter((version) => version !== 'head');
  return releases[releases.length - 1];
}

/**
 * The map from release `from` to release `to`.
 *
 * `from` defaults to the baseline release and `to` to the release of the installed
 * `@warp-drive/core` (looked up from `process.cwd()`), else the newest release. Both accept a
 * full version, a `major.minor`, or `head`; a minor between two shipped releases means the older
 * one. When `to` is defaulted and older than `from`, the map is from `from` to `from`.
 * @param {{ from?: string, to?: string, dataDir?: string }} [options]  `dataDir` defaults to the data
 *   this plugin ships.
 */
function loadMap(options = {}) {
  const dataset = datasetFor(options.dataDir || __dirname);
  const from =
    options.from === undefined ? dataset.releases.baseline : core.resolveVersion(dataset, String(options.from));
  let to = options.to === undefined ? defaultTo(dataset) : core.resolveVersion(dataset, String(options.to));
  if (options.to === undefined && dataset.versions.indexOf(to) < dataset.versions.indexOf(from)) to = from;
  const key = `${path.resolve(options.dataDir || __dirname)}\0${from}\0${to}`;
  let map = maps.get(key);
  if (!map) {
    map = core.createMap(dataset, { from, to });
    maps.set(key, map);
  }
  return map;
}

/**
 * The versions a map can name, oldest first: every shipped release, then `head` when the data
 * reaches it.
 * @param {{ dataDir?: string }} [options]
 * @returns {string[]}
 */
function listReleases(options = {}) {
  return [...datasetFor(options.dataDir || __dirname).versions];
}

module.exports = { HEAD_VERSION, NO_DATA, listReleases, loadMap };
