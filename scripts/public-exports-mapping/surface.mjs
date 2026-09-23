import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import url from 'node:url';

import { scan } from './generate.mjs';
import { compareTokens, packageOf, token } from './token.mjs';

export const BASELINE = /** @type {import('./token.mjs').Minor} */ ('5.5');

const REPO_ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..', '..');
const SOURCE_DIRS = ['packages', 'warp-drive-packages'];

/**
 * @typedef {object} Tree
 * @property {import('./token.mjs').Minor} version
 * @property {string} root  absolute path holding `packages/` and `warp-drive-packages/`
 */

/**
 * @typedef {object} Snapshot
 * @property {1} schema
 * @property {'snapshot'} kind
 * @property {import('./token.mjs').Minor} version
 * @property {string[]} legacyModules
 * @property {import('./token.mjs').Token[]} tokens
 */

/**
 * @typedef {Snapshot & { fileOf: Map<string, string> }} Surface
 */

/**
 * @param {string} [repoRoot]
 * @returns {Tree}
 */
export function workingTree(repoRoot = REPO_ROOT) {
  const { version } = JSON.parse(readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));
  const match = /^(\d+)\.(\d+)\./.exec(version);
  if (!match) throw new Error(`root package.json version "${version}" is not <major>.<minor>.<patch>`);
  return { version: /** @type {import('./token.mjs').Minor} */ (`${match[1]}.${match[2]}`), root: repoRoot };
}

/**
 * @param {import('./token.mjs').Minor} version
 * @param {string} [repoRoot]
 * @returns {Promise<Tree>}
 */
export async function taggedTree(version, repoRoot = REPO_ROOT) {
  const tag = `v${version}.0`;
  const root = mkdtempSync(path.join(tmpdir(), `warp-drive-${tag}-`));
  const git = spawnSync('git', ['archive', tag, ...SOURCE_DIRS], { cwd: repoRoot, maxBuffer: 1 << 30 });
  if (git.status !== 0) {
    throw new Error(`git archive ${tag} failed (run \`git fetch origin tag ${tag}\`): ${git.stderr.toString().trim()}`);
  }
  const tar = spawnSync('tar', ['-x', '-C', root], { input: git.stdout });
  if (tar.status !== 0) throw new Error(`extracting ${tag} failed: ${tar.stderr.toString().trim()}`);
  return { version, root };
}

/**
 * @param {Tree} tree
 * @param {Snapshot | null} baseline
 * @returns {Promise<Surface>}
 */
export async function surfaceOf(tree, baseline) {
  const legacyPackages = baseline ? new Set(baseline.legacyModules.map(packageOf)) : null;
  /** @type {Map<string, import('./token.mjs').Token>} */
  const tokens = new Map();
  const fileOf = new Map();
  const legacyModules = new Set();

  for (const dir of SOURCE_DIRS) {
    const packagesDir = path.join(tree.root, dir);
    if (!existsSync(packagesDir)) continue;
    const configName = hasConfig(packagesDir, 'tsdown.config.mjs') ? 'tsdown.config.mjs' : 'vite.config.mjs';
    for (const record of await scan({ root: tree.root, packagesDir, configName })) {
      const key = `${record.module}::${record.export}`;
      const typeOnly = (tokens.get(key)?.typeOnly ?? true) && record.typeOnly;
      tokens.set(key, token(record.module, record.export, typeOnly));
      fileOf.set(record.module, path.join(tree.root, record.filePath));
      if (dir === 'packages' && (legacyPackages === null || legacyPackages.has(packageOf(record.module)))) {
        legacyModules.add(record.module);
      }
    }
  }

  return {
    schema: 1,
    kind: 'snapshot',
    version: tree.version,
    legacyModules: [...legacyModules].sort(),
    tokens: [...tokens.values()].sort(compareTokens),
    fileOf,
  };
}

/**
 * @param {Surface} surface
 * @returns {Snapshot}
 */
export function snapshotOf({ schema, kind, version, legacyModules, tokens }) {
  return { schema, kind, version, legacyModules, tokens };
}

function hasConfig(dir, configName) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory() ? hasConfig(full, configName) : entry.name === configName) return true;
  }
  return false;
}
