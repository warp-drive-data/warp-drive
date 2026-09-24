import { execFileSync } from 'node:child_process';
import { relative } from 'node:path';
import { Converter } from 'typedoc';

const gitRevision = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf-8' }).trim();
const repoRoot = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf-8' }).trim();

function toSourceUrl(fullFileName, line) {
  const relPath = relative(repoRoot, fullFileName).split('\\').join('/');
  return `https://github.com/warp-drive-data/warp-drive/blob/${gitRevision}/${relPath}#L${line}`;
}

/**
 * typedoc's built-in git detection considers a repository valid only when `.git` is a
 * directory (via `fs.stat(...).isDirectory()`), so it silently produces no `source.url`
 * (no error, just a plain-text "Defined in" with no link) when docs are generated from a
 * git worktree, where `.git` is a file pointing at the real gitdir elsewhere. We can't fix
 * that detection from a plugin, so instead we fill in any `source.url` it left unset,
 * computing the same GitHub blob link ourselves via the `git` CLI, which resolves
 * worktrees fine. This runs after typedoc's own resolve step so it only backfills gaps
 * rather than fighting the normal (non-worktree) path.
 */
export function load(app) {
  app.converter.on(Converter.EVENT_RESOLVE_END, (context) => {
    for (const id in context.project.reflections) {
      const refl = context.project.reflections[id];
      for (const source of refl.sources ?? []) {
        source.url ??= toSourceUrl(source.fullFileName, source.line);
      }
    }
  });
}
