import { spawnSync } from 'node:child_process';
import { styleText } from 'node:util';

/**
 * Summarize which versions of a package are installed, per package that
 * depends on it, from the output of `pnpm why <pkg>`.
 *
 * @example
 * ```sh
 * node scripts/explain.mjs @warp-drive/core
 * ```
 */

const MarkerLines = new Set(['devDependencies:', 'dependencies:', 'peerDependencies:']);
const GraphMarkers = new Set(['├', '│', '└', '─', '┬']);

async function main() {
  const args = process.argv.slice(2);
  const pkgName = args[0];

  console.log(
    styleText(
      'grey',
      styleText('bold', `Explaining ${styleText('yellow', pkgName)} in ${styleText('yellow', process.cwd())}`)
    )
  );

  const output = spawnSync('pnpm', ['why', pkgName], {
    cwd: process.cwd(),
    env: process.env,
    encoding: 'utf8',
  });
  if (output.error) {
    throw output.error;
  }

  const versions = {};
  let currentSection = null;

  const logLines = output.stdout.split('\n').filter(Boolean);

  for (const line of logLines) {
    if (MarkerLines.has(line)) {
      currentSection = line;
      continue;
    }

    if (currentSection) {
      const sections = line.split(' ');
      while (GraphMarkers.has(sections[0].charAt(0))) {
        sections.shift();
      }
      const [pkg, version, kind] = sections;
      versions[pkg] = versions[pkg] ?? new Set();
      versions[pkg].add(version);
    }
  }

  console.log(versions);
}

await main();
