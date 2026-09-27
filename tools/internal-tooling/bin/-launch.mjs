/**
 * Entry point shared by the `sync-*` bins.
 *
 * The bins are plain JavaScript because the monorepo root installs this
 * package as an injected copy under `node_modules/.pnpm/...`, and Node refuses
 * to strip types from `.ts` files anywhere under `node_modules`
 * (ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING). When a bin runs from such a
 * copy, it loads the TypeScript sources from the workspace checkout of this
 * package instead, which is also what keeps a bin in sync with local edits.
 */
import { existsSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const PACKAGE_DIR = path.resolve(import.meta.dirname, '..');
const WORKSPACE_LOCATION = path.join('tools', 'internal-tooling');
const NODE_MODULES = `${path.sep}node_modules${path.sep}`;

export function getSourceDir() {
  const index = PACKAGE_DIR.indexOf(NODE_MODULES);
  if (index === -1) {
    return path.join(PACKAGE_DIR, 'src');
  }
  // pnpm keeps its virtual store in the node_modules of the workspace root
  const workspaceRoot = PACKAGE_DIR.slice(0, index);
  const sourceDir = path.join(workspaceRoot, WORKSPACE_LOCATION, 'src');
  if (!existsSync(sourceDir)) {
    throw new Error(
      `@warp-drive/internal-tooling is running from an installed copy at ${PACKAGE_DIR}, and expected its ` +
        `workspace package at ${WORKSPACE_LOCATION} relative to the directory holding that node_modules ` +
        `(${workspaceRoot}), but ${sourceDir} does not exist. Node cannot strip types from files under ` +
        `node_modules, so the sync scripts must run from the workspace sources.`
    );
  }
  return sourceDir;
}

/**
 * @param {string} script the name of a `src/<script>.ts` wrapper, e.g. `sync-all`
 */
export async function launch(script) {
  await import(pathToFileURL(path.join(getSourceDir(), `${script}.ts`)).href);
}
