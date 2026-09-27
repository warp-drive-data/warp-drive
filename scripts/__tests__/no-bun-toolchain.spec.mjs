import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { test } from 'node:test';

/**
 * Grep gate: bun is no longer part of this repo's own toolchain. Every script
 * runs under node, CI installs only node and pnpm, and mise pins only those.
 *
 * This spec greps the tracked tree for `bun` as a word, or `Bun.`, and fails on
 * any hit that the allowlist below does not explain. If it fails on a change you
 * made, prefer the node/pnpm form (`pnpm <bin>`, `node <file>`) over adding an
 * entry. Add an entry only for something that is about *consumers* of the
 * published packages, who may well use bun, and say why in `why`.
 *
 * `bunx` does not match the pattern, so consumer docs mentioning it
 * (e.g. `upgrading/v5/codemods.md`) need no entry.
 */

const REPO_ROOT = path.resolve(import.meta.dirname, '../..');

// `git grep` is case-insensitive and substring-based so the pattern works with
// every platform's regex engine; the precise match happens in JS below.
const PATTERN = /\bbun\b|bun\./i;

// Excluded from the grep itself rather than allowlisted, because their hits are
// not prose or config. Binary files are skipped by `-I`.
const EXCLUDED_PATHSPECS = [
  // Resolved package names and tarball URLs of third-party dependencies.
  ':!pnpm-lock.yaml',
  // Logos embed base64 image data, which contains `bun` by chance.
  ':!*.svg',
];

/**
 * Every allowed hit. A hit is allowed when its path matches `path` and, if
 * `lines` is given, its text matches one of `lines`. Entries that no longer
 * match anything fail the spec too, so this list cannot outlive what it covers.
 *
 * @type {Array<{ path: RegExp, lines?: RegExp[], why: string }>}
 */
const ALLOWLIST = [
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
      /^\s*- uses: oven-sh\/setup-bun@[0-9a-f]{40} # v\d/,
      /^\s*bun-version: /,
      /^\s*- name: Smoke test \(bun\)$/,
      /verify-tarball\.mjs --tarball "\$TARBALL" --pm bun$/,
      // the comment explaining why yarn dlx is not covered by the smoke tests
      /# directly rather than via the shebang, so npm\/pnpm\/bun already cover$/,
    ],
    why: 'Only the codemods consumer smoke test installs and runs bun in CI.',
  },

  // ---- Leftovers owned by the node conversion PRs --------------------------
  // Remove each entry once the file stops mentioning bun.
  {
    path: /^packages\/diagnostic\/README\.md$/,
    why: 'Consumer setup section still says the diagnostic runner needs bun installed.',
  },
  {
    path: /^(scripts\/__tests__\/(-run-script|explain\.spec)\.mjs|tools\/internal-tooling\/tests\/(-fixture|run-prettier\.spec)\.ts|packages\/schema\/tests\/helpers\.ts)$/,
    why: 'Spec harness comments from the conversion, when the specs also had to pass under bun.',
  },

  // ---- This file -----------------------------------------------------------
  {
    path: /^scripts\/__tests__\/no-bun-toolchain\.spec\.mjs$/,
    why: 'The gate has to name what it looks for.',
  },
];

function grepBun() {
  const result = spawnSync(
    'git',
    ['grep', '-I', '-n', '-i', '--full-name', '-e', 'bun', '--', '.', ...EXCLUDED_PATHSPECS],
    { cwd: REPO_ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }
  );
  // exit 1 means "no matches"
  if (result.status === 1) return [];
  assert.equal(result.status, 0, `git grep failed: ${result.stderr}`);

  return result.stdout
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const [, file, lineNo, text] = /^(.*?):(\d+):(.*)$/.exec(line);
      return { file, lineNo: Number(lineNo), text };
    })
    .filter((hit) => PATTERN.test(hit.text));
}

function allows(entry, hit) {
  return entry.path.test(hit.file) && (!entry.lines || entry.lines.some((re) => re.test(hit.text)));
}

test('bun is mentioned only where the allowlist explains why', () => {
  const hits = grepBun();
  const unexplained = hits.filter((hit) => !ALLOWLIST.some((entry) => allows(entry, hit)));

  assert.deepEqual(
    unexplained.map((hit) => `${hit.file}:${hit.lineNo}: ${hit.text.trim()}`),
    [],
    'Replace these with the node/pnpm form, or add an allowlist entry that explains why bun belongs there.'
  );
});

test('every allowlist entry still matches something', () => {
  const hits = grepBun();
  const unused = ALLOWLIST.filter((entry) => !hits.some((hit) => allows(entry, hit)));

  assert.deepEqual(
    unused.map((entry) => `${entry.path} (${entry.why})`),
    [],
    'Remove allowlist entries that no longer match any file.'
  );
});
