#!/usr/bin/env node
/**
 * Spec for the blog's RSS feed (src/emit-blog-feed.ts), run against a fixture docs root shaped
 * like the synced copy of `blog/` that `prepare-website.ts` writes.
 */
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { after, describe, test } from 'node:test';

import { emitBlogFeed } from '../src/emit-blog-feed.ts';
import { blogPosts } from '../src/site-utils.ts';

const tempDirs: string[] = [];
after(() => {
  for (const dir of tempDirs) rmSync(dir, { recursive: true, force: true });
});

function fixture(files: Record<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), 'blog-feed-'));
  tempDirs.push(root);
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), content);
  }
  return root;
}

const post = (frontmatter: string, body = '# Heading\n') => `---\n${frontmatter}\n---\n\n${body}`;

describe('blog feed', () => {
  test('lists published posts newest first, skipping section indexes and drafts', () => {
    const root = fixture({
      'blog/index.md': post('title: Blog'),
      'blog/_meta.json': JSON.stringify({ items: ['v5'] }),
      'blog/v5/index.md': post('title: 5.x'),
      'blog/v5/older.md': post('title: Older\ndate: 2026-01-02'),
      'blog/v5/newer.md': post("title: Newer\ndescription: A newer post.\ndate: '2026-03-04'"),
      'blog/v5/hidden.md': post('title: Hidden\ndate: 2026-05-06\ndraft: true'),
      'blog/v6/_meta.json': JSON.stringify({ draft: true }),
      'blog/v6/future.md': post('title: Future\ndate: 2027-01-01'),
    });

    assert.deepEqual(blogPosts(root), [
      { source: 'blog/v5/newer.md', title: 'Newer', description: 'A newer post.', date: '2026-03-04' },
      { source: 'blog/v5/older.md', title: 'Older', description: undefined, date: '2026-01-02' },
    ]);
  });

  test('falls back to the H1 when a post has no frontmatter title', () => {
    const root = fixture({ 'blog/v5/untitled.md': post('date: 2026-01-02', '# From The Heading\n') });
    assert.equal(blogPosts(root)[0].title, 'From The Heading');
  });

  test('fails on a post without a YYYY-MM-DD date', () => {
    const missing = fixture({ 'blog/v5/undated.md': post('title: Undated') });
    assert.throws(() => blogPosts(missing), /blog\/v5\/undated\.md .* no frontmatter `date`/);

    const malformed = fixture({ 'blog/v5/bad.md': post("title: Bad\ndate: 'Sept 5'") });
    assert.throws(() => blogPosts(malformed), /blog\/v5\/bad\.md .* no frontmatter `date`/);
  });

  test('writes RSS 2.0 with escaped text and permanent clean-URL links', () => {
    const root = fixture({
      'blog/v5/a-and-b.md': post("title: A & B <ok>\ndescription: Why \"this\" matters\ndate: 2026-09-05"),
    });
    const out = mkdtempSync(join(tmpdir(), 'blog-feed-out-'));
    tempDirs.push(out);

    assert.equal(emitBlogFeed(out, 'https://warp-drive.io/', root), 1);
    const xml = readFileSync(join(out, 'blog/feed.xml'), 'utf-8');

    assert.match(xml, /^<\?xml version="1\.0" encoding="UTF-8"\?>\n<rss version="2\.0"/);
    assert.match(xml, /<atom:link href="https:\/\/warp-drive\.io\/blog\/feed\.xml" rel="self"/);
    assert.match(xml, /<title>A &amp; B &lt;ok&gt;<\/title>/);
    assert.match(xml, /<description>Why &quot;this&quot; matters<\/description>/);
    assert.match(xml, /<link>https:\/\/warp-drive\.io\/blog\/v5\/a-and-b<\/link>/);
    assert.match(xml, /<guid isPermaLink="true">https:\/\/warp-drive\.io\/blog\/v5\/a-and-b<\/guid>/);
    assert.match(xml, /<pubDate>Sat, 05 Sep 2026 00:00:00 GMT<\/pubDate>/);
    assert.match(xml, /<lastBuildDate>Sat, 05 Sep 2026 00:00:00 GMT<\/lastBuildDate>/);
  });
});
