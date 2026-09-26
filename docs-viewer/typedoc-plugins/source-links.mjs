import { GREATEST_LOWER_BOUND, LEAST_UPPER_BOUND, originalPositionFor, TraceMap } from '@jridgewell/trace-mapping';
import { findWorkspacePackagesNoCheck } from '@pnpm/find-workspace-packages';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { Converter } from 'typedoc';

const gitRevision = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf-8' }).trim();
const repoRoot = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf-8' }).trim();

function toRepoPath(fullFileName) {
  return relative(repoRoot, fullFileName).split(sep).join('/');
}

function toSourceUrl(fullFileName, line) {
  return `https://github.com/warp-drive-data/warp-drive/blob/${gitRevision}/${toRepoPath(fullFileName)}#L${line}`;
}

function isInstalledCopy(fullFileName) {
  return fullFileName.split(/[\\/]/).includes('node_modules');
}

/** The directory of the nearest package.json at or above `file`. */
function findPackageRoot(file) {
  let dir = dirname(file);
  while (!existsSync(join(dir, 'package.json'))) {
    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
  return dir;
}

/**
 * Maps a position in an installed copy of a workspace package's `.d.ts` back to the
 * workspace source it was compiled from, using the `.d.ts.map` that the package build
 * emits next to it. Returns null for anything that isn't a workspace package or has no
 * usable declaration map.
 */
function createWorkspaceSourceMapper(workspaceDirs) {
  const traceMaps = new Map();

  function getTraceMap(installedFile, workspaceFile) {
    if (!traceMaps.has(installedFile)) {
      const mapFile = `${installedFile}.map`;
      // Resolve the map's `sources` against the workspace copy of the file, not the
      // installed one: the installed package only ships `dist`, so its relative `../src`
      // paths only exist in the workspace.
      traceMaps.set(
        installedFile,
        existsSync(mapFile) ? new TraceMap(readFileSync(mapFile, 'utf-8'), workspaceFile) : null
      );
    }
    return traceMaps.get(installedFile);
  }

  return function mapToWorkspaceSource(fullFileName, line, character) {
    const pkgRoot = findPackageRoot(fullFileName);
    if (!pkgRoot) return null;
    const { name } = JSON.parse(readFileSync(join(pkgRoot, 'package.json'), 'utf-8'));
    const workspaceDir = workspaceDirs.get(name);
    if (!workspaceDir) return null;

    const map = getTraceMap(fullFileName, join(workspaceDir, relative(pkgRoot, fullFileName)));
    if (!map) return null;

    // typedoc records the 1-based line and 0-based column of the declaration's name,
    // which is what trace-mapping expects. Fall back to the nearest mapped segment on
    // the same line when the name itself has no segment.
    for (const bias of [GREATEST_LOWER_BOUND, LEAST_UPPER_BOUND]) {
      const pos = originalPositionFor(map, { line, column: character, bias });
      if (pos.source && pos.line !== null && existsSync(pos.source) && !isInstalledCopy(pos.source)) {
        return { fullFileName: pos.source, line: pos.line, character: pos.column };
      }
    }
    return null;
  };
}

/**
 * Fixes "Defined in" source locations and links.
 *
 * 1. typedoc's built-in git detection considers a repository valid only when `.git` is a
 *    directory, so in a git worktree (where `.git` is a file) it produces no `source.url`.
 *    We fill in any `source.url` it left unset via the `git` CLI, which resolves worktrees.
 *
 * 2. pnpm installs workspace dependencies here as injected copies under
 *    `node_modules/.pnpm/`, so when one package re-exports another's API (e.g.
 *    `@warp-drive/experiments/pagination` re-exporting `@warp-drive/core`, or
 *    `@warp-drive/core/build-config` re-exporting `@warp-drive/build-config`), TypeScript
 *    resolves the symbol to the injected copy's `dist/*.d.ts` rather than the workspace
 *    source, and the link points at a path that doesn't exist on GitHub. We map those back
 *    to `warp-drive-packages/<pkg>/src` through the package's declaration maps.
 *
 * 3. Members inherited from third-party types (TypeScript's lib `Array`/`Error`/`Headers`,
 *    `EmberObject`, glimmer's `Component`) are declared in files we can't link to, so we
 *    drop those source entries instead of emitting a link that 404s.
 *
 * Runs after typedoc's own resolve step, which is where it assigns `fileName` and `url`.
 */
export async function load(app) {
  const workspacePackages = await findWorkspacePackagesNoCheck(repoRoot);
  const workspaceDirs = new Map(workspacePackages.map((pkg) => [pkg.manifest.name, pkg.dir]));
  const mapToWorkspaceSource = createWorkspaceSourceMapper(workspaceDirs);

  app.converter.on(Converter.EVENT_RESOLVE_END, (context) => {
    for (const id in context.project.reflections) {
      const refl = context.project.reflections[id];
      if (!refl.sources) continue;

      refl.sources = refl.sources.filter((source) => {
        if (!isInstalledCopy(source.fullFileName)) {
          source.url ??= toSourceUrl(source.fullFileName, source.line);
          return true;
        }

        const mapped = mapToWorkspaceSource(source.fullFileName, source.line, source.character);
        if (!mapped) return false;

        // `fileName` is relative to the base path typedoc picked for this package; keep
        // the remapped one relative to the same base so it reads like its neighbors.
        source.fileName = source.fullFileName.endsWith(source.fileName)
          ? relative(source.fullFileName.slice(0, -source.fileName.length), mapped.fullFileName).split(sep).join('/')
          : toRepoPath(mapped.fullFileName);
        source.fullFileName = mapped.fullFileName;
        source.line = mapped.line;
        source.character = mapped.character;
        source.url = toSourceUrl(mapped.fullFileName, mapped.line);
        return true;
      });
      if (refl.sources.length === 0) refl.sources = undefined;
    }
  });
}
