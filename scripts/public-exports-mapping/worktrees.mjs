/**
 * A detached git worktree per release tag, next to the main checkout and never inside it:
 * `<main checkout>/../warp-drive-worktrees/releases/<version>`. `head` is the working tree itself.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';

import { REPO_ROOT } from './artifacts.mjs';

/**
 * @param {string[]} args
 * @param {{ cwd?: string }} [options]
 * @returns {string} trimmed stdout
 */
function git(args, { cwd = REPO_ROOT } = {}) {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 1 << 26,
  }).trim();
}

/**
 * The main checkout: the first entry of `git worktree list`, whichever worktree this runs in.
 * @returns {string}
 */
export function mainCheckout() {
  const first = git(['worktree', 'list', '--porcelain']).split('\n')[0];
  return first.replace(/^worktree /, '');
}

/**
 * Where the worktree for `version` lives.
 * @param {string} version
 * @returns {string}
 */
export function releaseTreeDir(version) {
  const main = mainCheckout();
  const dir = path.join(path.dirname(main), 'warp-drive-worktrees', 'releases', version);
  for (const repo of new Set([main, REPO_ROOT])) {
    const rel = path.relative(repo, dir);
    if (!rel.startsWith('..') && !path.isAbsolute(rel)) {
      throw new Error(`release worktree ${dir} would be inside ${repo}`);
    }
  }
  return dir;
}

/**
 * @param {string} version
 * @returns {string | null} the git tag of a release, null for `head`
 */
export function tagOf(version) {
  return version === 'head' ? null : `v${version}`;
}

/**
 * @param {string} dir
 * @returns {boolean} whether git knows `dir` as a worktree of this repository
 */
function isRegisteredWorktree(dir) {
  return git(['worktree', 'list', '--porcelain'])
    .split('\n')
    .some((line) => line === `worktree ${dir}`);
}

/**
 * @param {string} dir
 * @param {string} commit
 * @returns {boolean} whether `dir` is a clean worktree of this repository at `commit`
 */
function isReusable(dir, commit) {
  try {
    return (
      isRegisteredWorktree(dir) &&
      git(['rev-parse', 'HEAD'], { cwd: dir }) === commit &&
      git(['status', '--porcelain', '--untracked-files=no'], { cwd: dir }) === ''
    );
  } catch {
    return false;
  }
}

/**
 * Checks out `v<version>` as a detached worktree, reusing one an earlier run left at the same
 * commit and replacing anything else found at that path.
 * @param {string} version
 * @returns {string} the worktree directory
 */
export function addReleaseTree(version) {
  const tag = /** @type {string} */ (tagOf(version));
  let commit;
  try {
    commit = git(['rev-parse', '--verify', '--quiet', `${tag}^{commit}`]);
  } catch {
    throw new Error(`tag ${tag} does not exist in this repository (fetch tags first: git fetch --tags)`);
  }
  const dir = releaseTreeDir(version);
  if (existsSync(dir)) {
    if (isReusable(dir, commit)) return dir;
    removeReleaseTree(version);
  }
  mkdirSync(path.dirname(dir), { recursive: true });
  git(['worktree', 'add', '--detach', '--force', dir, commit]);
  return dir;
}

/**
 * Removes the worktree for `version` and its directory, tolerating either being gone already.
 * @param {string} version
 */
export function removeReleaseTree(version) {
  const dir = releaseTreeDir(version);
  try {
    git(['worktree', 'remove', '--force', '--force', dir]);
  } catch {
    // not a registered worktree (or already gone): clear the directory below
  }
  rmSync(dir, { recursive: true, force: true });
  git(['worktree', 'prune']);
}

/**
 * Runs `fn` against the tree of `version`: the working tree for `head`, else a worktree of
 * `v<version>` that is removed afterwards unless `keep` is set.
 * @template T
 * @param {string} version
 * @param {(dir: string) => T | Promise<T>} fn
 * @param {{ keep?: boolean }} [options]
 * @returns {Promise<T>}
 */
export async function withReleaseTree(version, fn, { keep = false } = {}) {
  if (version === 'head') return fn(REPO_ROOT);
  const dir = addReleaseTree(version);
  try {
    return await fn(dir);
  } finally {
    if (!keep) removeReleaseTree(version);
  }
}
