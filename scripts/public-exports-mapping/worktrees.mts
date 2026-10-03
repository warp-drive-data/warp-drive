/**
 * A detached git worktree per release tag, next to the main checkout and never inside it:
 * `<main checkout>/../warp-drive-worktrees/releases/<version>`. `head` is the working tree itself.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';

import { REPO_ROOT } from './artifacts.mts';

/**
 * @returns trimmed stdout
 */
function git(args: string[], { cwd = REPO_ROOT }: { cwd?: string } = {}): string {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 1 << 26,
  }).trim();
}

/**
 * The main checkout: the first entry of `git worktree list`, whichever worktree this runs in.
 */
export function mainCheckout(): string {
  const first = git(['worktree', 'list', '--porcelain']).split('\n')[0];
  return first.replace(/^worktree /, '');
}

/**
 * Where the worktree for `version` lives.
 */
export function releaseTreeDir(version: string): string {
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
 * @returns the git tag of a release, null for `head`
 */
export function tagOf(version: string): string | null {
  return version === 'head' ? null : `v${version}`;
}

/**
 * @returns whether git knows `dir` as a worktree of this repository
 */
function isRegisteredWorktree(dir: string): boolean {
  return git(['worktree', 'list', '--porcelain'])
    .split('\n')
    .some((line) => line === `worktree ${dir}`);
}

/**
 * @returns whether `dir` is a clean worktree of this repository at `commit`
 */
function isReusable(dir: string, commit: string): boolean {
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
 * @returns the worktree directory
 */
export function addReleaseTree(version: string): string {
  const tag = tagOf(version) as string;
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
 */
export function removeReleaseTree(version: string) {
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
 */
export async function withReleaseTree<T>(
  version: string,
  fn: (dir: string) => T | Promise<T>,
  { keep = false }: { keep?: boolean } = {}
): Promise<T> {
  if (version === 'head') return fn(REPO_ROOT);
  const dir = addReleaseTree(version);
  try {
    return await fn(dir);
  } finally {
    if (!keep) removeReleaseTree(version);
  }
}
