import { glob } from 'node:fs/promises';
import path from 'node:path';

/**
 * Yields every file (never a directory) below `cwd` that matches `pattern`,
 * as a path relative to `cwd`.
 *
 * `fs.promises.glob` on its own also yields directories, which the callers
 * here would then try to read as files.
 *
 * @internal
 */
export async function* scanFiles(pattern: string, cwd: string): AsyncGenerator<string> {
  const root = path.resolve(cwd);
  for await (const entry of glob(pattern, { cwd: root, withFileTypes: true })) {
    if (entry.isFile()) {
      yield path.relative(root, path.resolve(root, entry.parentPath, entry.name));
    }
  }
}
