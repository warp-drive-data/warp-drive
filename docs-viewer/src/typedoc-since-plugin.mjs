import { readFileSync, existsSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { Converter, Renderer, ReflectionKind } from 'typedoc';

/**
 * TypeDoc's `packages` entry point strategy fully converts each package in isolation, then
 * serializes that project to plain JSON and rebuilds fresh reflection objects from it to merge
 * all packages together (see `_convertPackages` -> `projectToObject` / `reviveProjects` in
 * typedoc's dist). That round-trip drops the package's own `@module` doc comment down to a
 * plain-text `readme` blob, discarding every block tag (`@since` included) along the way — there
 * is no structured place left for `@since` to land by the time rendering happens.
 *
 * This plugin sidesteps that entirely: it reads each package's own `@since` straight out of its
 * entry file's `@module` comment (a couple of regexes, not TypeDoc's comment parser) while that
 * package is being converted, keeps it in memory here, and reattaches it as a synthetic `## Since`
 * section on the package's readme right before rendering — where our post-processing in
 * site-utils.ts already knows how to turn a `## Since` section into a `<SinceBadge>`.
 */

const sinceByPackageName = new Map();

// Only the package's own root entry file (`<package>/src/index.ts`) maps cleanly to a single
// top-level Module reflection named after the npm package; other entry files become submodules
// whose final reflection name doesn't follow a fixed convention, so they're left for later.
function readModuleSince(entryFile) {
  if (basename(entryFile) !== 'index.ts') return;

  const packageDir = dirname(dirname(entryFile));
  const packageJsonPath = join(packageDir, 'package.json');
  if (!existsSync(packageJsonPath)) return;

  const source = readFileSync(entryFile, 'utf-8');
  const leadingComment = /^\/\*\*([\s\S]*?)\*\//.exec(source);
  if (!leadingComment || !/@module\b/.test(leadingComment[1])) return;

  const sinceMatch = /@since\s+(\S+)/.exec(leadingComment[1]);
  if (!sinceMatch) return;

  const { name } = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
  sinceByPackageName.set(name, sinceMatch[1]);
}

export function load(app) {
  app.converter.on(Converter.EVENT_BEGIN, () => {
    for (const entryPoint of app.options.getValue('entryPoints')) {
      readModuleSince(entryPoint);
    }
  });

  app.renderer.on(Renderer.EVENT_BEGIN, (event) => {
    for (const reflection of event.project.getReflectionsByKind(ReflectionKind.Module)) {
      const since = sinceByPackageName.get(reflection.name);
      if (since && Array.isArray(reflection.readme)) {
        reflection.readme.push({ kind: 'text', text: `\n\n## Since\n\n${since}\n` });
      }
    }
  });
}
