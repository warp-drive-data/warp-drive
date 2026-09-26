import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

import { legacyDocsPackageNames } from './site-utils';

type PageMeta = { title?: string; description?: string };

/**
 * Writes `llms-legacy.txt` and `llms-legacy-full.txt`: the `llms.txt`- and `llms-full.txt`-style
 * index and full text of the legacy API pages (`@warp-drive/legacy` and the legacy packages), which
 * config.mts keeps out of `llms.txt` and `llms-full.txt` so agents working on a modern app aren't
 * steered toward them. Apps still on those APIs point their agents here.
 *
 * vitepress-plugin-llms writes only one index and one full-text file, so this builds the second
 * pair from what the build already knows: the package list in nav.json, the per-page title and
 * description that typedoc-plugins/page-meta.mjs recorded, and the `.md` twin the plugin wrote for
 * every page. Each link targets that twin, named the way the plugin names them (`foo/index.md`
 * publishes as `foo.md`). The full text joins the twins, each already opening with the plugin's
 * `url:`/`description:` frontmatter, with the same separator `llms-full.txt` uses. Run after
 * `vitepress build`.
 */
export function emitLegacyLlms(distDir: string, apiTmpDir: string): { pages: number; missingTwins: string[] } {
  const metaPath = join(apiTmpDir, '_page-meta.json');
  if (!existsSync(metaPath)) return { pages: 0, missingTwins: [] };
  const meta = JSON.parse(readFileSync(metaPath, 'utf-8')) as Record<string, PageMeta>;

  const origin = (process.env.HOSTNAME || 'https://canary.warp-drive.io').replace(/\/$/, '');
  const base = process.env.BASE || '/';
  const twinFor = (page: string) =>
    `api/${page.endsWith('/index.md') ? page.slice(0, -'/index.md'.length) : page.slice(0, -'.md'.length)}.md`;
  const entry = (page: string) => {
    const { title, description } = meta[page] ?? {};
    const name = title ?? page.slice(page.lastIndexOf('/') + 1, -'.md'.length);
    return `- [${name}](${origin}${base}${twinFor(page)})${description ? `: ${description}` : ''}`;
  };

  const sections: string[] = [];
  const fullText: string[] = [];
  const missingTwins: string[] = [];
  let count = 0;
  for (const pkg of legacyDocsPackageNames()) {
    const landing = `${pkg}/index.md`;
    const pages = Object.keys(meta)
      .filter((page) => page.startsWith(`${pkg}/`) && page !== landing)
      .sort();
    if (meta[landing]) pages.unshift(landing);
    if (pages.length === 0) continue;
    sections.push([`## ${pkg}`, '', ...pages.map(entry)].join('\n'));
    for (const page of pages) {
      const twin = join(distDir, twinFor(page));
      if (existsSync(twin)) fullText.push(readFileSync(twin, 'utf-8'));
      else missingTwins.push(twinFor(page));
    }
    count += pages.length;
  }

  const header = [
    '# WarpDrive Legacy API',
    '',
    '> API reference for `@warp-drive/legacy` (Models, Adapters, Serializers) and for the legacy `@ember-data/*` and early `@warp-drive/*` packages, kept for apps that have not yet migrated.',
    '',
    `The modern documentation is indexed in ${origin}${base}llms.txt. The full text of every page listed here is in ${origin}${base}llms-legacy-full.txt.`,
  ].join('\n');
  writeFileSync(join(distDir, 'llms-legacy.txt'), `${header}\n\n${sections.join('\n\n')}\n`, 'utf-8');
  writeFileSync(join(distDir, 'llms-legacy-full.txt'), fullText.join('\n---\n\n'), 'utf-8');
  return { pages: count, missingTwins };
}
