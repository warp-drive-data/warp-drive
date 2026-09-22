#!/usr/bin/env node
// Outbound half of the emberjs/rfcs sync bot: run on every push to `main` that touches
// `rfcs/**`. For each changed RFC, either opens a brand-new PR against emberjs/rfcs (via the
// bot's own fork) or pushes an update to the fork branch backing an already-open PR. See
// README.md in this directory for the full design and the one-time setup this requires.
//
// Never touches emberjs/rfcs directly -- every write goes through the bot's own fork, and every
// change on the warp-drive side lands as its own PR rather than a direct push to `main`.

import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, renameSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  docsPreviewRfcUrl,
  docsSiteRfcUrl,
  getScalar,
  joinFrontmatter,
  setNestedScalar,
  setScalar,
  sha256,
  slugify,
  splitFrontmatter,
  toUpstreamContent,
  upstreamTitle,
  withH1,
} from './common.mjs';

// A snapshot of emberjs/rfcs' own .github/pull_request_template.md -- update this if upstream
// changes theirs. Filled in and used as-is (see buildEmberjsRfcPrBody) rather than replaced with
// a one-line summary, so reviewers there see the same stage checklists and process notes a
// hand-authored RFC PR would have.
const EMBERJS_PR_TEMPLATE_PATH = fileURLToPath(new URL('./emberjs-pr-template.md', import.meta.url));

const TOKEN = process.env.EMBERJS_RFCS_SYNC_TOKEN;
const FORK = process.env.EMBERJS_RFCS_SYNC_FORK; // e.g. "warpdrive-bot/emberjs-rfcs"
const GIT_NAME = process.env.EMBERJS_RFCS_SYNC_NAME;
const GIT_EMAIL = process.env.EMBERJS_RFCS_SYNC_EMAIL;
// Overridable so the first real run of this script can be a dry run against a disposable test
// repo instead of the genuine emberjs/rfcs -- see the workflow_dispatch input on
// rfc-sync-outbound.yml and the "Dry run" section of README.md.
const UPSTREAM = process.env.EMBERJS_RFCS_SYNC_UPSTREAM || 'emberjs/rfcs';
const RFCS_DIR = join(process.cwd(), 'rfcs');

if (!TOKEN || !FORK || !GIT_NAME || !GIT_EMAIL) {
  console.log(
    'rfc-sync: EMBERJS_RFCS_SYNC_TOKEN/_FORK/_NAME/_EMAIL are not fully configured -- skipping ' +
      'outbound sync. See scripts/rfc-sync/README.md for the one-time setup required.'
  );
  process.exit(0);
}

function sh(cmd, args, opts = {}) {
  return execFileSync(cmd, args, { encoding: 'utf8', ...opts }).trim();
}

function ghApi(args) {
  return sh('gh', ['api', ...args], { env: { ...process.env, GH_TOKEN: TOKEN } });
}

function lastCommitAuthor(file) {
  const [name, email] = sh('git', ['log', '-1', '--format=%an\t%ae', '--', file]).split('\t');
  return { name, email };
}

function lastCommitSha(file) {
  return sh('git', ['log', '-1', '--format=%H', '--', file]);
}

/** Finds the warp-drive PR that carried the commit which last touched `file` on `main` -- that PR
 * is the actual source of truth this emberjs/rfcs PR mirrors (see buildEmberjsRfcPrBody's
 * "Upstream" link). Returns null if the commit landed on `main` without an associated PR (e.g. an
 * admin direct push), in which case there's nothing to link. */
function findWarpDrivePr(sha) {
  const prs = JSON.parse(ghApi([`repos/${process.env.GITHUB_REPOSITORY}/commits/${sha}/pulls`]));
  return prs.find((pr) => pr.merged_at) ?? prs[0] ?? null;
}

/** Builds the body for a freshly-opened emberjs/rfcs PR: emberjs/rfcs' own PR template (see
 * EMBERJS_PR_TEMPLATE_PATH) with its instructional comments stripped, `{{RFC_NAME}}` filled in,
 * an "Upstream" link to `warpDrivePr` added at the top, and its "Rendered" link pointed at the
 * production docs site if `warpDrivePr` has merged (the normal case, since this script only ever
 * runs against commits already on `main`) or that PR's own docs preview otherwise. */
function buildEmberjsRfcPrBody({ rfcFileName, upstreamRfcTitle, warpDrivePr }) {
  const renderedUrl =
    warpDrivePr && !warpDrivePr.merged_at
      ? docsPreviewRfcUrl(warpDrivePr.number, rfcFileName)
      : docsSiteRfcUrl(rfcFileName);
  const template = readFileSync(EMBERJS_PR_TEMPLATE_PATH, 'utf8')
    .replace(/<!--[\s\S]*?-->\n*/g, '')
    .replace('{{RFC_NAME}}', upstreamRfcTitle)
    .replace(/^## \[Rendered\]\(.*\)$/m, `## [Rendered](${renderedUrl})`);
  const upstreamLine = warpDrivePr ? `Upstream: ${warpDrivePr.html_url}\n\n` : '';
  return `${upstreamLine}${template}`;
}

function listChangedRfcs() {
  return readdirSync(RFCS_DIR)
    .filter((f) => /^\d{4}-.*\.md$/.test(f) && f !== '0000-template.md')
    .map((f) => join(RFCS_DIR, f));
}

const forkDir = mkdtempSync(join(tmpdir(), 'rfc-sync-'));
sh('git', ['clone', '--quiet', `https://x-access-token:${TOKEN}@github.com/${FORK}.git`, forkDir]);
sh('git', ['-C', forkDir, 'remote', 'add', 'upstream', `https://github.com/${UPSTREAM}.git`]);
sh('git', ['-C', forkDir, 'fetch', '--quiet', 'upstream', 'main']);
sh('git', ['-C', forkDir, 'config', 'user.name', GIT_NAME]);
sh('git', ['-C', forkDir, 'config', 'user.email', GIT_EMAIL]);

function commitAndPush(branch, message, author) {
  sh('git', ['-C', forkDir, 'add', '-A']);
  sh('git', ['-C', forkDir, 'commit', '--quiet', `--author=${author.name} <${author.email}>`, '-m', message]);
  sh('git', ['-C', forkDir, 'push', '--quiet', 'origin', branch]);
}

/** Opens (or reopens a branch for) a follow-up PR into warp-drive-data/warp-drive that records
 * the sync bot's own bookkeeping (emberjs-rfc/emberjs-pr/emberjs-branch/sync-hash) -- this never
 * pushes straight to `main`, so a human still reviews what the bot recorded.
 *
 * The PR is opened with the bot's own EMBERJS_RFCS_SYNC_TOKEN, not the workflow's default
 * GITHUB_TOKEN. Opening a PR against a public repo (unlike pushing to one, or merging one)
 * doesn't require collaborator access on GitHub -- any authenticated account can do it, which is
 * also why the bot can open PRs against emberjs/rfcs despite not being a collaborator there
 * either. Using its own token here means this workflow never needs "Allow GitHub Actions to
 * create and approve pull requests" turned on repo-wide -- a much bigger grant (every workflow's
 * default token, not just this script's own credential) than this one feature should require. */
function openWarpDriveFollowupPr(file, branchSuffix, title, body) {
  const branch = `rfc-sync/${branchSuffix}`;
  sh('git', ['checkout', '-b', branch]);
  sh('git', ['add', file]);
  sh('git', ['-c', `user.name=${GIT_NAME}`, '-c', `user.email=${GIT_EMAIL}`, 'commit', '-m', title]);
  sh('git', ['push', '--quiet', '-u', 'origin', branch]);
  sh('gh', ['pr', 'create', '--title', title, '--body', body, '--label', ':label: rfc', '--head', branch], {
    env: { ...process.env, GH_TOKEN: TOKEN },
  });
  sh('git', ['checkout', '-']);
}

let hadFailure = false;

for (const file of listChangedRfcs()) {
  try {
    syncOne(file);
  } catch (error) {
    // One RFC's failure (e.g. a transient API error, or the follow-up PR being rejected for a
    // reason specific to that file) shouldn't stop every other RFC in this push from syncing --
    // report it and move on, but still fail the job overall so it's visible.
    hadFailure = true;
    console.error(`rfc-sync: failed to sync ${file}:`, error.message ?? error);
  }
}

if (hadFailure) {
  process.exitCode = 1;
}

function syncOne(file) {
  const raw = readFileSync(file, 'utf8');
  const { lines, body } = splitFrontmatter(raw);

  const warpDriveRfc = getScalar(lines, 'warp-drive-rfc');
  const emberjsRfc = getScalar(lines, 'emberjs-rfc');
  const emberjsBranch = getScalar(lines, 'emberjs-branch');
  const title = getScalar(lines, 'title') ?? `RFC ${warpDriveRfc}`;
  const upstreamRfcTitle = upstreamTitle(title);
  const currentHash = sha256(body);
  const storedHash = getScalar(lines, 'sync-hash');

  if (currentHash === storedHash) {
    return; // nothing changed since the last sync in either direction
  }

  const author = lastCommitAuthor(file);
  const upstreamContent = toUpstreamContent(lines, withH1(body, upstreamRfcTitle));

  if (!emberjsRfc) {
    // --- New RFC: open a fresh PR against emberjs/rfcs from the bot's fork ---
    const slug = slugify(title);
    const branch = `rfc-${warpDriveRfc}-${slug}`;
    sh('git', ['-C', forkDir, 'checkout', '-b', branch, 'upstream/main']);
    const placeholderPath = join(forkDir, 'text', `0000-${slug}.md`);
    writeFileSync(placeholderPath, upstreamContent, 'utf8');
    commitAndPush(branch, `Add RFC: ${upstreamRfcTitle}`, author);

    const warpDrivePr = findWarpDrivePr(lastCommitSha(file));
    const prJson = JSON.parse(
      ghApi([
        `repos/${UPSTREAM}/pulls`,
        '-f',
        `title=${upstreamRfcTitle}`,
        '-f',
        `head=${FORK.split('/')[0]}:${branch}`,
        '-f',
        'base=main',
        '-f',
        `body=${buildEmberjsRfcPrBody({ rfcFileName: basename(file), upstreamRfcTitle, warpDrivePr })}`,
        '-F',
        'maintainer_can_modify=true',
      ])
    );
    const prNumber = String(prJson.number);
    const prUrl = prJson.html_url;

    // Rename the placeholder to match the assigned PR number and fill `prs.accepted`, matching
    // the convention already used by hand-authored emberjs/rfcs PRs.
    const finalPath = join(forkDir, 'text', `${prNumber}-${slug}.md`);
    renameSync(placeholderPath, finalPath);
    const upstreamLines = splitFrontmatter(readFileSync(finalPath, 'utf8')).lines;
    setNestedScalar(upstreamLines, 'prs', 'accepted', prUrl);
    writeFileSync(finalPath, joinFrontmatter(upstreamLines, body), 'utf8');
    commitAndPush(branch, `RFC #${prNumber}: fill prs.accepted and rename file with PR number`, {
      name: GIT_NAME,
      email: GIT_EMAIL,
    });

    setScalar(lines, 'emberjs-rfc', prNumber);
    setScalar(lines, 'emberjs-pr', prUrl);
    setScalar(lines, 'emberjs-branch', branch);
    setScalar(lines, 'sync-hash', currentHash);
    writeFileSync(file, joinFrontmatter(lines, body), 'utf8');
    openWarpDriveFollowupPr(
      file,
      `adopt-${warpDriveRfc}`,
      `rfcs: record emberjs/rfcs#${prNumber} for RFC ${warpDriveRfc}`,
      `Automated follow-up from the outbound sync run that opened ${prUrl}.`
    );
  } else if (emberjsBranch) {
    // --- Existing RFC: push an update to the fork branch backing its open PR ---
    sh('git', ['-C', forkDir, 'fetch', '--quiet', 'origin', emberjsBranch]);
    sh('git', ['-C', forkDir, 'checkout', emberjsBranch]);
    const existing = readdirSync(join(forkDir, 'text')).find((f) => f.startsWith(`${emberjsRfc}-`));
    if (!existing) {
      console.warn(`rfc-sync: could not find text/${emberjsRfc}-*.md on ${FORK}#${emberjsBranch}; skipping ${file}`);
      return;
    }
    const existingPath = join(forkDir, 'text', existing);
    // The prose is ours; stage/release-date/release-versions/prs are the upstream process's own
    // fields (advanced by maintainers via emberjs/rfcs PRs) -- keep them as fetched, only
    // replace the body.
    const upstreamLines = splitFrontmatter(readFileSync(existingPath, 'utf8')).lines;
    writeFileSync(existingPath, joinFrontmatter(upstreamLines, withH1(body, upstreamRfcTitle)), 'utf8');
    commitAndPush(emberjsBranch, `Update RFC #${emberjsRfc} from warp-drive-data/warp-drive`, author);

    setScalar(lines, 'sync-hash', currentHash);
    writeFileSync(file, joinFrontmatter(lines, body), 'utf8');
    openWarpDriveFollowupPr(
      file,
      `hash-${warpDriveRfc}-${currentHash.slice(0, 8)}`,
      `rfcs: record sync-hash after pushing to emberjs/rfcs#${emberjsRfc}`,
      `Automated follow-up from the outbound sync run that updated ${getScalar(lines, 'emberjs-pr')}.`
    );
  } else {
    console.warn(
      `rfc-sync: ${file} has emberjs-rfc set but no emberjs-branch -- a maintainer needs to fill it in (see rfcs/index.md); skipping.`
    );
  }
}
