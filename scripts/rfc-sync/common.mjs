// Shared helpers for the emberjs/rfcs sync bot (see README.md in this directory).
//
// This repo has no YAML/frontmatter parsing package at the root, and the frontmatter shape
// every rfcs/*.md file uses is small and fully under our own control (flat scalars, one `teams`
// list, one `prs` object with a single `accepted` key) -- so rather than add a new dependency,
// this is a hand-rolled parser/serializer targeted at exactly that shape. It is not a general
// YAML parser and should not be treated as one.

import { createHash } from 'node:crypto';

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;

/**
 * Splits a `000N-*.md` file's text into its frontmatter (as raw lines, one per array entry,
 * preserving original formatting) and its body (everything after the closing `---`).
 */
export function splitFrontmatter(text) {
  const match = FRONTMATTER_RE.exec(text);
  if (!match) {
    throw new Error('Expected a YAML frontmatter block delimited by --- lines');
  }
  return { lines: match[1].split('\n'), body: match[2] };
}

export function joinFrontmatter(lines, body) {
  return `---\n${lines.join('\n')}\n---\n${body}`;
}

/** Reads a top-level `key: value` scalar. Returns '' for a present-but-empty value, null if the key is absent. */
export function getScalar(lines, key) {
  const re = new RegExp(`^${key}:\\s*(.*)$`);
  for (const line of lines) {
    const m = re.exec(line);
    if (m) return m[1].trim().replace(/^['"]|['"]$/g, '');
  }
  return null;
}

/** Replaces a top-level `key: value` scalar's value in place. Throws if the key isn't present -- every field this bot touches must already exist (written by the RFC template), so a missing key means the file wasn't drafted from the template. */
export function setScalar(lines, key, value) {
  const re = new RegExp(`^(${key}:)\\s*.*$`);
  const idx = lines.findIndex((line) => re.test(line));
  if (idx === -1) {
    throw new Error(`Expected an existing "${key}:" line in frontmatter`);
  }
  lines[idx] = `${key}: ${value}`;
}

/** Reads a nested scalar, e.g. getNestedScalar(lines, 'prs', 'accepted') for `prs:\n  accepted: <value>`. */
export function getNestedScalar(lines, parentKey, childKey) {
  const parentIdx = lines.findIndex((line) => new RegExp(`^${parentKey}:\\s*$`).test(line));
  if (parentIdx === -1) return null;
  const childRe = new RegExp(`^\\s+${childKey}:\\s*(.*)$`);
  for (let i = parentIdx + 1; i < lines.length; i++) {
    if (!/^\s/.test(lines[i])) break; // left the nested block
    const m = childRe.exec(lines[i]);
    if (m) return m[1].trim().replace(/^['"]|['"]$/g, '');
  }
  return null;
}

export function setNestedScalar(lines, parentKey, childKey, value) {
  const parentIdx = lines.findIndex((line) => new RegExp(`^${parentKey}:\\s*$`).test(line));
  if (parentIdx === -1) {
    throw new Error(`Expected an existing "${parentKey}:" block in frontmatter`);
  }
  const childRe = new RegExp(`^(\\s+${childKey}:)\\s*.*$`);
  for (let i = parentIdx + 1; i < lines.length; i++) {
    if (!/^\s/.test(lines[i])) break;
    if (childRe.test(lines[i])) {
      const indent = /^\s+/.exec(lines[i])[0];
      lines[i] = `${indent}${childKey}: ${value}`;
      return;
    }
  }
  throw new Error(`Expected an existing "${childKey}:" line under "${parentKey}:" in frontmatter`);
}

export function sha256(text) {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

/** Our sync-tracking keys, layered on top of the fields emberjs/rfcs' own template uses -- stripped before content is pushed upstream, since they're meaningless there. */
export const WARP_DRIVE_ONLY_KEYS = [
  'title',
  // one-line summary for the docs site's llms.txt entry; emberjs/rfcs has no use for it
  'description',
  'warp-drive-rfc',
  'emberjs-rfc',
  'emberjs-pr',
  'emberjs-branch',
  'sync-hash',
];

/** Builds the frontmatter+body to publish upstream: same body, frontmatter stripped of our tracking-only keys. */
export function toUpstreamContent(lines, body) {
  const kept = lines.filter((line) => {
    const key = /^([A-Za-z-]+):/.exec(line)?.[1];
    return !key || !WARP_DRIVE_ONLY_KEYS.includes(key);
  });
  return joinFrontmatter(kept, body);
}

/**
 * Local titles are required (see rfcs/0000-template.md) not to start with "WarpDrive" -- this
 * adds that prefix back for the emberjs/rfcs copy and its PR title, so it's clear at a glance in
 * a repo covering all of Ember, not just WarpDrive, which RFCs are ours. Guarded rather than
 * unconditional in case a title is ever hand-edited to already include it.
 */
export function upstreamTitle(title) {
  return /^warpdrive\b[:-]?\s/i.test(title) ? title : `WarpDrive: ${title}`;
}

/** Replaces a markdown body's first H1 with `# <title>` -- used to keep the emberjs/rfcs copy's
 * heading in sync with its (prefixed) title without touching anything else in the body. */
export function withH1(body, title) {
  return body.replace(/^# .*$/m, `# ${title}`);
}

export function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// This is the actual host both .github/workflows/deploy.yml ("production") and
// .github/workflows/pr-preview.yml (per-PR previews) build and deploy the docs site to.
const DOCS_SITE_HOST = 'https://canary.warp-drive.io';

/** Canonical URL for an RFC once its content lives on `main` -- see
 * docs-viewer/src/prepare-website.ts (rfcs/ is synced verbatim into docs.warp-drive.io/rfcs/) and
 * that site's cleanUrls config (drops the .md extension). */
export function docsSiteRfcUrl(rfcFileName) {
  return `${DOCS_SITE_HOST}/rfcs/${rfcFileName.replace(/\.md$/, '')}`;
}

/** Per-PR docs preview URL for a warp-drive PR labeled `:label: rfc` -- see
 * .github/workflows/pr-preview.yml. Used for an RFC whose content hasn't merged into `main` yet. */
export function docsPreviewRfcUrl(prNumber, rfcFileName) {
  return `${DOCS_SITE_HOST}/pr-preview/pr-${prNumber}/rfcs/${rfcFileName.replace(/\.md$/, '')}`;
}
