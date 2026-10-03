/* eslint-disable no-console -- a command prints its summary and the surface's diagnostics */
/**
 * `surface <version|head> [--check] [--keep] [--verbose]`, `surface --all [--check] [--keep]`
 *
 * Scans the tag `v<version>` (a detached worktree, removed after) or the working tree for `head`.
 * The baseline's surface is a product file, `surface.<baseline>.json`, which `--check` compares;
 * every other surface is scratch and is written whatever the mode.
 */
import { parseArgs } from 'node:util';

import { DATA_ROOT, releases, report, SCRATCH_ROOT, writeArtifact } from '../artifacts.mts';
import type { Context } from '../cli.mts';
import { isBaseline, surfacePath } from '../data.mts';
import { surfaceOf, type Diagnostic, type Surface } from '../surface.mts';
import { tagOf, withReleaseTree } from '../worktrees.mts';

export const name = 'surface';
export const describe =
  'the surface of a release from its tag, or of the working tree for head; --all for every release and head';

const USAGE = 'usage: surface <version|head> [--check] [--keep] [--verbose] | surface --all [--check] [--keep]';

/** Diagnostics printed per code unless --verbose. */
const SHOWN = 5;

export async function run(
  argv: string[],
  { dataRoot = DATA_ROOT, scratchRoot = SCRATCH_ROOT }: Partial<Context> = {}
): Promise<number> {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      all: { type: 'boolean', default: false },
      check: { type: 'boolean', default: false },
      keep: { type: 'boolean', default: false },
      verbose: { type: 'boolean', default: false },
    },
  });
  if (values.all ? positionals.length > 0 : positionals.length !== 1) throw new Error(USAGE);
  const versions = values.all ? [...releases(dataRoot).releases, 'head'] : positionals;
  for (const version of versions) {
    if (version !== 'head' && !/^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/.test(version)) {
      throw new Error(`surface: '${version}' is neither a version nor head\n${USAGE}`);
    }
  }

  const results = [];
  for (const version of versions) {
    results.push(await writeSurface(version, { ...values, dataRoot, scratchRoot }));
  }
  return report(results, { check: values.check, command: 'surface' });
}

/**
 * Computes the surface of `version` and writes its file (the baseline's is compared instead with
 * `check`).
 */
export async function writeSurface(
  version: string,
  {
    check = false,
    keep = false,
    verbose = false,
    dataRoot = DATA_ROOT,
    scratchRoot = SCRATCH_ROOT,
  }: { check?: boolean; keep?: boolean; verbose?: boolean; dataRoot?: string; scratchRoot?: string } = {}
) {
  return withReleaseTree(
    version,
    (dir) => {
      const diagnostics: Diagnostic[] = [];
      const surface = surfaceOf(dir, { version, tag: tagOf(version), diagnostics });
      printSummary(version, surface, diagnostics, verbose);
      const roots = { dataRoot, scratchRoot };
      return writeArtifact(surfacePath(version, roots), surface, { check, scratch: !isBaseline(version, dataRoot) });
    },
    { keep }
  );
}

function printSummary(version: string, surface: Surface, diagnostics: Diagnostic[], verbose: boolean) {
  const modules = Object.values(surface.modules);
  const exports = modules.flatMap((m) => Object.values(m.exports));
  const external = exports.filter((e) => e.decl.startsWith('external:')).length;
  console.log(
    `surface ${version}: ${modules.length} modules, ${exports.length} exports (${external} external), ${diagnostics.length} notes`
  );
  const byCode: Map<string, string[]> = new Map();
  for (const d of diagnostics) byCode.set(d.code, [...(byCode.get(d.code) ?? []), d.message]);
  for (const [code, messages] of [...byCode].sort(([a], [b]) => (a < b ? -1 : 1))) {
    console.error(`  ${code} (${messages.length})`);
    for (const message of verbose ? messages : messages.slice(0, SHOWN)) console.error(`    ${message}`);
    if (!verbose && messages.length > SHOWN) console.error(`    ... ${messages.length - SHOWN} more (--verbose)`);
  }
}
