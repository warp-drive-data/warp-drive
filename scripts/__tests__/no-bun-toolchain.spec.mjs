import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { test } from 'node:test';

/**
 * Grep gate: bun is no longer part of this repo's own toolchain. Every script
 * runs under node, CI installs only node and pnpm, and mise pins only those.
 *
 * This spec greps the tracked tree, file contents and file paths, for bun and
 * fails on any hit that the allowlists below do not explain. If it fails on a
 * change you made, prefer the node/pnpm form (`pnpm <bin>`, `node <file>`) over
 * adding an entry. Add an entry only for something that is about *consumers* of
 * the published packages, who may well use bun, and say why in `why`.
 *
 * `bunx` does not match the pattern, so consumer docs mentioning it
 * (e.g. `upgrading/v5/codemods.md`) need no entry.
 */

const REPO_ROOT = path.resolve(import.meta.dirname, '../..');

// `bun` not touching another letter, so `bun-types`, `@types/bun`, `Bun.serve`,
// `BUN_INSTALL` and `bun.lock` match while `bundle` and `ubuntu` do not; plus
// `bunfig`, bun's config file. `git grep` only prefilters on the substring
// `bun` so the pattern does not depend on the platform's regex engine.
const PATTERN = /(?<![A-Za-z])bun(?![A-Za-z])|bunfig/i;

// Excluded from the content grep rather than allowlisted, because their hits are
// not prose or config. Binary files are skipped by `-I`.
const EXCLUDED_PATHSPECS = [
  // Resolved package names and tarball URLs of third-party dependencies.
  ':!pnpm-lock.yaml',
  // Logos embed base64 image data, which contains `bun` by chance.
  ':!*.svg',
];

/**
 * @typedef {{ path: RegExp, lines?: RegExp[], why: string }} AllowlistEntry
 *
 * A hit is allowed when its path matches `path` and, if `lines` is given, its
 * text matches one of `lines`. Every entry, and every regex in `lines`, must
 * still match at least one hit, so this list cannot outlive what it covers.
 */

/** Allowed mentions of bun inside tracked files. @type {AllowlistEntry[]} */
const CONTENT_ALLOWLIST = [
  // ---- History -------------------------------------------------------------
  {
    path: /(^|\/)CHANGELOG\.md$/,
    why: 'Changelogs record past PR titles, some of which mention bun. History is not rewritten.',
  },

  // ---- Consumers who use bun as their package manager or runtime -----------
  {
    path: /^(guides\/(installation|configuration\/legacy-package-setup|linting)\/index\.md|guides\/the-manual\/testing\/server-setup\.md|upgrading\/v5\/index\.md|packages\/active-record\/src\/index\.md|warp-drive-packages\/build-config\/src\/canary-features\.ts)$/,
    lines: [/```sh \[bun\]/, /\bbun add\b/],
    why: 'Install instructions show a bun tab next to npm/pnpm/yarn for apps that use bun.',
  },
  {
    path: /^packages\/-warp-drive\/src\/-private\/shared\/npm\.ts$/,
    lines: [/'bun'/, /bun\.lock/],
    why: "The warp-drive CLI detects the consuming app's package manager from its lockfile.",
  },
  {
    path: /^packages\/(diagnostic|holodeck)\/package\.json$/,
    lines: [/^\s*"bun": "\.\//],
    why: 'The "bun" export condition lets consumers load the test/mock server under bun.',
  },
  {
    path: /^(packages\/holodeck\/server\/utils\.js|packages\/diagnostic\/server\/src\/index\.ts)$/,
    lines: [/Bun\.serve/],
    why: 'Comments explaining how bind failures differ between Bun.serve and node servers.',
  },
  {
    path: /^tests\/codemods\/scripts\/verify-tarball\.mjs$/,
    why: 'Smoke test that installs the packed codemods tarball the way npm, pnpm and bun users do.',
  },
  {
    path: /^\.github\/workflows\/main\.yml$/,
    lines: [
      // the codemods-packaging job's bun consumer smoke test and its setup step
      /^\s*# bun is installed here only to test consumers who install the codemods tarball with bun\.$/,
      /^\s*# Pinned by hand: renovate no longer tracks bun\./,
      /^\s*- uses: oven-sh\/setup-bun@[0-9a-f]{40} # v\d/,
      /^\s*bun-version: \d+\.\d+\.\d+$/,
      /^\s*- name: Smoke test \(bun\)$/,
      /verify-tarball\.mjs --tarball "\$TARBALL" --pm bun$/,
      // the comment explaining why yarn dlx is not covered by the smoke tests
      /# directly rather than via the shebang, so npm\/pnpm\/bun already cover$/,
    ],
    why: 'Only the codemods consumer smoke test installs and runs bun in CI.',
  },

  // ---- This file -----------------------------------------------------------
  {
    path: /^scripts\/__tests__\/no-bun-toolchain\.spec\.mjs$/,
    why: 'The gate has to name what it looks for.',
  },
];

/** Allowed tracked files whose path mentions bun. @type {AllowlistEntry[]} */
const PATH_ALLOWLIST = [
  {
    path: /^scripts\/__tests__\/no-bun-toolchain\.spec\.mjs$/,
    why: 'This file. Anything else, such as a bun.lock or bunfig.toml, means bun crept back in.',
  },
];

function git(args) {
  const result = spawnSync('git', args, { cwd: REPO_ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  if (result.error) throw result.error;
  return result;
}

/**
 * Content hits. `-z` separates path, line number and text with NUL, so paths
 * containing `:` parse correctly.
 */
function grepContents() {
  const result = git(['grep', '-z', '-I', '-n', '-i', '--full-name', '-e', 'bun', '--', '.', ...EXCLUDED_PATHSPECS]);
  // exit 1 means "no matches"
  if (result.status === 1) return [];
  assert.equal(result.status, 0, `git grep failed: ${result.stderr}`);

  return result.stdout
    .split('\n')
    .filter(Boolean)
    .map((record) => {
      const [file, lineNo, ...rest] = record.split('\0');
      return { file, lineNo: Number(lineNo), text: rest.join('\0') };
    })
    .filter((hit) => PATTERN.test(hit.text));
}

/** Tracked files whose path mentions bun. */
function grepPaths() {
  const result = git(['ls-files', '-z']);
  assert.equal(result.status, 0, `git ls-files failed: ${result.stderr}`);
  return result.stdout
    .split('\0')
    .filter((file) => file && PATTERN.test(file))
    .map((file) => ({ file, text: file }));
}

const CONTENT_HITS = grepContents();
const PATH_HITS = grepPaths();

function allows(entry, hit) {
  return entry.path.test(hit.file) && (!entry.lines || entry.lines.some((re) => re.test(hit.text)));
}

function unexplained(hits, allowlist) {
  return hits.filter((hit) => !allowlist.some((entry) => allows(entry, hit)));
}

/** Entries, or individual `lines` regexes, that no hit uses any more. */
function stale(hits, allowlist) {
  const unused = [];
  for (const entry of allowlist) {
    const inPath = hits.filter((hit) => entry.path.test(hit.file));
    if (inPath.length === 0) {
      unused.push(`${entry.path} (${entry.why})`);
      continue;
    }
    for (const re of entry.lines ?? []) {
      if (!inPath.some((hit) => re.test(hit.text))) unused.push(`${entry.path} lines ${re} (${entry.why})`);
    }
  }
  return unused;
}

test('bun is mentioned only where the allowlist explains why', () => {
  assert.deepEqual(
    unexplained(CONTENT_HITS, CONTENT_ALLOWLIST).map((hit) => `${hit.file}:${hit.lineNo}: ${hit.text.trim()}`),
    [],
    'Replace these with the node/pnpm form, or add an allowlist entry that explains why bun belongs there.'
  );
});

test('no tracked file is named after bun', () => {
  assert.deepEqual(
    unexplained(PATH_HITS, PATH_ALLOWLIST).map((hit) => hit.file),
    [],
    'bun lockfiles and config (bun.lock, bunfig.toml) do not belong in this repo.'
  );
});

test('every allowlist entry and line pattern still matches something', () => {
  assert.deepEqual(
    [...stale(CONTENT_HITS, CONTENT_ALLOWLIST), ...stale(PATH_HITS, PATH_ALLOWLIST)],
    [],
    'Remove allowlist entries, or `lines` patterns, that no longer match anything.'
  );
});
