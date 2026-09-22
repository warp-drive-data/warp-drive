#!/usr/bin/env node
// Inbound half of the emberjs/rfcs sync bot: run on a schedule. For each local RFC that's
// already been mirrored upstream, checks whether its emberjs/rfcs fork branch moved since our
// last sync -- e.g. a reviewer applying a suggested edit via "allow edits from maintainers" --
// and if so, opens a PR back into warp-drive-data/warp-drive with that change, crediting whoever
// actually made it upstream. See README.md in this directory for the full design.
//
// Only ever opens a PR into warp-drive-data/warp-drive; never pushes to `main` directly, and
// never touches emberjs/rfcs or the bot's fork.

import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  getNestedScalar,
  getScalar,
  joinFrontmatter,
  setNestedScalar,
  setScalar,
  sha256,
  splitFrontmatter,
} from './common.mjs';

const TOKEN = process.env.EMBERJS_RFCS_SYNC_TOKEN;
const FORK = process.env.EMBERJS_RFCS_SYNC_FORK; // e.g. "warpdrive-bot/emberjs-rfcs"
const GIT_NAME = process.env.EMBERJS_RFCS_SYNC_NAME;
const GIT_EMAIL = process.env.EMBERJS_RFCS_SYNC_EMAIL;
const RFCS_DIR = join(process.cwd(), 'rfcs');

if (!TOKEN || !FORK || !GIT_NAME || !GIT_EMAIL) {
  console.log(
    'rfc-sync: EMBERJS_RFCS_SYNC_TOKEN/_FORK/_NAME/_EMAIL are not fully configured -- skipping ' +
      'inbound sync. See scripts/rfc-sync/README.md for the one-time setup required.'
  );
  process.exit(0);
}

function sh(cmd, args, opts = {}) {
  return execFileSync(cmd, args, { encoding: 'utf8', ...opts }).trim();
}

function ghApiJson(path) {
  return JSON.parse(sh('gh', ['api', path], { env: { ...process.env, GH_TOKEN: TOKEN } }));
}

function listTrackedRfcs() {
  return readdirSync(RFCS_DIR)
    .filter((f) => /^\d{4}-.*\.md$/.test(f) && f !== '0000-template.md')
    .map((f) => join(RFCS_DIR, f));
}

let openedAny = false;

for (const file of listTrackedRfcs()) {
  const raw = readFileSync(file, 'utf8');
  const { lines } = splitFrontmatter(raw);

  const emberjsRfc = getScalar(lines, 'emberjs-rfc');
  const emberjsBranch = getScalar(lines, 'emberjs-branch');
  if (!emberjsRfc || !emberjsBranch) continue; // not yet mirrored upstream -- nothing to poll

  const latestCommit = ghApiJson(`repos/${FORK}/commits/${emberjsBranch}`);
  const commitAuthor = latestCommit.commit.author; // { name, email, date }
  if (commitAuthor.email === GIT_EMAIL) {
    continue; // the bot's own last outbound push -- no upstream-originated drift to pull in
  }

  const forkDir = mkdtempSync(join(tmpdir(), 'rfc-sync-'));
  sh('git', ['clone', '--quiet', '--depth', '1', '--branch', emberjsBranch, `https://github.com/${FORK}.git`, forkDir]);
  const upstreamFile = readdirSync(join(forkDir, 'text')).find((f) => f.startsWith(`${emberjsRfc}-`));
  if (!upstreamFile) {
    console.warn(`rfc-sync: could not find text/${emberjsRfc}-*.md on ${FORK}#${emberjsBranch}; skipping ${file}`);
    continue;
  }
  const upstreamRaw = readFileSync(join(forkDir, 'text', upstreamFile), 'utf8');
  const upstream = splitFrontmatter(upstreamRaw);
  const upstreamHash = sha256(upstream.body);
  const storedHash = getScalar(lines, 'sync-hash');

  if (upstreamHash === storedHash) {
    continue; // the branch moved, but not in a way that changed the RFC's text (e.g. a stage relabel)
  }

  // Body is upstream's now; stage/release-date/release-versions/prs.accepted are the upstream
  // process's own fields, so pull those in too rather than leaving our stale copy.
  for (const key of ['stage', 'release-date', 'release-versions']) {
    const value = getScalar(upstream.lines, key);
    if (value !== null) setScalar(lines, key, value);
  }
  const accepted = getNestedScalar(upstream.lines, 'prs', 'accepted');
  if (accepted !== null) setNestedScalar(lines, 'prs', 'accepted', accepted);
  setScalar(lines, 'sync-hash', upstreamHash);
  writeFileSync(file, joinFrontmatter(lines, upstream.body), 'utf8');

  const warpDriveRfc = getScalar(lines, 'warp-drive-rfc');
  const branch = `rfc-sync/inbound-${warpDriveRfc}-${upstreamHash.slice(0, 8)}`;
  sh('git', ['checkout', '-b', branch]);
  sh('git', ['add', file]);
  sh('git', [
    '-c',
    `user.name=${commitAuthor.name}`,
    '-c',
    `user.email=${commitAuthor.email}`,
    'commit',
    '-m',
    `rfcs: pull in emberjs/rfcs#${emberjsRfc} changes from ${commitAuthor.name}`,
  ]);
  sh('git', ['push', '--quiet', '-u', 'origin', branch]);
  // Opened with the bot's own token, not the workflow's default GITHUB_TOKEN -- see the comment
  // on openWarpDriveFollowupPr in push-outbound.mjs for why.
  sh(
    'gh',
    [
      'pr',
      'create',
      '--title',
      `rfcs: sync RFC ${warpDriveRfc} from emberjs/rfcs#${emberjsRfc}`,
      '--body',
      `Pulled in from https://github.com/${FORK}/tree/${emberjsBranch} (emberjs/rfcs#${emberjsRfc}), authored by ${commitAuthor.name}.`,
      '--label',
      ':label: rfc',
      '--head',
      branch,
    ],
    { env: { ...process.env, GH_TOKEN: TOKEN } }
  );
  sh('git', ['checkout', '-']);
  openedAny = true;
}

if (!openedAny) {
  console.log('rfc-sync: no upstream changes found to pull in.');
}
