import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { type BlogPost, blogPosts } from './site-utils.ts';

/** Where the feed is published, relative to the site root. config.mts advertises it in every page's `<head>`. */
export const BLOG_FEED_PATH = 'blog/feed.xml';

const FEED_TITLE = 'WarpDrive Blog';
const FEED_DESCRIPTION = 'Release announcements and other point-in-time posts from the WarpDrive project.';

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** RFC 822 date, as RSS 2.0 requires; posts are dated by day, so each is stamped at UTC midnight */
function rfc822(date: string): string {
  return new Date(`${date}T00:00:00Z`).toUTCString();
}

/**
 * Renders an RSS 2.0 feed of `posts`, which must already be sorted newest first. Each item links
 * to the post's clean URL (`cleanUrls` is on), which is also its `guid`: blog URLs are permanent
 * (see /guides/contributing/writing-documentation/writing-guides.md#upgrading-and-blog-pages), so
 * a reader never sees the same post twice.
 */
export function renderBlogFeed(posts: BlogPost[], siteUrl: string): string {
  const site = siteUrl.replace(/\/$/, '');
  const items = posts.map((post) => {
    const link = `${site}/${post.source.replace(/\.md$/, '')}`;
    return [
      '    <item>',
      `      <title>${escapeXml(post.title)}</title>`,
      `      <link>${escapeXml(link)}</link>`,
      `      <guid isPermaLink="true">${escapeXml(link)}</guid>`,
      `      <pubDate>${rfc822(post.date)}</pubDate>`,
      ...(post.description ? [`      <description>${escapeXml(post.description)}</description>`] : []),
      '    </item>',
    ].join('\n');
  });

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '  <channel>',
    `    <title>${FEED_TITLE}</title>`,
    `    <link>${escapeXml(`${site}/blog/`)}</link>`,
    `    <atom:link href="${escapeXml(`${site}/${BLOG_FEED_PATH}`)}" rel="self" type="application/rss+xml" />`,
    `    <description>${FEED_DESCRIPTION}</description>`,
    '    <language>en</language>',
    ...(posts.length ? [`    <lastBuildDate>${rfc822(posts[0].date)}</lastBuildDate>`] : []),
    ...items,
    '  </channel>',
    '</rss>',
    '',
  ].join('\n');
}

/**
 * Writes the blog's RSS feed to `<outDir>/blog/feed.xml`. `siteUrl` is the site's origin plus its
 * `base`, e.g. `https://warp-drive.io/`. Run from config.mts's `buildEnd`, after the synced copies
 * of `blog/` are in place.
 */
export function emitBlogFeed(outDir: string, siteUrl: string, docsRoot?: string): number {
  const posts = blogPosts(docsRoot);
  const target = join(outDir, BLOG_FEED_PATH);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, renderBlogFeed(posts, siteUrl));
  return posts.length;
}
