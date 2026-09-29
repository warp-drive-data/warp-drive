import { glob, stat } from 'node:fs/promises';
import path from 'node:path';

function isFile(filePath: string): Promise<boolean> {
  return stat(filePath).then(
    (stats) => stats.isFile(),
    () => false
  );
}

/**
 * Yields every file (never a directory) below `cwd` that matches `pattern`,
 * as a path relative to `cwd`.
 *
 * A symbolic link to a file is yielded like the file itself; a broken link, or
 * a link to a directory, is not. Whether a linked directory is descended into
 * is left to `fs.promises.glob`, which does so only when a pattern segment
 * matches the link's own name (`**\/*` does, `**\/*.d.ts` does not).
 *
 * `fs.promises.glob` on its own also yields directories, which the callers
 * here would then try to read as files.
 *
 * @internal
 */
export async function* scanFiles(pattern: string, cwd: string): AsyncGenerator<string> {
  const root = path.resolve(cwd);
  for await (const entry of glob(pattern, { cwd: root, withFileTypes: true })) {
    const fullPath = path.resolve(root, entry.parentPath, entry.name);
    if (entry.isFile() || (entry.isSymbolicLink() && (await isFile(fullPath)))) {
      yield path.relative(root, fullPath);
    }
  }
}
