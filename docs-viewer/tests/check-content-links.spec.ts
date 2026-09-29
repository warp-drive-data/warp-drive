#!/usr/bin/env node
/**
 * Black-box spec for `pnpm check:links` (src/check-content-links.ts): runs the package script
 * against a fixture content tree passed with `--root` and asserts on what it reports.
 */
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { after, describe, test } from 'node:test';

const docsViewerRoot = join(import.meta.dirname, '..');

/** the content roots check-content-links.ts reads, each with a page that links only to valid targets */
const cleanTree: Record<string, string> = {
  'guides/index.md': [
    '# Guides',
    '',
    '## Setup',
    '',
    '- [a page](./other.md)',
    '- [a heading on a page](./other.md#details)',
    '- [a skill](/skills/some-skill.md)',
    '- [a heading on this page](#setup)',
    '- [a heading, written as it reads](#Setup)',
    '- ![a public image](/images/logo.png)',
    '',
    '::: tip [a page in a container title](./other.md)',
    ':::',
    '',
  ].join('\n'),
  'guides/other.md': '# Other\n\n## Details\n',
  'upgrading/index.md': '# Upgrading\n\nSee [the guides](/guides/index.md).\n',
  'blog/index.md': '# Blog\n',
  'rfcs/index.md': '# RFCs\n',
  'warp-drive-packages/memory-alpha/skills/some-skill.md': '# Some Skill\n\nBack to [setup](/guides/index.md#setup).\n',
  'docs-viewer/docs.warp-drive.io/public/images/logo.png': '',
};

/** a generated API page, which only `--api` checks, and a guide that links into the API pages */
const apiTree: Record<string, string> = {
  'docs-viewer/docs.warp-drive.io/api/index.md': '# API\n\n- [a missing API page](./missing.md)\n',
  'guides/api-links.md': '# API Links\n\n- [an API page](/api/index.md)\n- [a missing API page](/api/missing.md)\n',
};

const brokenPage = [
  '# Broken',
  '',
  '- [a missing page](./missing.md)',
  '- [a missing heading](./other.md#nowhere)',
  '- [a missing skill](/skills/missing-skill.md)',
  '- [a missing heading on a skill](/skills/some-skill.md#nope)',
  '',
  '::: warning [a missing page in a container title](./missing-title.md)',
  ':::',
  '',
  '> [!TIP] [not rendered as a link](./missing-alert.md)',
  '> VitePress renders a GitHub alert title as plain text.',
  '',
  '## 5x Series {#5x-series}',
  '',
  'VitePress renders [this link](#5x-series) as `#_5x-series`, which is not the heading id.',
  '',
].join('\n');

const tempDirs: string[] = [];
after(() => {
  for (const dir of tempDirs) rmSync(dir, { recursive: true, force: true });
});

function createContentRoot(files: Record<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), 'check-content-links-'));
  tempDirs.push(root);
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), content);
  }
  return root;
}

function checkLinks(root: string, flags: string[] = []) {
  const result = spawnSync('pnpm', ['--silent', 'run', 'check:links', '--root', root, ...flags], {
    cwd: docsViewerRoot,
    encoding: 'utf8',
  });
  assert.equal(result.error, undefined, `could not run pnpm: ${result.error?.message}`);
  return {
    status: result.status,
    lines: result.stdout.trim().split('\n'),
    stderr: result.stderr,
  };
}

describe('check:links', () => {
  test('exits 0 when every link and anchor resolves', () => {
    const { status, lines, stderr } = checkLinks(createContentRoot(cleanTree));

    assert.deepEqual(lines, ['checked 6 pages, 0 broken link(s)'], stderr);
    assert.equal(status, 0, stderr);
  });

  test('reports each missing page and missing anchor and exits 1', () => {
    const { status, lines, stderr } = checkLinks(createContentRoot({ ...cleanTree, 'guides/broken.md': brokenPage }));

    assert.deepEqual(
      lines,
      [
        'guides/broken.md:3\tmissing page\t./missing.md',
        'guides/broken.md:4\tmissing anchor\t./other.md#nowhere',
        'guides/broken.md:5\tmissing page\t/skills/missing-skill.md',
        'guides/broken.md:6\tmissing anchor\t/skills/some-skill.md#nope',
        'guides/broken.md:8\tmissing page\t./missing-title.md',
        'guides/broken.md:16\tmissing anchor\t#5x-series',
        'checked 7 pages, 6 broken link(s)',
      ],
      stderr
    );
    assert.equal(status, 1, stderr);
  });

  test('skips the API pages and /api/ links without --api', () => {
    const { status, lines, stderr } = checkLinks(createContentRoot({ ...cleanTree, ...apiTree }));

    assert.deepEqual(lines, ['checked 7 pages, 0 broken link(s)'], stderr);
    assert.equal(status, 0, stderr);
  });

  test('checks the API pages and /api/ links with --api', () => {
    const { status, lines, stderr } = checkLinks(createContentRoot({ ...cleanTree, ...apiTree }), ['--api']);

    assert.deepEqual(
      lines,
      [
        'guides/api-links.md:4\tmissing page\t/api/missing.md',
        'docs-viewer/docs.warp-drive.io/api/index.md:3\tmissing page\t./missing.md',
        'checked 8 pages, 2 broken link(s)',
      ],
      stderr
    );
    assert.equal(status, 1, stderr);
  });
});
