import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

import { legacyPackageNames } from './site-utils';

type PageMeta = { title?: string; description?: string };

/**
 * Writes `llms-legacy.txt`: the `llms.txt`-style index of the legacy packages' API pages, which
 * config.mts keeps out of `llms.txt` and `llms-full.txt` so the main index isn't doubled by
 * packages that mostly re-export modern ones. Apps still on those packages point their agents here.
 *
 * vitepress-plugin-llms writes only one index, so this builds the second from what the build
 * already knows: the legacy package list in nav.json and the per-page title and description that
 * typedoc-plugins/page-meta.mjs recorded. Each link targets the page's `.md` twin, named the way
 * the plugin names them (`foo/index.md` publishes as `foo.md`). Run after `vitepress build`.
 */
export function emitLegacyLlms(distDir: string, apiTmpDir: string): number {
  const metaPath = join(apiTmpDir, '_page-meta.json');
  if (!existsSync(metaPath)) return 0;
  const meta = JSON.parse(readFileSync(metaPath, 'utf-8')) as Record<string, PageMeta>;

  const origin = (process.env.HOSTNAME || 'https://canary.warp-drive.io').replace(/\/$/, '');
  const base = process.env.BASE || '/';
  const urlFor = (page: string) => {
    const path = page.endsWith('/index.md') ? page.slice(0, -'/index.md'.length) : page.slice(0, -'.md'.length);
    return `${origin}${base}api/${path}.md`;
  };
  const entry = (page: string) => {
    const { title, description } = meta[page] ?? {};
    const name = title ?? page.slice(page.lastIndexOf('/') + 1, -'.md'.length);
    return `- [${name}](${urlFor(page)})${description ? `: ${description}` : ''}`;
  };

  const sections: string[] = [];
  let count = 0;
  for (const pkg of legacyPackageNames()) {
    const landing = `${pkg}/index.md`;
    const pages = Object.keys(meta)
      .filter((page) => page.startsWith(`${pkg}/`) && page !== landing)
      .sort();
    if (!meta[landing] && pages.length === 0) continue;
    const lines = [`## ${pkg}`, ''];
    if (meta[landing]) lines.push(entry(landing));
    lines.push(...pages.map(entry));
    count += lines.length - 2;
    sections.push(lines.join('\n'));
  }

  const header = [
    '# WarpDrive Legacy Packages',
    '',
    '> API reference for the legacy `@ember-data/*` and early `@warp-drive/*` packages, kept for apps that have not yet migrated.',
    '',
    `Most of these packages re-export a modern WarpDrive package; the modern documentation is indexed in ${origin}${base}llms.txt.`,
  ].join('\n');
  writeFileSync(join(distDir, 'llms-legacy.txt'), `${header}\n\n${sections.join('\n\n')}\n`, 'utf-8');
  return count;
}
