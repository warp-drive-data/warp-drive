#! /usr/bin/env bun
/**
 * VitePress's build fails on a link to a missing page but never checks the `#anchor` part
 * (its dead-link check strips `[?#].*` before recording the link), so a renamed heading
 * silently breaks every link to it.
 */
import { existsSync, globSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { createMarkdownRenderer } from 'vitepress';

const repoRoot = resolve(import.meta.dir, '../..');
const siteDir = resolve(import.meta.dir, '../docs.warp-drive.io');
const contentRoots = ['guides', 'upgrading', 'blog'];

interface Problem {
  file: string;
  line: number;
  href: string;
  reason: 'missing page' | 'missing anchor';
}

function proseLines(markdown: string): string[] {
  let inFence = false;
  return markdown.split('\n').map((line) => {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      return '';
    }
    return inFence ? '' : line;
  });
}

/** rendered anchor ids keyed by repo-relative page path, e.g. `guides/index.md` */
async function loadAnchors(): Promise<Map<string, Set<string>>> {
  // shiki warns about every code fence whose language it does not know; that noise is not a link problem
  const md = await createMarkdownRenderer(siteDir, undefined, undefined, { warn() {} });
  const anchorsByPage = new Map<string, Set<string>>();
  for (const root of contentRoots) {
    for (const file of globSync('**/*.md', { cwd: join(repoRoot, root) })) {
      const path = join(root, file);
      const html = md.render(readFileSync(join(repoRoot, path), 'utf8'), {
        path: join(repoRoot, path),
        relativePath: path,
        cleanUrls: false,
      });
      anchorsByPage.set(path, new Set(Array.from(html.matchAll(/<[a-z][^>]*\sid="([^"]*)"/gi), (match) => match[1])));
    }
  }
  return anchorsByPage;
}

const linkPattern = /!?\[[^\]]*\]\(\s*(<[^>]*>|[^)\s]+)(?:\s+"[^"]*")?\s*\)|\s(?:src|href)="([^"]+)"/g;

function* linksIn(lines: string[]): Generator<{ line: number; href: string }> {
  for (const [index, line] of lines.entries()) {
    for (const match of line.matchAll(linkPattern)) {
      const raw = match[1] ?? match[2];
      yield { line: index + 1, href: raw.replace(/^<|>$/g, '') };
    }
  }
}

function isOutOfScope(href: string): boolean {
  return /^(https?:|mailto:|data:|\/api\/)/.test(href);
}

function resolveTarget(fromFile: string, target: string): string | undefined {
  const base = target.startsWith('/') ? join(repoRoot, target) : join(repoRoot, dirname(fromFile), target);
  const withoutHtml = base.replace(/\.html$/, '');
  const candidates = [base, `${withoutHtml}.md`, join(withoutHtml, 'index.md')];
  const found = candidates.find((candidate) => existsSync(candidate));
  return found === undefined ? undefined : relative(repoRoot, found);
}

function findProblems(anchorsByPage: Map<string, Set<string>>): Problem[] {
  const problems: Problem[] = [];
  for (const [file, ownAnchors] of anchorsByPage) {
    const lines = proseLines(readFileSync(join(repoRoot, file), 'utf8'));
    for (const { line, href } of linksIn(lines)) {
      if (isOutOfScope(href)) continue;
      const [target, anchor] = href.split('#');
      let destinationAnchors: Set<string> | undefined = ownAnchors;
      if (target) {
        const resolved = resolveTarget(file, target);
        if (resolved === undefined) {
          problems.push({ file, line, href, reason: 'missing page' });
          continue;
        }
        destinationAnchors = anchorsByPage.get(resolved);
      }
      if (anchor && destinationAnchors && !destinationAnchors.has(anchor)) {
        problems.push({ file, line, href, reason: 'missing anchor' });
      }
    }
  }
  return problems;
}

const anchorsByPage = await loadAnchors();
const problems = findProblems(anchorsByPage);
for (const { file, line, href, reason } of problems) {
  console.log(`${file}:${line}\t${reason}\t${href}`);
}
console.log(`checked ${anchorsByPage.size} pages, ${problems.length} broken link(s)`);
process.exit(problems.length === 0 ? 0 : 1);
