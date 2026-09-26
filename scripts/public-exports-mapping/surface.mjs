import { spawnSync } from 'node:child_process';
import { existsSync, globSync, mkdtempSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import url from 'node:url';
import ts from 'typescript';

import { parseModule } from './exports.mjs';
import { compareTokens, packageOf, token } from './token.mjs';

export const BASELINE = /** @type {import('./token.mjs').Minor} */ ('5.5');

const REPO_ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..', '..');
const SOURCE_DIRS = ['packages', 'warp-drive-packages'];
const BUILD_CONFIGS = ['tsdown.config.mjs', 'vite.config.mjs'];

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
 * @typedef {Snapshot & { modules: Map<string, import('./exports.mjs').ModuleExports> }} Surface
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
 * @param {Snapshot | null} baseline  null only for the baseline itself, whose public packages define legacy
 * @returns {Surface}
 */
export function surfaceOf(tree, baseline) {
  const legacyPackages = baseline ? new Set(baseline.legacyModules.map(packageOf)) : null;
  /** @type {Surface['modules']} */
  const modules = new Map();
  const legacyModules = [];
  const tokens = [];

  for (const { dir, module, file } of entryModules(tree.root)) {
    if (modules.has(module)) {
      throw new Error(`${module} is built from both ${modules.get(module).file} and ${file}`);
    }
    const parsed = parseModule(file);
    // A side-effect-only module has no token to map.
    if (!parsed.named.size && !parsed.stars.length) continue;
    modules.set(module, parsed);
    for (const [name, { typeOnly }] of parsed.named) tokens.push(token(module, name, typeOnly));
    if (parsed.stars.length)
      tokens.push(
        token(
          module,
          '*',
          parsed.stars.every((star) => star.typeOnly)
        )
      );
    if (dir === 'packages' && (legacyPackages?.has(packageOf(module)) ?? true)) legacyModules.push(module);
  }

  return {
    schema: 1,
    kind: 'snapshot',
    version: tree.version,
    legacyModules: legacyModules.sort(),
    tokens: tokens.sort(compareTokens),
    modules,
  };
}

/**
 * @param {Surface} surface
 * @returns {Snapshot}
 */
export function snapshotOf({ schema, kind, version, legacyModules, tokens }) {
  return { schema, kind, version, legacyModules, tokens };
}

/**
 * Every entry file of every public package one level under each source directory.
 * @param {string} root
 * @returns {Generator<{ dir: string, module: string, file: string }>}
 */
function* entryModules(root) {
  for (const dir of SOURCE_DIRS) {
    if (!existsSync(path.join(root, dir))) continue;
    for (const entry of readdirSync(path.join(root, dir), { withFileTypes: true })) {
      const pkgRoot = path.join(root, dir, entry.name);
      const manifest = path.join(pkgRoot, 'package.json');
      if (!entry.isDirectory() || !existsSync(manifest)) continue;
      const { name, private: isPrivate } = JSON.parse(readFileSync(manifest, 'utf8'));
      const config = BUILD_CONFIGS.map((c) => path.join(pkgRoot, c)).find((c) => existsSync(c));
      if (!name || isPrivate || !config) continue;

      const patterns = entryPointsOf(config);
      if (!patterns.length) throw new Error(`${config} declares no entry points`);
      for (const rel of new Set(patterns.flatMap((p) => globSync(p.replace(/^\.\//, ''), { cwd: pkgRoot })))) {
        if (!/^src\/.+\.(mjs|cjs|js|ts)$/.test(rel) || rel.includes('/test-support/')) continue;
        const sub = rel.slice('src/'.length).replace(/\.[^.]+$/, '');
        yield { dir, module: sub === 'index' ? name : `${name}/${sub}`, file: path.join(pkgRoot, rel) };
      }
    }
  }
}

/**
 * The string entries of `export const entryPoints = [...]`, or of tsdown's own `entry: { ... }`.
 * @param {string} config
 * @returns {string[]}
 */
function entryPointsOf(config) {
  const source = ts.createSourceFile(config, readFileSync(config, 'utf8'), ts.ScriptTarget.Latest, true);
  const found = [];
  const visit = (node) => {
    if (ts.isVariableDeclaration(node) && node.name.getText() === 'entryPoints') {
      if (node.initializer && ts.isArrayLiteralExpression(node.initializer)) found.push(...node.initializer.elements);
    } else if (ts.isPropertyAssignment(node) && node.name.getText() === 'entry') {
      if (ts.isObjectLiteralExpression(node.initializer)) {
        found.push(...node.initializer.properties.filter(ts.isPropertyAssignment).map((p) => p.initializer));
      }
    } else {
      ts.forEachChild(node, visit);
    }
  };
  visit(source);
  return found.filter(ts.isStringLiteralLike).map((literal) => literal.text);
}
