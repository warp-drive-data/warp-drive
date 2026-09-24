import { copyFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

/**
 * Give every directory-index page a Markdown twin at the URL a reader would guess.
 *
 * vitepress-plugin-llms writes an LLM-friendly `.md` copy of every page into the build output,
 * but for a `foo/index.md` source it names the copy `foo.md`. With `cleanUrls` on, VitePress
 * gives that same page the trailing-slash URL `/foo/`, so appending `.md` to the address bar asks
 * for `/foo/.md`, which nothing serves. (GitHub Pages does not serve dotfiles, so emitting a
 * literal `.md` file inside the directory is not an option.)
 *
 * This copies each `foo.md` that sits beside a `foo/index.html` to `foo/index.md`, so
 * `/foo/index.md` works the way `/foo/index.html` already does. Leaf pages (`/foo/bar` →
 * `/foo/bar.md`) need nothing. Run after `vitepress build`.
 */
export function emitIndexMarkdown(distDir: string): number {
  let copied = 0;

  const visit = (dir: string): void => {
    for (const entry of readdirSync(dir)) {
      const entryPath = join(dir, entry);
      if (statSync(entryPath).isDirectory()) {
        const sibling = `${entryPath}.md`;
        const target = join(entryPath, 'index.md');
        if (existsSync(join(entryPath, 'index.html')) && existsSync(sibling) && !existsSync(target)) {
          copyFileSync(sibling, target);
          copied++;
        }
        visit(entryPath);
      }
    }
  };

  visit(distDir);
  return copied;
}
